import { getUser } from "../lib/session"
import { useEffect, useState } from "react"
import { navigate } from "../lib/router"
import { db, auth } from "../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  increment,
  serverTimestamp,
  addDoc,
  deleteDoc
} from "firebase/firestore"

import AdminStats from "./AdminStats"
import { logTransaction, runFullActivation } from "../lib/commission"

export default function AdminPanel() {

  const [activeTab, setActiveTab] = useState<"deposits" | "withdraws" | "trips" | "brsWithdraws" | "announcements" | "airdrops" | "launchNotify" | "pushNotifs">("deposits")

  // Push Notification states
  const [pushNotifs, setPushNotifs] = useState<any[]>([])
  const [pushTitle, setPushTitle] = useState('')
  const [pushMessage, setPushMessage] = useState('')
  const [pushType, setPushType] = useState<'system' | 'reward' | 'promo' | 'team' | 'admin'>('admin')
  const [pushIcon, setPushIcon] = useState('megaphone')
  const [pushSending, setPushSending] = useState(false)

  // Airdrop states
  const [airdrops, setAirdrops] = useState<any[]>([])
  const [airdropTitle, setAirdropTitle] = useState("")
  const [airdropDesc, setAirdropDesc] = useState("")
  const [airdropAmount, setAirdropAmount] = useState("")
  const [airdropExpiry, setAirdropExpiry] = useState("7")

  // Announcement states
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [annTitle, setAnnTitle] = useState("")
  const [annMessage, setAnnMessage] = useState("")
  const [annType, setAnnType] = useState<"info" | "warning" | "promo" | "update">("info")

  const [deposits, setDeposits] = useState<any[]>([])
  const [withdraws, setWithdraws] = useState<any[]>([])
  const [brsWithdraws, setBrsWithdraws] = useState<any[]>([])
  const [tripUsers, setTripUsers] = useState<any[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [dataLoading, setDataLoading] = useState(true)

  // Launch Notify states
  const [notifyNumbers, setNotifyNumbers] = useState<any[]>([])
  const [notifyLoading, setNotifyLoading] = useState(false)

  useEffect(() => {
    const email = getUser()
    const isAdmin = localStorage.getItem("bharos_admin")

    if (!email || isAdmin !== "true") {
      setLoading(false)
      navigate("/admin-login", true)
      return
    }

    // Wait for Firebase Auth to be ready
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Firebase Auth is active — good to go!
        setAuthorized(true)
        setLoading(false)

        // Load all data
        try {
          await Promise.all([loadDeposits(), loadWithdraws(), loadTripUsers()])
        } catch (e) {
          console.warn("Data load:", e)
        }
        setDataLoading(false)
      } else {
        // Firebase Auth session expired — must re-login
        console.warn("Firebase Auth not active. Redirecting to login...")
        alert("⚠️ Session expired! Please login again.")
        localStorage.removeItem("bharos_admin")
        navigate("/auth", true)
      }
    })

    return () => unsubscribe()
  }, [])

  // LOAD DEPOSITS (OPTIMIZED — single batch fetch)

  const loadDeposits = async () => {

    // 🔥 Fetch deposits + all users in PARALLEL (fast!)
    const [depositsSnap, usersSnap] = await Promise.all([
      getDocs(collection(db, "deposits")),
      getDocs(collection(db, "users"))
    ])

    // Build user lookup map (email → name)
    const userMap: Record<string, { fullName: string, userName: string }> = {}
    usersSnap.forEach((d) => {
      const data: any = d.data()
      userMap[d.id] = {
        fullName: data.fullName || '',
        userName: data.userName || ''
      }
    })

    const list: any[] = []
    depositsSnap.forEach((d) => {
      const data = d.data()
      const userId = (data as any).userId || ''
      const user = userMap[userId] || { fullName: '', userName: '' }
      list.push({
        id: d.id,
        ...data,
        fullName: user.fullName,
        userName: user.userName
      })
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

  // LOAD ANNOUNCEMENTS
  const loadAnnouncements = async () => {
    try {
      const snap = await getDocs(collection(db, "announcements"))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0
        const tB = b.createdAt?.seconds || 0
        return tB - tA
      })
      setAnnouncements(list)
    } catch (err) {
      console.log("No announcements yet")
    }
  }

  const loadAirdrops = async () => {
    try {
      const snap = await getDocs(collection(db, "airdrops"))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0
        const tB = b.createdAt?.seconds || 0
        return tB - tA
      })
      setAirdrops(list)
    } catch (err) {
      console.log("No airdrops yet")
    }
  }

  const loadNotifyNumbers = async () => {
    setNotifyLoading(true)
    try {
      const snap = await getDocs(collection(db, "launch_notify"))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0
        const tB = b.createdAt?.seconds || 0
        return tB - tA
      })
      setNotifyNumbers(list)
    } catch (err) {
      console.log("No notify numbers yet")
    }
    setNotifyLoading(false)
  }

  // LOAD PUSH NOTIFICATIONS
  const loadPushNotifs = async () => {
    try {
      const snap = await getDocs(collection(db, "notifications"))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0
        const tB = b.createdAt?.seconds || 0
        return tB - tA
      })
      setPushNotifs(list)
    } catch (err) {
      console.log("No push notifications yet")
    }
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



      <div className="flex gap-4 mb-6 mt-8 flex-wrap">

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
          onClick={() => { setActiveTab("brsWithdraws"); loadBrsWithdraws() }}
          className={`px-4 py-2 rounded ${
            activeTab === "brsWithdraws"
              ? "bg-amber-500 text-black font-bold"
              : "bg-gray-700"
          }`}
        >
          🪙 BRS Withdrawals
        </button>

        <button
          onClick={() => { setActiveTab("announcements"); loadAnnouncements() }}
          className={`px-4 py-2 rounded ${
            activeTab === "announcements"
              ? "bg-pink-500 text-white font-bold"
              : "bg-gray-700"
          }`}
        >
          📢 Announcements
        </button>

        <button
          onClick={() => { setActiveTab("airdrops"); loadAirdrops() }}
          className={`px-4 py-2 rounded ${
            activeTab === "airdrops"
              ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold"
              : "bg-gray-700"
          }`}
        >
          🎁 Airdrops
        </button>

        <button
          onClick={() => { setActiveTab("launchNotify"); loadNotifyNumbers() }}
          className={`px-4 py-2 rounded ${
            activeTab === "launchNotify"
              ? "bg-gradient-to-r from-green-400 to-emerald-500 text-black font-bold"
              : "bg-gray-700"
          }`}
        >
          📱 Launch Notify ({notifyNumbers.length})
        </button>

        <button
          onClick={() => { setActiveTab("pushNotifs"); loadPushNotifs() }}
          className={`px-4 py-2 rounded ${
            activeTab === "pushNotifs"
              ? "bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold"
              : "bg-gray-700"
          }`}
        >
          🔔 Notifications
        </button>

      </div>

      {activeTab === "deposits" && (
        <>
          <h1 className="text-3xl mb-8 font-bold">
            Deposit Requests ({deposits.length})
          </h1>

          {dataLoading && <p className="text-cyan-400 animate-pulse mb-4">⏳ Loading deposits...</p>}

          {deposits.map((d) => (
            <div key={d.id} className={`bg-[#1a1a2e] p-5 mb-4 rounded-xl border ${
              d.status === 'pending' ? 'border-yellow-500/30' :
              d.status === 'approved' || d.status === 'verified' ? 'border-green-500/20' :
              'border-white/5'
            }`}>

              {/* TOP ROW: Status Badge + Amount */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  d.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  d.status === 'approved' || d.status === 'verified' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {d.status === 'pending' ? '⏳ Pending' :
                   d.verifiedBy === 'blockchain-rpc' || d.verifiedBy === 'blockchain' ? '🔗 Auto-Verified' :
                   d.status === 'approved' ? '✅ Approved' : d.status}
                </span>
                <span className="text-cyan-400 text-xl font-bold">{d.amount} USDT</span>
              </div>

              {/* USER INFO TABLE */}
              <div className="bg-black/20 rounded-lg p-3 mb-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 text-xs w-20 shrink-0">👤 Name</span>
                  <span className="text-white font-semibold text-sm">{d.fullName || d.userName || '—'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 text-xs w-20 shrink-0">📧 Email</span>
                  <span className="text-cyan-300 text-sm break-all">{d.userId}</span>
                </div>
                {d.txHash && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 text-xs w-20 shrink-0">🔗 TXID</span>
                    <span className="text-yellow-300/80 text-[11px] font-mono break-all">{d.txHash}</span>
                  </div>
                )}
                {d.fromAddress && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 text-xs w-20 shrink-0">📤 From</span>
                    <span className="text-gray-400 text-[11px] font-mono break-all">{d.fromAddress}</span>
                  </div>
                )}
                {d.createdAt && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 text-xs w-20 shrink-0">📅 Date</span>
                    <span className="text-gray-400 text-xs">
                      {d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString('en-IN') : ''}
                    </span>
                  </div>
                )}
              </div>

              {d.screenshot && (
                <button
                  onClick={() => setPreviewImage(d.screenshot)}
                  className="text-cyan-400 hover:underline text-sm mb-2"
                >
                  📷 View Screenshot
                </button>
              )}

              {/* APPROVE BUTTON */}
              {d.status === "pending" && (
                <button
                  disabled={processingId === d.id}
                  onClick={() => approveDeposit(d.id, d.userId)}
                  className="w-full bg-green-500 hover:bg-green-400 px-4 py-2.5 mt-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  {processingId === d.id ? "⏳ Activating..." : "✅ Approve & Activate"}
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

      {/* ANNOUNCEMENTS TAB */}
      {activeTab === "announcements" && (
        <>
          <h1 className="text-3xl mb-6 font-bold">📢 Manage Announcements</h1>

          {/* Create New */}
          <div className="bg-[#1a1a2e] p-6 mb-6 rounded-xl border border-pink-500/20">
            <h3 className="text-lg font-bold text-pink-400 mb-4">➕ Create Announcement</h3>
            <div className="space-y-3">
              <input
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Title (e.g. Phase 2 Launch!)"
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500"
              />
              <textarea
                value={annMessage}
                onChange={(e) => setAnnMessage(e.target.value)}
                placeholder="Message (e.g. Exciting news! BRS trading goes live...)"
                rows={3}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 resize-none"
              />
              <div className="flex gap-2">
                {(["info", "warning", "promo", "update"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setAnnType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      annType === type
                        ? type === 'info' ? 'bg-blue-500 text-white'
                          : type === 'warning' ? 'bg-orange-500 text-white'
                          : type === 'promo' ? 'bg-purple-500 text-white'
                          : 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {type === 'info' ? 'ℹ️ Info' : type === 'warning' ? '⚠️ Alert' : type === 'promo' ? '🎁 Promo' : '🚀 Update'}
                  </button>
                ))}
              </div>
              <button
                onClick={async () => {
                  if (!annTitle.trim() || !annMessage.trim()) { alert('Fill title and message'); return }
                  try {
                    // Ensure Firebase Auth is active
                    if (!auth.currentUser) {
                      alert('⚠️ Session expired! Please login again.')
                      navigate('/auth', true)
                      return
                    }
                    await addDoc(collection(db, "announcements"), {
                      title: annTitle.trim(),
                      message: annMessage.trim(),
                      type: annType,
                      active: true,
                      createdAt: serverTimestamp(),
                    })
                    setAnnTitle('')
                    setAnnMessage('')
                    alert('✅ Announcement posted!')
                    loadAnnouncements()
                  } catch (err: any) {
                    console.error('Announcement error:', err)
                    alert('Error posting announcement: ' + (err?.message || 'Permission denied. Re-login from /admin-login'))
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-bold text-white hover:scale-[1.02] transition-all"
              >
                📢 Post Announcement
              </button>
            </div>
          </div>

          {/* List */}
          {announcements.map((ann) => (
            <div key={ann.id} className={`p-5 mb-3 rounded-xl border ${
              ann.active ? 'bg-[#1a1a2e] border-green-500/20' : 'bg-[#0f0f1a] border-gray-700/30 opacity-50'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white">{ann.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ann.type === 'info' ? 'bg-blue-500/20 text-blue-400'
                        : ann.type === 'warning' ? 'bg-orange-500/20 text-orange-400'
                        : ann.type === 'promo' ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>{ann.type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ann.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>{ann.active ? '🟢 Live' : '🔴 Off'}</span>
                  </div>
                  <p className="text-sm text-gray-400">{ann.message}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      await updateDoc(doc(db, "announcements", ann.id), { active: !ann.active })
                      loadAnnouncements()
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-bold ${
                      ann.active ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                    }`}
                  >
                    {ann.active ? '⏸ Disable' : '▶️ Enable'}
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Delete this announcement?')) {
                        await deleteDoc(doc(db, "announcements", ann.id))
                        loadAnnouncements()
                      }
                    }}
                    className="px-3 py-1.5 rounded text-xs font-bold bg-red-500 text-white"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {announcements.length === 0 && (
            <p className="text-gray-500 text-center py-8">No announcements yet. Create your first one above!</p>
          )}
        </>
      )}

      {/* ═══════════════════ AIRDROPS TAB ═══════════════════ */}
      {activeTab === "airdrops" && (
        <>
          <h1 className="text-3xl mb-6 font-bold">🎁 Manage Airdrop Offers</h1>

          {/* CREATE NEW AIRDROP */}
          <div className="bg-[#1a1a2e] p-6 mb-6 rounded-xl border border-yellow-500/20">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">➕ Create New Offer</h3>
            <div className="space-y-3">
              <input
                value={airdropTitle}
                onChange={(e) => setAirdropTitle(e.target.value)}
                placeholder="Offer Title (e.g. Diwali Festival Bonus 🎉)"
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500"
              />
              <textarea
                value={airdropDesc}
                onChange={(e) => setAirdropDesc(e.target.value)}
                placeholder="Description (e.g. Celebrate Diwali with free BRS tokens!)"
                rows={2}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">BRS Amount</label>
                  <input
                    type="number"
                    value={airdropAmount}
                    onChange={(e) => setAirdropAmount(e.target.value)}
                    placeholder="25"
                    min="1"
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Expires In (Days)</label>
                  <input
                    type="number"
                    value={airdropExpiry}
                    onChange={(e) => setAirdropExpiry(e.target.value)}
                    placeholder="7"
                    min="1"
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500"
                  />
                </div>
              </div>
              <button
                onClick={async () => {
                  const amt = Number(airdropAmount)
                  if (!airdropTitle.trim() || !airdropDesc.trim() || !amt || amt <= 0) {
                    alert('Fill all fields with valid values'); return
                  }
                  const days = Number(airdropExpiry) || 7
                  const expiresAt = new Date()
                  expiresAt.setDate(expiresAt.getDate() + days)
                  try {
                    // Ensure Firebase Auth is active
                    if (!auth.currentUser) {
                      alert('⚠️ Session expired! Please login again.')
                      navigate('/auth', true)
                      return
                    }
                    await addDoc(collection(db, "airdrops"), {
                      title: airdropTitle.trim(),
                      description: airdropDesc.trim(),
                      amount: amt,
                      status: "active",
                      createdBy: getUser() || "admin",
                      createdAt: serverTimestamp(),
                      expiresAt: expiresAt,
                      totalClaimed: 0
                    })
                    setAirdropTitle('')
                    setAirdropDesc('')
                    setAirdropAmount('')
                    setAirdropExpiry('7')
                    alert('✅ Airdrop offer created!')
                    loadAirdrops()
                  } catch (err: any) {
                    console.error('Airdrop error:', err)
                    alert('Error creating airdrop: ' + (err?.message || 'Permission denied. Re-login from /admin-login'))
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg font-bold text-black hover:scale-[1.02] transition-all"
              >
                🎁 Create Airdrop Offer
              </button>
            </div>
          </div>

          {/* ACTIVE AIRDROPS LIST */}
          <h3 className="text-lg font-bold text-white mb-3">Active Offers</h3>
          {airdrops.filter(a => a.status === 'active').map((drop) => {
            const expired = drop.expiresAt?.toDate ? drop.expiresAt.toDate() < new Date() : (drop.expiresAt && new Date(drop.expiresAt) < new Date())
            return (
              <div key={drop.id} className={`p-5 mb-3 rounded-xl border ${
                expired ? 'bg-[#0f0f1a] border-red-500/20 opacity-60' : 'bg-[#1a1a2e] border-yellow-500/20'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white">{drop.title}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-400">
                        {drop.amount} BRS
                      </span>
                      {expired && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400">⏰ Expired</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{drop.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Claimed: <span className="text-cyan-400 font-bold">{drop.totalClaimed || 0}</span> users
                      {' | '}Expires: {drop.expiresAt?.toDate ? drop.expiresAt.toDate().toLocaleDateString() : (drop.expiresAt ? new Date(drop.expiresAt).toLocaleDateString() : 'N/A')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        await updateDoc(doc(db, "airdrops", drop.id), { status: drop.status === 'active' ? 'expired' : 'active' })
                        loadAirdrops()
                      }}
                      className={`px-3 py-1.5 rounded text-xs font-bold ${
                        drop.status === 'active' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                      }`}
                    >
                      {drop.status === 'active' ? '⏸ Disable' : '▶️ Enable'}
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this airdrop offer?')) {
                          await deleteDoc(doc(db, "airdrops", drop.id))
                          loadAirdrops()
                        }
                      }}
                      className="px-3 py-1.5 rounded text-xs font-bold bg-red-500 text-white"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {airdrops.filter(a => a.status === 'active').length === 0 && (
            <p className="text-gray-500 text-center py-8">No active airdrop offers. Create one above!</p>
          )}

          {/* EXPIRED/DISABLED LIST */}
          {airdrops.filter(a => a.status !== 'active').length > 0 && (
            <>
              <h3 className="text-lg font-bold text-gray-400 mb-3 mt-6">Expired / Disabled</h3>
              {airdrops.filter(a => a.status !== 'active').map((drop) => (
                <div key={drop.id} className="p-4 mb-2 rounded-xl bg-[#0f0f1a] border border-gray-700/30 opacity-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-400 text-sm">{drop.title} — {drop.amount} BRS</h4>
                      <p className="text-xs text-gray-600">Claimed: {drop.totalClaimed || 0} users</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Delete?')) {
                          await deleteDoc(doc(db, "airdrops", drop.id))
                          loadAirdrops()
                        }
                      }}
                      className="px-2 py-1 rounded text-xs bg-red-900 text-red-400"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* ===== LAUNCH NOTIFY TAB ===== */}
      {activeTab === "launchNotify" && (
        <>
          <h1 className="text-3xl mb-4 font-bold">📱 Launch Notification List</h1>
          <p className="text-gray-400 text-sm mb-6">
            WhatsApp numbers collected from countdown page. Total: <span className="text-green-400 font-bold">{notifyNumbers.length}</span>
          </p>

          {notifyNumbers.length > 0 && (
            <button
              onClick={() => {
                const allNumbers = notifyNumbers.map((n: any) => n.phone).join("\n")
                navigator.clipboard.writeText(allNumbers)
                alert(`✅ ${notifyNumbers.length} numbers copied to clipboard!`)
              }}
              className="mb-6 px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm hover:scale-[1.02] transition"
            >
              📋 Copy All Numbers ({notifyNumbers.length})
            </button>
          )}

          {notifyLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : notifyNumbers.length === 0 ? (
            <p className="text-gray-500">No numbers collected yet</p>
          ) : (
            <div className="space-y-2">
              {notifyNumbers.map((n: any, i: number) => (
                <div key={n.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a2e] border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs w-6">{i + 1}.</span>
                    <span className="text-white font-mono text-sm">{n.phone}</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {n.createdAt?.toDate?.()?.toLocaleString?.("en-IN") || "Unknown"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════ PUSH NOTIFICATIONS TAB ═══════════════════ */}
      {activeTab === "pushNotifs" && (
        <>
          <h1 className="text-3xl mb-6 font-bold">🔔 Send Notifications</h1>
          <p className="text-gray-400 text-sm mb-6">
            Send notifications that appear in every user's notification bell. All active users will see these instantly.
          </p>

          {/* CREATE NOTIFICATION */}
          <div className="bg-[#1a1a2e] p-6 mb-6 rounded-xl border border-red-500/20">
            <h3 className="text-lg font-bold text-red-400 mb-4">➕ Send New Notification</h3>
            <div className="space-y-3">
              <input
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder="Notification Title (e.g. 🚀 Big Update!)"
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500"
              />
              <textarea
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                placeholder="Message body (e.g. Phase 4 staking is now live! Earn up to 40% APY...)"
                rows={3}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 resize-none"
              />

              {/* Type Selection */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Notification Type</label>
                <div className="flex gap-2 flex-wrap">
                  {(['admin', 'system', 'reward', 'promo', 'team'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setPushType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        pushType === type
                          ? type === 'admin' ? 'bg-red-500 text-white'
                            : type === 'system' ? 'bg-cyan-500 text-white'
                            : type === 'reward' ? 'bg-green-500 text-white'
                            : type === 'promo' ? 'bg-amber-500 text-black'
                            : 'bg-purple-500 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {type === 'admin' ? '🔴 Admin' : type === 'system' ? '🔵 System' : type === 'reward' ? '🟢 Reward' : type === 'promo' ? '🟡 Promo' : '🟣 Team'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: 'megaphone', label: '📢 Announce' },
                    { key: 'gift', label: '🎁 Gift' },
                    { key: 'coins', label: '🪙 Coins' },
                    { key: 'trending', label: '📈 Trending' },
                    { key: 'shield', label: '🛡 Security' },
                    { key: 'sparkles', label: '✨ Sparkle' },
                    { key: 'users', label: '👥 Team' },
                    { key: 'alert', label: '⚠️ Alert' },
                    { key: 'zap', label: '⚡ Zap' },
                  ].map(ic => (
                    <button
                      key={ic.key}
                      onClick={() => setPushIcon(ic.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        pushIcon === ic.key
                          ? 'bg-white/15 text-white border border-white/30'
                          : 'bg-gray-700/50 text-gray-400 border border-transparent'
                      }`}
                    >
                      {ic.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {pushTitle && (
                <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">📱 Preview</p>
                  <div className="flex gap-3 items-start">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      pushType === 'admin' ? 'bg-red-500/15 border border-red-500/25'
                        : pushType === 'system' ? 'bg-cyan-500/15 border border-cyan-500/25'
                        : pushType === 'reward' ? 'bg-green-500/15 border border-green-500/25'
                        : pushType === 'promo' ? 'bg-amber-500/15 border border-amber-500/25'
                        : 'bg-purple-500/15 border border-purple-500/25'
                    }`}>
                      <span className="text-sm">
                        {pushIcon === 'megaphone' ? '📢' : pushIcon === 'gift' ? '🎁' : pushIcon === 'coins' ? '🪙'
                          : pushIcon === 'trending' ? '📈' : pushIcon === 'shield' ? '🛡' : pushIcon === 'sparkles' ? '✨'
                          : pushIcon === 'users' ? '👥' : pushIcon === 'alert' ? '⚠️' : '⚡'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold">{pushTitle}</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">{pushMessage || 'Message preview...'}</p>
                      <p className="text-gray-600 text-[9px] mt-1">Just now</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Send Button */}
              <button
                disabled={pushSending}
                onClick={async () => {
                  if (!pushTitle.trim() || !pushMessage.trim()) {
                    alert('Fill title and message!'); return
                  }
                  if (!auth.currentUser) {
                    alert('⚠️ Session expired! Please login again.')
                    navigate('/auth', true)
                    return
                  }
                  setPushSending(true)
                  try {
                    await addDoc(collection(db, "notifications"), {
                      title: pushTitle.trim(),
                      message: pushMessage.trim(),
                      type: pushType,
                      icon: pushIcon,
                      createdBy: getUser() || 'admin',
                      createdAt: serverTimestamp(),
                    })
                    setPushTitle('')
                    setPushMessage('')
                    alert('✅ Notification sent to all users!')
                    loadPushNotifs()
                  } catch (err: any) {
                    console.error('Notification error:', err)
                    alert('Error: ' + (err?.message || 'Permission denied'))
                  }
                  setPushSending(false)
                }}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg font-bold text-white hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                {pushSending ? '⏳ Sending...' : '🔔 Send Notification to All Users'}
              </button>
            </div>
          </div>

          {/* SENT NOTIFICATIONS LIST */}
          <h3 className="text-lg font-bold text-white mb-3">📜 Sent Notifications ({pushNotifs.length})</h3>
          {pushNotifs.length === 0 && (
            <p className="text-gray-500 text-center py-8">No notifications sent yet. Send your first one above!</p>
          )}
          {pushNotifs.map((notif: any) => (
            <div key={notif.id} className="p-4 mb-3 rounded-xl bg-[#1a1a2e] border border-white/10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-bold text-white text-sm">{notif.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      notif.type === 'admin' ? 'bg-red-500/20 text-red-400'
                        : notif.type === 'system' ? 'bg-cyan-500/20 text-cyan-400'
                        : notif.type === 'reward' ? 'bg-green-500/20 text-green-400'
                        : notif.type === 'promo' ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>{notif.type}</span>
                  </div>
                  <p className="text-xs text-gray-400">{notif.message}</p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    Sent: {notif.createdAt?.toDate?.()?.toLocaleString?.('en-IN') || 'Unknown'}
                    {notif.createdBy && <span className="ml-2">by {notif.createdBy}</span>}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (confirm('Delete this notification?')) {
                      await deleteDoc(doc(db, "notifications", notif.id))
                      loadPushNotifs()
                    }
                  }}
                  className="px-3 py-1.5 rounded text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition shrink-0"
                >
                  🗑 Delete
                </button>
              </div>
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