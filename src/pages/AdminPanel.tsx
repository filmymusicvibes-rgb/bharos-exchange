import { getUser, setUser, removeUser } from "../lib/session"
import { useEffect, useState } from "react"
import { navigate } from "../lib/router"
import { db, auth } from "../lib/firebase"
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  increment,
  serverTimestamp
} from "firebase/firestore"

import AdminStats from "./AdminStats"
import { logTransaction, runFullActivation } from "../lib/commission"

export default function AdminPanel() {

  const [activeTab, setActiveTab] = useState<"deposits" | "withdraws" | "trips" | "brsWithdraws">("deposits")

  const [deposits, setDeposits] = useState<any[]>([])
  const [withdraws, setWithdraws] = useState<any[]>([])
  const [brsWithdraws, setBrsWithdraws] = useState<any[]>([])
  const [tripUsers, setTripUsers] = useState<any[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    const checkAdmin = async () => {
      const email = getUser()

      if (!email) {
        setLoading(false)
        navigate("/auth", true)
        return
      }

      try {
        // Wait a moment for Firebase Auth to restore
        await new Promise(r => setTimeout(r, 1500))

        const userRef = doc(db, "users", email)
        const snap = await getDoc(userRef)

        if (snap.exists()) {
          const data: any = snap.data()

          if (data.role === "admin") {
            setAuthorized(true)
            try { await loadDeposits() } catch(e) { console.warn(e) }
            try { await loadWithdraws() } catch(e) { console.warn(e) }
            try { await loadBrsWithdraws() } catch(e) { console.warn(e) }
            try { await loadTripUsers() } catch(e) { console.warn(e) }
          } else {
            alert("Access denied")
            navigate("/dashboard", true)
          }
        } else {
          alert("User not found")
          navigate("/auth", true)
        }
      } catch (err: any) {
        console.error(err)
        alert("Error: " + err?.message + "\n\nPlease login via /auth first, then visit /admin")
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

    // Fetch user names for each deposit
    const userNames: Record<string, string> = {}
    for (const dep of list) {
      if (dep.userId && !userNames[dep.userId]) {
        try {
          const userSnap = await getDoc(doc(db, "users", dep.userId))
          if (userSnap.exists()) {
            const userData: any = userSnap.data()
            userNames[dep.userId] = userData.fullName || userData.userName || ''
          }
        } catch { }
      }
      dep.userName = userNames[dep.userId] || ''
    }

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

  // LOAD BRS WITHDRAWALS

  const loadBrsWithdraws = async () => {
    const snap = await getDocs(collection(db, "brs_withdrawals"))
    const list: any[] = []
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() })
    })
    const getTime = (t: any) => t?.seconds ? t.seconds * 1000 : 0
    list.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1
      if (a.status !== "pending" && b.status === "pending") return 1
      return getTime(b.createdAt) - getTime(a.createdAt)
    })
    setBrsWithdraws(list)
  }

  // APPROVE BRS WITHDRAWAL

  const approveBrsWithdraw = async (id: string, userId: string, amount: number) => {
    const brsTxHash = prompt("Enter BRS transfer TX hash (from BscScan):")
    if (!brsTxHash) return
    setProcessingId(id)
    try {
      // Update withdrawal status
      await updateDoc(doc(db, "brs_withdrawals", id), {
        status: "approved",
        brsTxHash,
        approvedAt: serverTimestamp()
      })
      // Deduct BRS from user balance
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        const userData: any = userSnap.data()
        const newBalance = (userData.brsBalance || 0) - amount
        await updateDoc(userRef, { brsBalance: Math.max(0, newBalance) })
      }
      await loadBrsWithdraws()
      alert(`✅ BRS withdrawal approved! ${amount} BRS sent.`)
    } catch (err: any) {
      alert("Error: " + err.message)
    }
    setProcessingId(null)
  }

  // LOAD TRIP USERS

  const loadTripUsers = async () => {

    const list: any[] = []

    // 1. Load submitted trip contact forms (these have accurate details)
    const subSnap = await getDocs(collection(db, "tripSubmissions"))
    const submittedEmails: string[] = []

    subSnap.forEach((d: any) => {
      const data = d.data()
      submittedEmails.push(data.email)
      list.push({
        ...data,
        source: 'submitted',
        id: d.id
      })
    })

    // 2. Also load trip achievers from users who haven't submitted form yet
    const usersSnap = await getDocs(collection(db, "users"))
    usersSnap.forEach((d: any) => {
      const data = d.data()
      if (data.tripAchieved && !submittedEmails.includes(data.email)) {
        list.push({
          email: data.email,
          fullName: data.fullName || data.userName || 'N/A',
          phone: data.phone || 'Not Set',
          source: 'auto',
          id: d.id
        })
      }
    })

    setTripUsers(list)
  }

  // Commission logic is now in shared module: src/lib/commission.ts

  // APPROVE DEPOSIT (OPTIMIZED — uses shared commission engine)

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

      // ⚡ STEP 1: Immediate activation
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

      // ⚡ Immediate UI update
      loadDeposits()

      // ⚡ STEP 2: Commission & rewards via shared engine
      await runFullActivation(userEmail)

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

      const balance = user.usdtBalance || 0

      await updateDoc(userRef, {
        usdtBalance: Math.max(0, balance - amount),
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

        <button
          onClick={() => setActiveTab("brsWithdraws")}
          className={`px-4 py-2 rounded ${
            activeTab === "brsWithdraws"
              ? "bg-amber-500 text-black font-bold"
              : "bg-gray-700"
          }`}
        >
          🪙 BRS Withdrawals
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
              {d.userName && <p className="text-cyan-300 font-semibold">Name: {d.userName}</p>}
              <p>Amount: {d.amount} USDT</p>
              <p className="text-sm break-all">TXID: {d.txHash}</p>

              {d.screenshot && (
                <button
                  onClick={() => setPreviewImage(d.screenshot)}
                  className="text-cyan-400 hover:underline"
                >
                  📷 View Screenshot
                </button>
              )}

              {/* 🔗 Blockchain Verification Badge */}
              {d.verifiedBy === "blockchain" ? (
                <p className="mt-2">
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                    🔗 Blockchain Verified
                  </span>
                </p>
              ) : (
                <p>Status: {d.status}</p>
              )}

              {d.status === "pending" && (
                <button
                  disabled={processingId === d.id}
                  onClick={() => approveDeposit(d.id, d.userId)}
                  className="bg-green-500 px-4 py-2 mt-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === d.id ? "⏳ Processing..." : "✅ Approve"}
                </button>
              )}

              {(d.status === "verified" || d.status === "approved") && d.verifiedBy === "blockchain" && (
                <p className="text-green-400 text-sm mt-2">✅ Auto-activated</p>
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
            <div key={w.id} className="bg-[#1a1a2e] p-6 mb-4 rounded-xl border border-cyan-500/10">

              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  w.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {w.status === 'pending' ? '⏳ Pending' : w.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                </span>
                <span className="text-cyan-400 text-2xl font-bold">{w.amount} USDT</span>
              </div>

              <p className="text-gray-400 text-sm mb-1">👤 User: <span className="text-white">{w.userId}</span></p>

              {/* 🔑 WALLET ADDRESS - PROMINENT DISPLAY */}
              <div className="mt-3 bg-[#0B0919] border border-cyan-500/30 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2">📋 Wallet Address (BEP20):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-cyan-300 text-sm font-mono break-all bg-black/30 p-2 rounded-lg border border-cyan-500/20 select-all">
                    {w.address}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(w.address)
                      const btn = document.getElementById(`copy-btn-${w.id}`)
                      if (btn) {
                        btn.textContent = '✅ Copied!'
                        btn.classList.add('bg-green-500')
                        btn.classList.remove('bg-cyan-500')
                        setTimeout(() => {
                          btn.textContent = '📋 Copy'
                          btn.classList.remove('bg-green-500')
                          btn.classList.add('bg-cyan-500')
                        }, 2000)
                      }
                    }}
                    id={`copy-btn-${w.id}`}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              {w.status === "pending" && (
                <div className="flex gap-4 mt-4">

                  <button
                    disabled={processingId === w.id}
                    onClick={() =>
                      approveWithdraw(w.id, w.userId, w.amount)
                    }
                    className="bg-green-500 hover:bg-green-400 px-6 py-2 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {processingId === w.id ? '⏳...' : '✅ Approve'}
                  </button>

                  <button
                    disabled={processingId === w.id}
                    onClick={() =>
                      rejectWithdraw(w.id, w.userId, w.amount)
                    }
                    className="bg-red-500 hover:bg-red-400 px-6 py-2 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ❌ Reject
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
              className="bg-[#1a1a2e] p-6 mb-4 rounded-xl border border-purple-500/20"
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
                  ✈️ Trip Qualified
                </span>
                {u.source === 'submitted' ? (
                  <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-xs font-bold border border-cyan-500/30">
                    📝 Form Submitted
                  </span>
                ) : (
                  <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30">
                    ⏳ Pending Form
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-white">
                  <span className="text-gray-400 text-sm">👤 Username:</span>{' '}
                  <span className="font-bold text-lg">{u.userName || 'N/A'}</span>
                </p>
                <p className="text-white">
                  <span className="text-gray-400 text-sm">📝 Full Name:</span>{' '}
                  <span className="font-bold text-lg text-cyan-300">{u.fullName || 'Not Set'}</span>
                </p>
                <p className="text-white">
                  <span className="text-gray-400 text-sm">📧 Email:</span>{' '}
                  <span className="font-medium">{u.email}</span>
                </p>
                <p className="text-white">
                  <span className="text-gray-400 text-sm">📱 Phone:</span>{' '}
                  <span className="font-medium text-yellow-300">{u.phone || 'Not Set'}</span>
                </p>
              </div>

              {/* Copy Email Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(u.email)
                    alert('Email copied: ' + u.email)
                  }}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105"
                >
                  📋 Copy Email
                </button>

                {u.phone && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(u.phone)
                      alert('Phone copied: ' + u.phone)
                    }}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105"
                  >
                    📱 Copy Phone
                  </button>
                )}

                <button
                  onClick={async () => {
                    await updateDoc(doc(db, "users", u.email), {
                      tripNotified: true
                    })
                    alert("User marked as contacted ✅")
                    await loadTripUsers()
                  }}
                  className="bg-purple-500 hover:bg-purple-400 px-4 py-2 rounded-lg transition-all font-bold text-white text-sm hover:scale-105"
                >
                  ✅ Mark Contacted
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* BRS WITHDRAWALS TAB */}
      {activeTab === "brsWithdraws" && (
        <>
          <h1 className="text-3xl mb-8 font-bold">🪙 BRS Withdrawal Requests</h1>

          {brsWithdraws.length === 0 && (
            <p className="text-gray-500">No BRS withdrawal requests yet</p>
          )}

          {brsWithdraws.map((w) => (
            <div key={w.id} className={`p-6 mb-4 rounded-xl ${
              w.status === 'pending' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-[#1a1a2e]'
            }`}>
              <p>User: {w.userId}</p>
              <p className="text-amber-400 font-bold text-lg">{w.amount} BRS</p>
              <p className="text-sm">To Wallet: <span className="text-cyan-400 font-mono text-xs">{w.walletAddress}</span></p>
              <p className="text-sm">BNB Fee TX: <span className="text-green-400 font-mono text-xs break-all">{w.bnbTxHash}</span></p>
              <p className="text-sm">Fee: ${w.feeUSD} BNB</p>
              
              {w.status === "pending" ? (
                <div className="mt-3 flex gap-3">
                  <a
                    href={`https://bscscan.com/tx/${w.bnbTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition"
                  >
                    🔍 Verify BNB on BscScan
                  </a>
                  <button
                    disabled={processingId === w.id}
                    onClick={() => approveBrsWithdraw(w.id, w.userId, w.amount)}
                    className="px-4 py-2 bg-green-500 text-black rounded font-semibold disabled:opacity-50"
                  >
                    {processingId === w.id ? "⏳ Processing..." : "✅ Approve & Send BRS"}
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                    ✅ Approved
                  </span>
                  {w.brsTxHash && (
                    <p className="text-xs text-gray-500 mt-1">BRS TX: {w.brsTxHash}</p>
                  )}
                </div>
              )}
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

// Load BRS Withdrawals function — add after other load functions