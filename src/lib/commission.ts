/**
 * Commission Engine — Shared referral commission & rewards logic
 * 
 * Used by both ActivateMembership (auto-activate) and AdminPanel (manual approve)
 */

import { db } from "./firebase"
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  increment
} from "firebase/firestore"
import { updateTokenPhase } from "./tokenPhase"

// 📝 Transaction Logger

export const logTransaction = async (
  userId: string,
  amount: number,
  currency: string,
  description: string
) => {

  await addDoc(collection(db, "transactions"), {
    userId: userId,
    amount: Number(amount),
    currency: currency,
    description: description,
    createdAt: new Date()
  })

}

// 💰 MLM Commission Engine (12 Levels) — uses increment() for atomic updates

export const distributeReferral = async (userData: any, allUsers: any[]) => {

  const rewards = [
    2, 0.8, 0.75, 0.65, 0.55, 0.50,
    0.45, 0.40, 0.35, 0.30, 0.25, 1
  ]

  let currentRef = userData.referredBy

  for (let i = 0; i < 12; i++) {

    if (!currentRef || currentRef === "none") break

    const uplineUser = allUsers.find(
      (u: any) => u.referralCode === currentRef
    )

    if (!uplineUser || !uplineUser.email) break

    // 🏢 SKIP company account — no commissions needed for company
    if (uplineUser.role === "company" || uplineUser.referralCode === "BRS44447") {
      console.log(`🏢 Skipped Level ${i + 1} — company account (${uplineUser.email})`)
      currentRef = uplineUser.referredBy
      continue
    }

    // 🔒 ONLY distribute to ACTIVE users — skip inactive/pending
    if (uplineUser.status === "active") {

      const userEmail = uplineUser.email
      const reward = rewards[i]

      // 🔥 Atomic increment
      await updateDoc(doc(db, "users", userEmail), {
        usdtBalance: increment(reward)
      })

      await logTransaction(
        userEmail,
        reward,
        "USDT",
        `Level ${i + 1} referral commission`
      )

    } else {
      console.log(`⏭️ Skipped Level ${i + 1} commission — ${uplineUser.email} is not active (status: ${uplineUser.status})`)
    }

    // Continue walking up the chain regardless
    currentRef = uplineUser.referredBy

  }

}

// 🎁 Special Rewards Engine (Direct 10, Matrix 3+9+27, Trip Achievement)

export const checkSpecialRewards = async (userEmail: string, userData: any, allUsers: any[]) => {

  // Level 1 members
  const level1Users = allUsers.filter(
    u => u.referredBy === userData.referralCode && u.status === "active"
  )
  const level1Count = level1Users.length

  // Level 2 members
  const level1Codes = level1Users.map(u => u.referralCode)
  const level2Users = allUsers.filter(
    u => level1Codes.includes(u.referredBy) && u.status === "active"
  )
  const level2Count = level2Users.length

  // Level 3 members
  const level2Codes = level2Users.map(u => u.referralCode)
  const level3Users = allUsers.filter(
    u => level2Codes.includes(u.referredBy) && u.status === "active"
  )
  const level3Count = level3Users.length

  // Level 4 members
  const level3Codes = level3Users.map(u => u.referralCode)
  const level4Users = allUsers.filter(
    u => level3Codes.includes(u.referredBy) && u.status === "active"
  )
  const level4Count = level4Users.length

  // Total Team
  const totalTeam = level1Count + level2Count + level3Count + level4Count

  // Single fetch for reward flag checks
  const freshSnap = await getDoc(doc(db, "users", userEmail))
  const freshUser: any = freshSnap.data()

  // 🎁 REWARD 1: DIRECT 10 ($20)
  if (level1Count >= 10 && !freshUser?.directRewardPaid) {
    await updateDoc(doc(db, "users", userEmail), {
      usdtBalance: increment(20),
      directRewardPaid: true
    })

    await logTransaction(userEmail, 20, "USDT", "Direct 10 referral reward")
    console.log(`✅ Direct reward $20 credited to ${userEmail}`)
  }

  // 🎁 REWARD 2: MATRIX 3+9+27 ($30)
  if (
    level1Count >= 3 &&
    level2Count >= 9 &&
    level3Count >= 27 &&
    !freshUser?.matrixRewardPaid
  ) {
    await updateDoc(doc(db, "users", userEmail), {
      usdtBalance: increment(30),
      matrixRewardPaid: true
    })

    await logTransaction(userEmail, 30, "USDT", "Matrix reward (3+9+27)")
    console.log(`✅ Matrix reward $30 credited to ${userEmail}`)
  }

  // 🎁 REWARD 3: TRIP ACHIEVEMENT (100 team)
  if ((level4Count >= 81 || totalTeam >= 100) && !freshUser?.tripAchieved) {
    await updateDoc(doc(db, "users", userEmail), {
      tripAchieved: true,
      tripNotified: false
    })

    await logTransaction(
      userEmail,
      0,
      "SYSTEM",
      `Trip Achieved — Team: ${totalTeam} (L1:${level1Count} L2:${level2Count} L3:${level3Count} L4:${level4Count})`
    )

    console.log(`✅ Trip achieved for ${userEmail} — Team: ${totalTeam}`)
  }

}

// 🔥 Check Upline Rewards — walks UP the referral chain

export const checkUplineRewards = async (activatedUser: any, allUsers: any[]) => {

  let currentRef = activatedUser.referredBy

  while (currentRef && currentRef !== "none") {

    const uplineUser = allUsers.find(
      (u: any) => u.referralCode === currentRef
    )

    if (!uplineUser || !uplineUser.email) break

    // 🏢 Skip company account — no rewards needed
    if (uplineUser.role === "company" || uplineUser.referralCode === "BRS44447") {
      currentRef = uplineUser.referredBy
      continue
    }

    await checkSpecialRewards(uplineUser.email, uplineUser, allUsers)

    currentRef = uplineUser.referredBy

  }

}

// 🚀 Full Activation Engine — runs everything after deposit approval

// Company Ref Code
const COMPANY_REF_CODE = "BRS44447"

export const runFullActivation = async (userEmail: string) => {

  try {

    // Fetch all users ONCE and reuse
    const allUsersSnap = await getDocs(collection(db, "users"))
    const allUsers = allUsersSnap.docs.map(d => d.data())

    // Get activated user's data
    const userSnap = await getDoc(doc(db, "users", userEmail))
    const userData: any = userSnap.data()

    if (!userData) return

    // 🔒 DUPLICATE PROTECTION: Skip if commissions already paid
    if (userData.commissionsPaid) {
      console.log(`🔒 Commissions already distributed for ${userEmail} — skipping`)
      return
    }

    // Mark commissions as paid BEFORE distributing (prevents race condition)
    await updateDoc(doc(db, "users", userEmail), { commissionsPaid: true })

    // 🔥 COMMISSION SYSTEM (12 LEVELS)
    await distributeReferral(userData, allUsers)

    // 🎁 REWARDS SYSTEM
    await checkUplineRewards(userData, allUsers)

    // 📈 TOKEN PHASE — auto-update based on total users
    try {
      const totalUsers = allUsers.filter(u => (u as any).status === "active").length
      await updateTokenPhase(totalUsers)
    } catch (phaseErr) {
      console.warn("Token phase update skipped:", phaseErr)
    }

    // 🏢 COMPANY DIRECT MEMBER — mark users who join under company code
    try {
      if (userData.referredBy === COMPANY_REF_CODE) {
        // Mark as company direct if not already
        if (!userData.isCompanyDirect) {
          await updateDoc(doc(db, "users", userEmail), {
            isCompanyDirect: true,
          })
          console.log(`🏢 Company Direct member marked: ${userEmail}`)
        }

        // 🎁 50 BRS COMPANY DIRECT BONUS — only if not already paid
        // Fresh check from DB to prevent race conditions
        const freshCheck = await getDoc(doc(db, "users", userEmail))
        const freshData: any = freshCheck.data()

        if (!freshData?.companyBonusPaid) {
          await updateDoc(doc(db, "users", userEmail), {
            brsBalance: increment(50),
            companyBonusPaid: true
          })
          await logTransaction(userEmail, 50, "BRS", "Company Direct 50 BRS welcome gift")
          console.log(`🎁 Company Direct 50 BRS gift credited to ${userEmail}`)
        } else {
          console.log(`🔒 Company Direct 50 BRS already paid for ${userEmail} — SKIPPED`)
        }
      }
    } catch (cdErr) {
      console.warn("Company Direct marking skipped:", cdErr)
    }

    console.log(`✅ Full activation + commissions complete for ${userEmail}`)

  } catch (err) {
    console.error("Commission engine error:", err)
  }

}
