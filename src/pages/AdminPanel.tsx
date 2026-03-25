import { useEffect, useState } from "react"
import { navigate } from "../lib/router"
import { db } from "../lib/firebase"
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  addDoc
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

  // MLM COMMISSION ENGINE

  const distributeReferral = async (userData: any) => {

    const rewards = [
      2, 0.8, 0.75, 0.65, 0.55, 0.50,
      0.45, 0.40, 0.35, 0.30, 0.25, 1
    ]

    let currentRef = userData.referredBy

    for (let i = 0; i < 12; i++) {

      if (!currentRef || currentRef === "none") break

      const refIndexSnap =
        await getDoc(doc(db, "referralIndex", currentRef))

      if (!refIndexSnap.exists()) break

      const userEmail = refIndexSnap.data().userId

      const refUserSnap =
        await getDoc(doc(db, "users", userEmail))

      if (!refUserSnap.exists()) break

      const refUser: any = refUserSnap.data()

      const reward = rewards[i]

      const freshSnap = await getDoc(doc(db, "users", userEmail))
      const freshUser: any = freshSnap.data()

      const newBalance = Number(((freshUser?.usdtBalance || 0) + reward).toFixed(2))

      await updateDoc(doc(db, "users", userEmail), {
        usdtBalance: newBalance
      })

      await logTransaction(
        userEmail,
        reward,
        "USDT",
        `Level ${i + 1} referral commission`
      )

      currentRef = refUser.referredBy

    }

  }

  // SPECIAL REWARDS ENGINE

  const checkSpecialRewards = async (userEmail: string, userData: any) => {

    const usersSnap = await getDocs(collection(db, "users"))

    let level1 = 0
    let totalTeam = 0

    usersSnap.forEach((u: any) => {

      const d = u.data()

      if (
        d.referredBy === userData.referralCode &&
        d.status === "active"
      ) {
        level1++
        totalTeam++
      }

    })

    // DIRECT 10 REWARD

    const freshSnap = await getDoc(doc(db, "users", userEmail))
    const freshUser: any = freshSnap.data()

    if (level1 >= 10 && !freshUser?.directRewardPaid) {

      const newBalance = Number(((freshUser?.usdtBalance || 0) + 20).toFixed(2))

      await updateDoc(doc(db, "users", userEmail), {
        usdtBalance: newBalance,
        directRewardPaid: true
      })

      await logTransaction(
        userEmail,
        20,
        "USDT",
        "Direct 10 referral reward"
      )
    }

    // MATRIX REWARD (SAFE)

    const level2 = level1 * 3
    const level3 = level2 * 3

    if (
      level1 >= 3 &&
      level2 >= 9 &&
      level3 >= 27 &&
      !freshUser?.matrixRewardPaid
    ) {

      const newBalance = Number(((freshUser?.usdtBalance || 0) + 30).toFixed(2))

      await updateDoc(doc(db, "users", userEmail), {
        usdtBalance: newBalance,
        matrixRewardPaid: true
      })

      await logTransaction(
        userEmail,
        30,
        "USDT",
        "Matrix reward (3+9+27)"
      )
    }

    // TRIP ACHIEVEMENT

    if (totalTeam >= 100 && !freshUser?.tripAchieved) {

      await updateDoc(doc(db, "users", userEmail), {
        tripAchieved: true,
        tripNotified: false
      })

      await logTransaction(
        userEmail,
        0,
        "SYSTEM",
        "Trip Achieved - User eligible for reward"
      )
    }

  }

  // APPROVE DEPOSIT

  const approveDeposit = async (depositId: string, userEmail: string) => {

    if (processingId === depositId) return
    setProcessingId(depositId)

    try {
      const userRef = doc(db, "users", userEmail)

      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        alert("User not found")
        return
      }

      const userData: any = userSnap.data()

      if (userData.status === "active") {
        alert("User already active")
        return
      }

      await updateDoc(doc(db, "deposits", depositId), {
        status: "approved"
      })

      const brs = userData.brsBalance || 0

      // 🔥 activate user
      await updateDoc(userRef, {

        status: "active",
        brsBalance: brs + 150,
        activatedAt: new Date()

      })

      await logTransaction(
        userEmail,
        150,
        "BRS",
        "Membership activation reward"
      )

      // 🔥 VERY IMPORTANT (REFETCH USER)
      const updatedSnap = await getDoc(userRef)
      const updatedUser: any = updatedSnap.data()

      // 🔥 MAIN COMMISSION SYSTEM
      await distributeReferral(updatedUser)

      // 🎁 REWARDS SYSTEM
      await checkSpecialRewards(userEmail, updatedUser)

      alert("User activated + MLM distributed")

      loadDeposits()
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
                  Approve
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