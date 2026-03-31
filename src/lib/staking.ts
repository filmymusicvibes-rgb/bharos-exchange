// BRS Staking Logic — Firestore-based
import { db } from "./firebase"
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, Timestamp } from "firebase/firestore"

export interface StakePlan {
  id: string
  name: string
  lockDays: number
  apy: number
  emoji: string
  color: string
  minStake: number
}

export const STAKE_PLANS: StakePlan[] = [
  { id: "bronze", name: "Bronze", lockDays: 30, apy: 8, emoji: "🥉", color: "#cd7f32", minStake: 50 },
  { id: "silver", name: "Silver", lockDays: 90, apy: 15, emoji: "🥈", color: "#c0c0c0", minStake: 50 },
  { id: "gold", name: "Gold", lockDays: 180, apy: 25, emoji: "🥇", color: "#ffd700", minStake: 100 },
  { id: "diamond", name: "Diamond", lockDays: 365, apy: 40, emoji: "💎", color: "#b9f2ff", minStake: 200 },
]

export interface StakeRecord {
  id?: string
  email: string
  amount: number
  planId: string
  planName: string
  lockDays: number
  apy: number
  rewardAmount: number
  stakedAt: any
  unlocksAt: any
  status: "active" | "completed" | "withdrawn"
}

// Calculate reward for a stake
export function calculateReward(amount: number, apy: number, lockDays: number): number {
  return Math.round((amount * (apy / 100) * (lockDays / 365)) * 100) / 100
}

// Get days remaining
export function getDaysRemaining(unlocksAt: any): number {
  const now = Date.now()
  const unlock = unlocksAt?.seconds ? unlocksAt.seconds * 1000 : unlocksAt
  const diff = unlock - now
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// Get progress percentage
export function getProgress(stakedAt: any, unlocksAt: any): number {
  const now = Date.now()
  const start = stakedAt?.seconds ? stakedAt.seconds * 1000 : stakedAt
  const end = unlocksAt?.seconds ? unlocksAt.seconds * 1000 : unlocksAt
  const total = end - start
  const elapsed = now - start
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

// Create a new stake
export async function createStake(email: string, amount: number, plan: StakePlan): Promise<boolean> {
  try {
    const userRef = doc(db, "users", email)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) return false

    const userData: any = userSnap.data()
    const currentBrs = userData.brsBalance || 0

    if (currentBrs < amount) return false
    if (amount < plan.minStake) return false

    const reward = calculateReward(amount, plan.apy, plan.lockDays)
    const now = new Date()
    const unlockDate = new Date(now.getTime() + plan.lockDays * 24 * 60 * 60 * 1000)

    // Deduct BRS from balance
    await updateDoc(userRef, {
      brsBalance: currentBrs - amount,
      brsStaked: (userData.brsStaked || 0) + amount,
    })

    // Create stake record
    await addDoc(collection(db, "stakes"), {
      email,
      amount,
      planId: plan.id,
      planName: plan.name,
      lockDays: plan.lockDays,
      apy: plan.apy,
      rewardAmount: reward,
      stakedAt: Timestamp.fromDate(now),
      unlocksAt: Timestamp.fromDate(unlockDate),
      status: "active",
    })

    return true
  } catch (err) {
    console.error("Stake error:", err)
    return false
  }
}

// Withdraw a completed stake
export async function withdrawStake(stakeId: string, email: string): Promise<boolean> {
  try {
    const stakeRef = doc(db, "stakes", stakeId)
    const stakeSnap = await getDoc(stakeRef)
    if (!stakeSnap.exists()) return false

    const stake: any = stakeSnap.data()
    if (stake.status !== "active") return false

    const daysLeft = getDaysRemaining(stake.unlocksAt)
    const isEarly = daysLeft > 0

    let reward = stake.rewardAmount // Full reward if completed

    if (isEarly) {
      // Calculate proportional reward based on time served
      const totalDays = stake.lockDays
      const daysServed = totalDays - daysLeft
      const proportionalReward = (stake.rewardAmount * daysServed) / totalDays
      // Apply 50% penalty on proportional reward
      reward = Math.floor(proportionalReward * 0.5)
      // Burned amount (removed from supply — not given to anyone)
      const burned = Math.floor(proportionalReward * 0.5)
      console.log(`🔥 Burned ${burned} BRS from early withdrawal penalty`)
    }

    const totalReturn = stake.amount + reward

    const userRef = doc(db, "users", email)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) return false

    const userData: any = userSnap.data()

    await updateDoc(userRef, {
      brsBalance: (userData.brsBalance || 0) + totalReturn,
      brsStaked: Math.max(0, (userData.brsStaked || 0) - stake.amount),
    })

    await updateDoc(stakeRef, {
      status: "withdrawn",
      withdrawnAt: Timestamp.fromDate(new Date()),
      actualReward: reward,
      earlyWithdraw: isEarly,
    })

    return true
  } catch (err) {
    console.error("Withdraw stake error:", err)
    return false
  }
}

// Load user's stakes
export async function loadUserStakes(email: string): Promise<StakeRecord[]> {
  try {
    const q = query(collection(db, "stakes"), where("email", "==", email))
    const snap = await getDocs(q)
    const stakes: StakeRecord[] = []
    snap.forEach(d => {
      stakes.push({ id: d.id, ...d.data() } as StakeRecord)
    })
    // Sort: active first, then by date
    stakes.sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1
      if (a.status !== "active" && b.status === "active") return 1
      return 0
    })
    return stakes
  } catch (err) {
    console.error("Load stakes error:", err)
    return []
  }
}
