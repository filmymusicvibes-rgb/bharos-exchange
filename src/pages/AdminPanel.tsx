import { useEffect, useState } from "react"
import { navigate } from "../lib/router"
import { db } from "../lib/firebase"
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  increment
} from "firebase/firestore"

import AdminStats from "./AdminStats"

export default function AdminPanel() {

  const [activeTab, setActiveTab] = useState<"deposits" | "withdraws" | "trips">("deposits")

  const [deposits, setDeposits] = useState<any[]>([])
  const [withdraws, setWithdraws] = useState<any[]>([])
  const [tripUsers, setTripUsers] = useState<any[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    const checkAdmin = async () => {

      const email = localStorage.getItem("bharos_user")

      if (!email) {
        alert("Please login")
        navigate("/auth")
        return
      }

      try {
        const userRef = doc(db, "users", email)
        const snap = await getDoc(userRef)

        if (snap.exists()) {
          const data: any = snap.data()

          if (data.role === "admin") {
            setAuthorized(true)
            await loadDeposits()
            await loadWithdraws()
            await loadTripUsers()
          } else {
            alert("Access denied")
            navigate("/dashboard")
          }
        } else {
          alert("User not found")
          navigate("/auth")
        }

      } catch (err) {
        console.error(err)
        alert("Error checking admin")
      }

      setLoading(false)
    }

    checkAdmin()
  }, [])

  // LOAD DEPOSITS

  const loadDeposits = async () => {

    const snap = await getDocs(collection(db, "deposits"))

    const list: any[] = []

    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() })
    })

    const getTime = (t: any) =>
      t?.seconds ? t.seconds * 1000 : 0

    list.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1
      if (a.status !== "pending" && b.status === "pending") return 1

      return getTime(b.createdAt) - getTime(a.createdAt)
    })

    setDeposits(list)

  }

  // LOAD WITHDRAWS

  const loadWithdraws = async () => {

    const snap = await getDocs(collection(db, "withdrawals"))

    const list: any[] = []

    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() })
    })

    const getTime = (t: any) =>
      t?.seconds ? t.seconds * 1000 : 0

    list.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1
      if (a.status !== "pending" && b.status === "pending") return 1

      return getTime(b.createdAt) - getTime(a.createdAt)
    })

    setWithdraws(list)

  }

  // LOAD TRIP USERS

  const loadTripUsers = async () => {

    const snap = await getDocs(collection(db, "users"))

    const list: any[] = []

    snap.forEach((d: any) => {
      const data = d.data()

      if (data.tripAchieved && !data.tripNotified) {
        list.push(data)
      }
    })

    setTripUsers(list)
  }

  // TRANSACTION LOGGER

  const logTransaction = async (
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

  // MLM COMMISSION ENGINE (OPTIMIZED — uses increment() for atomic updates)

  const distributeReferral = async (userData: any, allUsers: any[]) => {

    const rewards = [
      2, 0.8, 0.75, 0.65, 0.55, 0.50,
      0.45, 0.40, 0.35, 0.30, 0.25, 1
    ]

    let currentRef = userData.referredBy

    for (let i = 0; i < 12; i++) {

      if (!currentRef || currentRef === "none") break

      // Find upline from cached allUsers instead of DB fetch
      const uplineUser = allUsers.find(
        (u: any) => u.referralCode === currentRef
      )

      if (!uplineUser || !uplineUser.email) break

      const userEmail = uplineUser.email
      const reward = rewards[i]

      // 🔥 Atomic increment — no need to fetch current balance first
      await updateDoc(doc(db, "users", userEmail), {
        usdtBalance: increment(reward)
      })

      await logTransaction(
        userEmail,
        reward,
        "USDT",
        `Level ${i + 1} referral commission`
      )

      currentRef = uplineUser.referredBy

    }

  }

  // SPECIAL REWARDS ENGINE (OPTIMIZED — uses cached allUsers + increment())

  const checkSpecialRewards = async (userEmail: string, userData: any, allUsers: any[]) => {

    // 🔥 REAL Level 1 members (from cached allUsers — no DB fetch!)
    const level1Users = allUsers.filter(
      u => u.referredBy === userData.referralCode && u.status === "active"
    )
    const level1Count = level1Users.length

    // 🔥 REAL Level 2 members
    const level1Codes = level1Users.map(u => u.referralCode)
    const level2Users = allUsers.filter(
      u => level1Codes.includes(u.referredBy) && u.status === "active"
    )
    const level2Count = level2Users.length

    // 🔥 REAL Level 3 members
    const level2Codes = level2Users.map(u => u.referralCode)
    const level3Users = allUsers.filter(
      u => level2Codes.includes(u.referredBy) && u.status === "active"
    )
    const level3Count = level3Users.length

    // 🔥 REAL Level 4 members
    const level3Codes = level3Users.map(u => u.referralCode)
    const level4Users = allUsers.filter(
      u => level3Codes.includes(u.referredBy) && u.status === "active"
    )
    const level4Count = level4Users.length

    // 🔥 REAL Total Team (all 4 levels)
    const totalTeam = level1Count + level2Count + level3Count + level4Count

    // ============================
    // 🎁 REWARD 1: DIRECT 10 ($20)
    // ============================

    // Single fetch for reward flag checks
    const freshSnap = await getDoc(doc(db, "users", userEmail))
    const freshUser: any = freshSnap.data()

    if (level1Count >= 10 && !freshUser?.directRewardPaid) {

      // 🔥 Atomic increment — no need to re-fetch balance
      await updateDoc(doc(db, "users", userEmail), {
        usdtBalance: increment(20),
        directRewardPaid: true
      })

      await logTransaction(
        userEmail,
        20,
        "USDT",
        "Direct 10 referral reward"
      )

      console.log(`✅ Direct reward $20 credited to ${userEmail}`)
    }

    // ========================================
    // 🎁 REWARD 2: MATRIX 3+9+27 ($30)
    // ========================================

    if (
      level1Count >= 3 &&
      level2Count >= 9 &&
      level3Count >= 27 &&
      !freshUser?.matrixRewardPaid
    ) {

      // 🔥 Atomic increment — no re-fetch needed
      await updateDoc(doc(db, "users", userEmail), {
        usdtBalance: increment(30),
        matrixRewardPaid: true
      })

      await logTransaction(
        userEmail,
        30,
        "USDT",
        "Matrix reward (3+9+27)"
      )

      console.log(`✅ Matrix reward $30 credited to ${userEmail}`)
    }

    // =============================================
    // 🎁 REWARD 3: TRIP ACHIEVEMENT (100 team)
    // =============================================

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

  // 🔥 CHECK UPLINE REWARDS — walks UP the chain (OPTIMIZED — reuses cached allUsers)

  const checkUplineRewards = async (activatedUser: any, allUsers: any[]) => {

    let currentRef = activatedUser.referredBy

    // Walk UP the referral chain using cached data
    while (currentRef && currentRef !== "none") {

      // Find upline from cached allUsers instead of DB fetches
      const uplineUser = allUsers.find(
        (u: any) => u.referralCode === currentRef
      )

      if (!uplineUser || !uplineUser.email) break

      // 🎁 Check all 3 rewards for this upline user (passes cached allUsers)
      await checkSpecialRewards(uplineUser.email, uplineUser, allUsers)

      // Move UP to next upline
      currentRef = uplineUser.referredBy

    }

  }

  // APPROVE DEPOSIT (OPTIMIZED — fast activation + background commission)

  const approveDeposit = async (depositId: string, userEmail: string) => {

    if (processingId === depositId) return
    setProcessingId(depositId)

    try {
      const userRef = doc(db, "users", userEmail)

      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        alert("User not found")
        setProcessingId(null)
        return
      }

      const userData: any = userSnap.data()

      if (userData.status === "active") {
        alert("User already active")
        setProcessingId(null)
        return
      }

      // ⚡ STEP 1: Immediate activation (fast — only 3 writes)
      await updateDoc(doc(db, "deposits", depositId), {
        status: "approved"
      })

      await updateDoc(userRef, {
        status: "active",
        brsBalance: increment(150),
        activatedAt: new Date()
      })

      await logTransaction(
        userEmail,
        150,
        "BRS",
        "Membership activation reward"
      )

      // ⚡ Immediate UI update — user sees "approved" right away
      loadDeposits()

      // ⚡ STEP 2: Commission & rewards in background (doesn't block UI)
      // Fetch all users ONCE and reuse across all functions
      const allUsersSnap = await getDocs(collection(db, "users"))
      const allUsers = allUsersSnap.docs.map(d => d.data())

      // Refetch activated user with updated data
      const updatedSnap = await getDoc(userRef)
      const updatedUser: any = updatedSnap.data()

      // 🔥 MAIN COMMISSION SYSTEM (12 LEVELS) — uses cached allUsers
      await distributeReferral(updatedUser, allUsers)

      // 🎁 REWARDS SYSTEM — uses cached allUsers (no more repeated DB fetches!)
      await checkUplineRewards(updatedUser, allUsers)

      console.log(`✅ Activation + commissions complete for ${userEmail}`)

    } catch (err) {
      console.error("Approve error:", err)
      alert("Error during activation")
    } finally {
      setProcessingId(null)
    }

  }

  // APPROVE WITHDRAW

  const approveWithdraw = async (
    withdrawId: string,
    userId: string,
    amount: number
  ) => {

    if (processingId === withdrawId) return
    setProcessingId(withdrawId)

    try {
      const withdrawRef = doc(db, "withdrawals", withdrawId)
      const withdrawSnap = await getDoc(withdrawRef)

      if (!withdrawSnap.exists()) return

      const withdrawData: any = withdrawSnap.data()

      if (withdrawData.status !== "pending") {
        alert("Already processed")
        return
      }

      const userRef = doc(db, "users", userId)

      const snap = await getDoc(userRef)

      if (!snap.exists()) return

      const user: any = snap.data()

      const frozen = user.usdtFrozen || 0

      if (frozen < amount) {
        alert("Invalid freeze balance")
        return
      }

      await updateDoc(userRef, {
        usdtFrozen: Math.max(0, frozen - amount)
      })

      await updateDoc(doc(db, "withdrawals", withdrawId), {
        status: "approved"
      })

      await logTransaction(
        userId,
        -amount,
        "USDT",
        "Withdraw approved"
      )

      alert("Withdraw approved")

      loadWithdraws()
    } finally {
      setProcessingId(null)
    }

  }

  // REJECT WITHDRAW

  const rejectWithdraw = async (
    withdrawId: string,
    userId: string,
    amount: number
  ) => {

    if (processingId === withdrawId) return
    setProcessingId(withdrawId)

    try {
      const withdrawRef = doc(db, "withdrawals", withdrawId)
      const withdrawSnap = await getDoc(withdrawRef)

      if (!withdrawSnap.exists()) return

      const withdrawData: any = withdrawSnap.data()

      if (withdrawData.status !== "pending") {
        alert("Already processed")
        return
      }

      const userRef = doc(db, "users", userId)

      const snap = await getDoc(userRef)

      if (!snap.exists()) return

      const user: any = snap.data()

      const frozen = user.usdtFrozen || 0

      if (frozen < amount) {
        alert("Invalid freeze balance")
        return
      }

      await updateDoc(userRef, {
        usdtFrozen: Math.max(0, frozen - amount)
      })

      await updateDoc(doc(db, "withdrawals", withdrawId), {
        status: "rejected"
      })

      alert("Withdraw rejected")

      loadWithdraws()
    } finally {
      setProcessingId(null)
    }

  }

  if (loading) {
    return (
      <div className="text-white text-center mt-20">
        Checking Admin Access...
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (

    <div className="min-h-screen bg-[#0B0919] text-white p-10">

      {/* ADMIN OVERVIEW */}
      <AdminStats />

      <div className="flex gap-4 mb-6 mt-8">

        <button
          onClick={() => setActiveTab("deposits")}
          className={`px-4 py-2 rounded ${
            activeTab === "deposits"
              ? "bg-cyan-500 text-black"
              : "bg-gray-700"
          }`}
        >
          Deposits
        </button>

        <button
          onClick={() => setActiveTab("withdraws")}
          className={`px-4 py-2 rounded ${
            activeTab === "withdraws"
              ? "bg-green-500 text-black"
              : "bg-gray-700"
          }`}
        >
          Withdrawals
        </button>

        <button
          onClick={() => setActiveTab("trips")}
          className={`px-4 py-2 rounded ${
            activeTab === "trips"
              ? "bg-purple-500 text-white font-bold"
              : "bg-gray-700"
          }`}
        >
          🌍 Trip Achievers
        </button>

      </div>

      {activeTab === "deposits" && (
        <>
          <h1 className="text-3xl mb-8 font-bold">
            Deposit Requests
          </h1>

          {deposits.map((d) => (
            <div key={d.id} className="bg-[#1a1a2e] p-6 mb-4 rounded-xl">

              <p>User: {d.userId}</p>
              <p>Amount: {d.amount} USDT</p>
              <p>TXID: {d.txHash}</p>

              {d.screenshot && (
                <button
                  onClick={() => setPreviewImage(d.screenshot)}
                  className="text-cyan-400 hover:underline"
                >
                  📷 View Screenshot
                </button>
              )}

              <p>Status: {d.status}</p>

              {d.status === "pending" && (
                <button
                  disabled={processingId === d.id}
                  onClick={() => approveDeposit(d.id, d.userId)}
                  className="bg-green-500 px-4 py-2 mt-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === d.id ? "⏳ Processing..." : "✅ Approve"}
                </button>
              )}

            </div>
          ))}
        </>
      )}

      {activeTab === "withdraws" && (
        <>
          <h1 className="text-3xl mb-8 font-bold">
            Withdraw Requests
          </h1>

          {withdraws.map((w) => (
            <div key={w.id} className="bg-[#1a1a2e] p-6 mb-4 rounded-xl">

              <p>User: {w.userId}</p>
              <p>Amount: {w.amount} USDT</p>
              <p>Wallet: {w.address}</p>
              <p>Status: {w.status}</p>

              {w.status === "pending" && (
                <div className="flex gap-4 mt-3">

                  <button
                    disabled={processingId === w.id}
                    onClick={() =>
                      approveWithdraw(w.id, w.userId, w.amount)
                    }
                    className="bg-green-500 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>

                  <button
                    disabled={processingId === w.id}
                    onClick={() =>
                      rejectWithdraw(w.id, w.userId, w.amount)
                    }
                    className="bg-red-500 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>

                </div>
              )}

            </div>
          ))}
        </>
      )}

      {activeTab === "trips" && (
        <>
          <h1 className="text-3xl mb-6 font-bold">
            🌍 Trip Achievers ({tripUsers.length})
          </h1>

          {tripUsers.length === 0 && (
            <p className="text-gray-400">
              No trip achievers yet
            </p>
          )}

          {tripUsers.map((u) => (
            <div
              key={u.email || Math.random()}
              className="bg-[#1a1a2e] p-4 mb-3 rounded"
            >
              <p className="font-bold">{u.userName}</p>
              <p className="text-gray-300">{u.email}</p>

              <button
                onClick={async () => {
                  await updateDoc(doc(db, "users", u.email), {
                    tripNotified: true
                  })
                  alert("User marked as contacted ✅")
                  await loadTripUsers()
                }}
                className="bg-purple-500 hover:bg-purple-400 px-4 py-1 mt-3 rounded transition-all font-bold text-white tracking-wide"
              >
                Mark Contacted
              </button>
            </div>
          ))}
        </>
      )}

      {previewImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

          <div className="relative max-w-3xl w-full p-4">

            <img
              src={previewImage}
              alt="preview"
              className="max-h-[80vh] w-auto mx-auto rounded-lg"
            />

            <button
              onClick={() => setPreviewImage(null)}
              className="fixed top-5 right-5 bg-red-500 px-4 py-2 rounded z-50 shadow-lg"
            >
              Close
            </button>

          </div>

        </div>
      )}

    </div>

  )

}