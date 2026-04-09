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
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  setDoc
} from "firebase/firestore"

import AdminStats from "./AdminStats"
import { logTransaction, runFullActivation } from "../lib/commission"

export default function AdminPanel() {

  const [activeTab, setActiveTab] = useState<"deposits" | "withdraws" | "trips" | "brsWithdraws" | "announcements" | "airdrops" | "launchNotify" | "pushNotifs" | "users" | "botRewards">("deposits")

  // BOT REWARDS states
  const [botConfig, setBotConfig] = useState<any>(null)
  const [botEarners, setBotEarners] = useState<any[]>([])
  const [botConfigLoading, setBotConfigLoading] = useState(false)
  const [botSaving, setBotSaving] = useState(false)

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
  const [airdropTarget, setAirdropTarget] = useState<'all' | 'companyDirect'>('all')

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

  // Users Management states
  const [userSearchEmail, setUserSearchEmail] = useState('')
  const [searchedUser, setSearchedUser] = useState<any>(null)
  const [userSearching, setUserSearching] = useState(false)
  const [userSearchError, setUserSearchError] = useState('')
  const [userActionLoading, setUserActionLoading] = useState(false)
  const [allUsersCount, setAllUsersCount] = useState(0)

  const [allUsersList, setAllUsersList] = useState<any[]>([])
  const [usersTabLoaded, setUsersTabLoaded] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // BRS Audit states
  const [auditResults, setAuditResults] = useState<any[]>([])
  const [auditRunning, setAuditRunning] = useState(false)
  const [auditDone, setAuditDone] = useState(false)
  const [auditFixing, setAuditFixing] = useState(false)

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

  // SEARCH USER BY EMAIL
  const searchUser = async (email: string) => {
    if (!email.trim()) { setUserSearchError('Enter an email to search'); return }
    setUserSearching(true)
    setUserSearchError('')
    setSearchedUser(null)
    try {
      const snap = await getDoc(doc(db, "users", email.trim().toLowerCase()))
      if (snap.exists()) {
        const data = snap.data()
        // Get referral counts + team
        const usersSnap = await getDocs(collection(db, "users"))
        const allUsers = usersSnap.docs.map(d => d.data())
        const myCode = data.referralCode || ''

        // Calculate team (12 levels) — count ALL users (total + active separately)
        const levelData: { total: number; active: number; pending: number }[] = []
        let currentLevelCodes = [myCode]
        let totalTeam = 0
        let totalActive = 0

        for (let lvl = 0; lvl < 12; lvl++) {
          if (currentLevelCodes.length === 0) {
            levelData.push({ total: 0, active: 0, pending: 0 })
            continue
          }
          const levelUsers = allUsers.filter(u => currentLevelCodes.includes(u.referredBy))
          const activeCount = levelUsers.filter(u => u.status === 'active').length
          const pendingCount = levelUsers.length - activeCount
          levelData.push({ total: levelUsers.length, active: activeCount, pending: pendingCount })
          totalTeam += levelUsers.length
          totalActive += activeCount
          currentLevelCodes = levelUsers.map(u => u.referralCode).filter(Boolean)
        }

        // Fetch USDT withdrawals
        let totalUsdtWithdrawn = 0
        let usdtWithdrawCount = 0
        try {
          const wSnap = await getDocs(collection(db, "withdrawals"))
          const userWithdraws = wSnap.docs.map(d => d.data()).filter((w: any) => w.userId === email.trim().toLowerCase() && w.status === 'approved')
          totalUsdtWithdrawn = userWithdraws.reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0)
          usdtWithdrawCount = userWithdraws.length
        } catch (e) { console.log('USDT withdrawals fetch:', e) }

        // Fetch BRS withdrawals
        let totalBrsWithdrawn = 0
        let brsWithdrawCount = 0
        try {
          const bSnap = await getDocs(collection(db, "brs_withdrawals"))
          const userBrsW = bSnap.docs.map(d => d.data()).filter((w: any) => w.userId === email.trim().toLowerCase() && w.status === 'approved')
          totalBrsWithdrawn = userBrsW.reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0)
          brsWithdrawCount = userBrsW.length
        } catch (e) { console.log('BRS withdrawals fetch:', e) }

        // 📊 Fetch BRS transaction breakdown
        let brsTxBreakdown: Record<string, number> = {}
        let brsTxAdmin: Record<string, number> = {}
        let brsTxLegitTotal = 0
        try {
          const txSnap = await getDocs(collection(db, "transactions"))
          const userTxs = txSnap.docs.map(d => d.data()).filter((t: any) => t.userId === email.trim().toLowerCase() && t.currency === 'BRS')
          for (const tx of userTxs) {
            const desc = tx.description || tx.type || 'Unknown'
            let category = 'Other'
            let isAdmin = false
            if (desc.includes('Activation') || desc.includes('activation') || desc.includes('150 BRS')) category = '🎯 Activation (150)'
            else if (desc.includes('Social') || desc.includes('social') || desc.includes('Follow')) category = '📱 Social Earn'
            else if (desc.includes('Airdrop') || desc.includes('airdrop')) category = '🎁 Airdrop Claim'
            else if (desc.includes('Company') || desc.includes('company') || desc.includes('direct bonus')) category = '🏢 Company Direct Bonus'
            else if (desc.includes('30-day') || desc.includes('30 day') || desc.includes('bonus')) category = '📅 30-Day Bonus'
            else if (desc.includes('Daily') || desc.includes('daily') || desc.includes('spin')) category = '🎰 Daily Reward'
            else if (desc.includes('Transfer') || desc.includes('transfer')) category = '💸 BRS Transfer'
            else if (tx.type === 'ADMIN_AUDIT_FIX') { category = '🔧 Audit Fix'; isAdmin = true }
            else if (tx.type === 'ADMIN_AUDIT_UNDO') { category = '⏪ Audit Undo'; isAdmin = true }
            else if (tx.type === 'ADMIN_TX_SYNC') { category = '🔄 TX Sync'; isAdmin = true }
            else if (tx.type === 'ADMIN_ADJUST') { category = '🪙 Admin Adjust'; isAdmin = true }
            else category = `📋 ${desc.substring(0, 30)}`
            
            if (isAdmin) {
              if (!brsTxAdmin[category]) brsTxAdmin[category] = 0
              brsTxAdmin[category] += (tx.amount || 0)
            } else {
              if (!brsTxBreakdown[category]) brsTxBreakdown[category] = 0
              brsTxBreakdown[category] += (tx.amount || 0)
              brsTxLegitTotal += (tx.amount || 0)
            }
          }
        } catch (e) { console.log('BRS tx fetch:', e) }

        // 💰 Fetch USDT transaction breakdown
        let usdtTxBreakdown: { desc: string, amount: number }[] = []
        let usdtTxTotal = 0
        try {
          const txSnap2 = await getDocs(collection(db, "transactions"))
          const userUsdtTxs = txSnap2.docs.map(d => d.data()).filter((t: any) => t.userId === email.trim().toLowerCase() && t.currency === 'USDT')
          for (const tx of userUsdtTxs) {
            const desc = tx.description || tx.type || 'Unknown'
            usdtTxBreakdown.push({ desc, amount: tx.amount || 0 })
            if (tx.type !== 'ADMIN_ADJUST') {
              usdtTxTotal += (tx.amount || 0)
            }
          }
          usdtTxBreakdown.sort((a, b) => b.amount - a.amount)
        } catch (e) { console.log('USDT tx fetch:', e) }

        setSearchedUser({
          ...data,
          email: email.trim().toLowerCase(),
          directReferrals: levelData[0]?.total || 0,
          totalTeam,
          totalActive,
          levelData,
          totalUsdtWithdrawn,
          usdtWithdrawCount,
          totalBrsWithdrawn,
          brsWithdrawCount,
          totalUsers: allUsers.length,
          brsTxBreakdown,
          brsTxAdmin,
          brsTxTotal: Math.round(brsTxLegitTotal),
          usdtTxBreakdown,
          usdtTxTotal: Math.round(usdtTxTotal * 100) / 100
        })
      } else {
        setUserSearchError('❌ User not found with this email')
      }
    } catch (err) {
      console.error('User search error:', err)
      setUserSearchError('Error searching user. Try again.')
    }
    setUserSearching(false)
  }

  // LOAD ALL USERS (for Users tab)
  const loadUsersTab = async () => {
    if (usersTabLoaded) return
    try {
      const snap = await getDocs(collection(db, "users"))
      setAllUsersCount(snap.docs.length)
      const list = snap.docs.map(d => ({ email: d.id, ...d.data() }))
      list.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0
        const tB = b.createdAt?.seconds || 0
        return tB - tA
      })
      setAllUsersList(list)

      setUsersTabLoaded(true)
    } catch (err) {
      console.error('Load users error:', err)
    }
  }

  // AUTO-SUGGEST: filter users by name/email when typing 2+ chars
  const handleSearchInput = (value: string) => {
    setUserSearchEmail(value)
    if (value.trim().length >= 2 && allUsersList.length > 0) {
      const query = value.trim().toLowerCase()
      const matches = allUsersList.filter(u => {
        const email = (u.email || '').toLowerCase()
        const name = (u.fullName || '').toLowerCase()
        const username = email.split('@')[0]
        return email.includes(query) || name.includes(query) || username.includes(query)
      }).slice(0, 8)
      setSearchSuggestions(matches)
      setShowSuggestions(matches.length > 0)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }

  // BLOCK / UNBLOCK / HOLD USER
  const updateUserStatus = async (email: string, newStatus: string) => {
    setUserActionLoading(true)
    try {
      await updateDoc(doc(db, "users", email), { status: newStatus })
      alert(`✅ User ${email} status updated to: ${newStatus}`)
      // Refresh searched user
      if (searchedUser?.email === email) {
        await searchUser(email)
      }
      setUsersTabLoaded(false)
    } catch (err) {
      console.error('User status update error:', err)
      alert('❌ Failed to update user status')
    }
    setUserActionLoading(false)
  }

  // LOAD BOT REWARDS CONFIG + TOP EARNERS
  const loadBotRewards = async () => {
    setBotConfigLoading(true)
    try {
      const configSnap = await getDoc(doc(db, "botConfig", "settings"))
      if (configSnap.exists()) {
        setBotConfig(configSnap.data())
      } else {
        // Create default config
        const defaults = {
          botEarnEnabled: false, checkinReward: 2, inviteReward: 2,
          channelJoinReward: 5, streakBonusReward: 2, streakBonusDays: 7,
          dailyMaxEarn: 8, totalPoolSize: 75000000, totalDistributed: 0
        }
        await setDoc(doc(db, "botConfig", "settings"), defaults)
        setBotConfig(defaults)
      }

      // Load top earners (sorted by totalEarned desc)
      const earnSnap = await getDocs(
        query(collection(db, "botEarnings"), orderBy("totalEarned", "desc"), limit(50))
      )
      setBotEarners(earnSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    } catch (err) {
      console.error('Load bot rewards error:', err)
    }
    setBotConfigLoading(false)
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
        activatedAt: new Date(),
        activationRewardPaid: true
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

        <button
          onClick={() => { setActiveTab("users"); loadUsersTab() }}
          className={`px-4 py-2 rounded ${
            activeTab === "users"
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold"
              : "bg-gray-700"
          }`}
        >
          👤 Users ({allUsersCount || '...'})
        </button>

        <button
          onClick={() => { setActiveTab("botRewards"); loadBotRewards() }}
          className={`px-4 py-2 rounded ${
            activeTab === "botRewards"
              ? "bg-gradient-to-r from-cyan-400 to-teal-500 text-black font-bold"
              : "bg-gray-700"
          }`}
        >
          🤖 Bot Rewards
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

              {/* TARGET AUDIENCE */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Target Audience</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAirdropTarget('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      airdropTarget === 'all'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    🌍 All Users
                  </button>
                  <button
                    onClick={() => setAirdropTarget('companyDirect')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      airdropTarget === 'companyDirect'
                        ? 'bg-amber-500 text-black'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    👑 Company Direct Only
                  </button>
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
                      target: airdropTarget,
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
                    setAirdropTarget('all')
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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        drop.target === 'companyDirect'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {drop.target === 'companyDirect' ? '👑 Direct Only' : '🌍 All Users'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{drop.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Claimed: <span className="text-cyan-400 font-bold">{drop.totalClaimed || 0}</span> users
                      {' | '}Target: <span className="font-medium">{drop.target === 'companyDirect' ? '👑 Company Direct' : '🌍 Everyone'}</span>
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

      {/* ═══════════════════ USERS MANAGEMENT TAB ═══════════════════ */}
      {activeTab === "users" && (
        <>
          <h1 className="text-3xl mb-6 font-bold">👤 User Management</h1>
          <p className="text-gray-400 text-sm mb-6">
            Search users by name, email, or username. Type 2+ letters for suggestions.
            Total Users: <span className="text-cyan-400 font-bold">{allUsersCount}</span>
          </p>

          {/* SEARCH BAR */}
          <div className="bg-[#1a1a2e] p-6 mb-6 rounded-xl border border-blue-500/20">
            <h3 className="text-lg font-bold text-blue-400 mb-4">🔍 Search User</h3>
            <div className="flex gap-3 relative">
              <div className="flex-1 relative">
                <input
                  value={userSearchEmail}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setShowSuggestions(false); searchUser(userSearchEmail) } }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onFocus={() => { if (searchSuggestions.length > 0) setShowSuggestions(true) }}
                  placeholder="Search by name, email, or username..."
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-400/50 outline-none"
                />

                {/* SUGGESTIONS DROPDOWN */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-blue-500/30 rounded-xl overflow-hidden z-50 shadow-2xl shadow-black/50 max-h-[300px] overflow-y-auto">
                    {searchSuggestions.map((u: any) => (
                      <div
                        key={u.email}
                        onMouseDown={() => {
                          setUserSearchEmail(u.email)
                          setShowSuggestions(false)
                          searchUser(u.email)
                        }}
                        className="flex items-center justify-between px-4 py-3 hover:bg-blue-500/10 cursor-pointer border-b border-white/5 last:border-0 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {u.fullName || u.email?.split('@')[0]}
                          </p>
                          <p className="text-gray-500 text-[10px] truncate">{u.email}</p>
                          {u.phone && <p className="text-gray-600 text-[10px]">📱 {u.phone}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-yellow-400 text-[10px] font-bold">{Number(u.brsBalance || 0)} BRS</span>
                          <span className={`w-2 h-2 rounded-full ${
                            u.status === 'active' ? 'bg-green-400'
                              : u.status === 'blocked' ? 'bg-red-400'
                              : 'bg-yellow-400'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => { setShowSuggestions(false); searchUser(userSearchEmail) }}
                disabled={userSearching}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg font-bold text-white hover:scale-[1.02] transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {userSearching ? '⏳ Searching...' : '🔍 Search'}
              </button>
            </div>

            {userSearchError && (
              <p className="text-red-400 text-sm mt-3">{userSearchError}</p>
            )}
          </div>

          {/* SEARCHED USER DETAILS */}
          {searchedUser && (
            <div className="bg-[#1a1a2e] p-6 mb-6 rounded-xl border border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-cyan-400">📋 User Details</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  searchedUser.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : searchedUser.status === 'blocked' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : searchedUser.status === 'hold' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {searchedUser.status === 'active' ? '🟢 Active'
                    : searchedUser.status === 'blocked' ? '🔴 Blocked'
                    : searchedUser.status === 'hold' ? '🟠 On Hold'
                    : '🟡 Pending'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Full Name</p>
                  <p className="text-white font-bold text-lg">{searchedUser.fullName || 'Not Set'}</p>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-cyan-400 font-mono text-sm break-all">{searchedUser.email}</p>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-white font-medium">{searchedUser.phone || 'Not Set'}</p>
                </div>
                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Referral Code</p>
                  <p className="text-yellow-400 font-mono font-bold">{searchedUser.referralCode || 'N/A'}</p>
                </div>
              </div>

              {/* BALANCES */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 p-4 rounded-xl border border-yellow-500/20">
                  <p className="text-xs text-gray-500 mb-1">BRS Balance</p>
                  <p className="text-2xl font-bold text-yellow-400">{Number(searchedUser.brsBalance || 0)} <span className="text-sm">BRS</span></p>
                  <p className="text-xs text-gray-500 mt-1">≈ ${(Number(searchedUser.brsBalance || 0) * 0.005).toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-4 rounded-xl border border-green-500/20">
                  <p className="text-xs text-gray-500 mb-1">USDT Balance</p>
                  <p className="text-2xl font-bold text-green-400">${Number(searchedUser.usdtBalance || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">BEP-20</p>
                </div>
              </div>

              {/* TEAM MEMBERS — 12 LEVELS */}
              <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 p-4 rounded-xl border border-purple-500/20 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500">👥 Total Team Members</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      <span className="text-green-400">{searchedUser.totalActive || 0} active</span>
                      {' · '}
                      <span className="text-yellow-400">{(searchedUser.totalTeam || 0) - (searchedUser.totalActive || 0)} pending</span>
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-purple-400">{searchedUser.totalTeam || 0}</p>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {(searchedUser.levelData || []).map((ld: any, i: number) => {
                    const levelColors = [
                      'text-cyan-400', 'text-blue-400', 'text-indigo-400', 'text-purple-400',
                      'text-violet-400', 'text-fuchsia-400', 'text-pink-400', 'text-rose-400',
                      'text-amber-400', 'text-yellow-400', 'text-lime-400', 'text-emerald-400'
                    ]
                    const bgHighlight = ld.total > 0 ? 'border-white/10 bg-black/40' : 'border-transparent bg-black/20'
                    return (
                      <div key={i} className={`p-3 rounded-xl text-center border ${bgHighlight}`}>
                        <p className="text-[10px] text-gray-400 font-medium mb-1">Level {i + 1}</p>
                        <p className={`${levelColors[i]} font-bold text-xl`}>{ld.total}</p>
                        {ld.total > 0 && (
                          <div className="flex items-center justify-center gap-2 mt-1.5">
                            <span className="text-[11px] text-green-400 font-semibold">{ld.active} ✅</span>
                            {ld.pending > 0 && <span className="text-[11px] text-yellow-400 font-semibold">{ld.pending} ⏳</span>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* WITHDRAWALS */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gradient-to-br from-red-500/10 to-orange-500/5 p-4 rounded-xl border border-red-500/20">
                  <p className="text-xs text-gray-500 mb-1">💸 USDT Withdrawn</p>
                  <p className="text-xl font-bold text-red-400">${searchedUser.totalUsdtWithdrawn?.toFixed(2) || '0.00'}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{searchedUser.usdtWithdrawCount || 0} withdrawal(s)</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 p-4 rounded-xl border border-amber-500/20">
                  <p className="text-xs text-gray-500 mb-1">🪙 BRS Withdrawn</p>
                  <p className="text-xl font-bold text-amber-400">{searchedUser.totalBrsWithdrawn || 0} BRS</p>
                  <p className="text-[10px] text-gray-600 mt-1">{searchedUser.brsWithdrawCount || 0} withdrawal(s)</p>
                </div>
              </div>

              {/* MORE INFO */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] text-gray-500">Referred By</p>
                  <p className="text-white text-sm font-medium">{searchedUser.referredBy || 'Direct / Company'}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] text-gray-500">Direct Referrals</p>
                  <p className="text-cyan-400 text-sm font-bold">{searchedUser.directReferrals}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] text-gray-500">Company Direct</p>
                  <p className="text-sm font-medium">{searchedUser.isCompanyDirect ? '👑 Yes' : 'No'}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] text-gray-500">Wallet Address</p>
                  <p className="text-cyan-400 text-[10px] font-mono break-all">{searchedUser.walletAddress || 'Not Set'}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] text-gray-500">Joined Date</p>
                  <p className="text-white text-sm">{searchedUser.createdAt?.toDate?.()?.toLocaleDateString?.('en-IN') || 'Unknown'}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                  <p className="text-[10px] text-gray-500">30-Day Reward</p>
                  <p className="text-sm font-medium">{searchedUser.brs30DayRewardPaid ? '✅ Claimed' : '⏳ Pending'}</p>
                </div>
              </div>

              {/* 📊 BRS BREAKDOWN — CLEAN VIEW */}
              <div className="border-t border-white/10 pt-4 mb-4">
                <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">📊 BRS Breakdown — Real Earnings</p>
                
                {/* ✅ LEGITIMATE EARNINGS */}
                <div className="space-y-1.5 mb-3">
                  {searchedUser.brsTxBreakdown && Object.entries(searchedUser.brsTxBreakdown as Record<string, number>)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .map(([source, amount]) => (
                    <div key={source} className="flex items-center justify-between px-3 py-2 rounded-lg border bg-white/5 border-white/10">
                      <span className="text-xs text-gray-300">{source}</span>
                      <span className={`font-bold text-sm ${
                        (amount as number) > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>{(amount as number) > 0 ? '+' : ''}{amount} BRS</span>
                    </div>
                  ))}
                  {(!searchedUser.brsTxBreakdown || Object.keys(searchedUser.brsTxBreakdown).length === 0) && (
                    <p className="text-gray-500 text-xs text-center py-2">No BRS transactions found</p>
                  )}
                </div>

                {/* Totals — LEGITIMATE ONLY */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-center">
                    <p className="text-[9px] text-gray-500">Real Earned Total</p>
                    <p className="text-green-400 font-bold text-lg">{searchedUser.brsTxTotal || 0} BRS</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center border ${
                    Math.abs((searchedUser.brsBalance || 0) - (searchedUser.brsTxTotal || 0)) > 5
                      ? 'bg-red-500/10 border-red-500/20' 
                      : 'bg-green-500/10 border-green-500/20'
                  }`}>
                    <p className="text-[9px] text-gray-500">Actual Balance</p>
                    <p className={`font-bold text-lg ${
                      Math.abs((searchedUser.brsBalance || 0) - (searchedUser.brsTxTotal || 0)) > 5
                        ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {searchedUser.brsBalance || 0} BRS
                      {Math.abs((searchedUser.brsBalance || 0) - (searchedUser.brsTxTotal || 0)) <= 5 ? ' ✅' : ' ❌'}
                    </p>
                  </div>
                </div>

                {/* 🔧 ADMIN HISTORY — Collapsible */}
                {searchedUser.brsTxAdmin && Object.keys(searchedUser.brsTxAdmin).length > 0 && (
                  <details className="mb-2">
                    <summary className="text-[10px] text-orange-400/70 cursor-pointer hover:text-orange-400 transition">
                      🔧 Admin/Audit History ({Object.keys(searchedUser.brsTxAdmin).length} entries) — click to expand
                    </summary>
                    <div className="space-y-1 mt-2">
                      {Object.entries(searchedUser.brsTxAdmin as Record<string, number>)
                        .map(([source, amount]) => (
                        <div key={source} className="flex items-center justify-between px-3 py-1.5 rounded-lg border bg-orange-500/5 border-orange-500/10">
                          <span className="text-[10px] text-gray-500">{source}</span>
                          <span className={`font-medium text-xs ${
                            (amount as number) > 0 ? 'text-orange-300' : 'text-orange-400'
                          }`}>{(amount as number) > 0 ? '+' : ''}{amount} BRS</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              {/* 💰 USDT BREAKDOWN — FROM TRANSACTIONS */}
              <div className="border-t border-white/10 pt-4 mb-4">
                <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">💰 USDT Breakdown — Commission History</p>
                
                <div className="space-y-1.5 mb-3">
                  {searchedUser.usdtTxBreakdown && searchedUser.usdtTxBreakdown.length > 0 ? (
                    searchedUser.usdtTxBreakdown.map((tx: any, i: number) => (
                      <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                        tx.desc.includes('ADMIN') ? 'bg-orange-500/5 border-orange-500/10' : 'bg-white/5 border-white/10'
                      }`}>
                        <span className="text-[10px] text-gray-400 flex-1 mr-2">{tx.desc}</span>
                        <span className={`font-bold text-sm whitespace-nowrap ${
                          tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>{tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-xs text-center py-2">No USDT transactions found</p>
                  )}
                </div>

                {/* USDT Totals */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-center">
                    <p className="text-[9px] text-gray-500">TX Earned Total</p>
                    <p className="text-green-400 font-bold text-lg">${searchedUser.usdtTxTotal || '0.00'}</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center border ${
                    Math.abs((searchedUser.usdtBalance || 0) - (searchedUser.usdtTxTotal || 0)) > 0.5
                      ? 'bg-red-500/10 border-red-500/20' 
                      : 'bg-green-500/10 border-green-500/20'
                  }`}>
                    <p className="text-[9px] text-gray-500">Actual USDT Balance</p>
                    <p className={`font-bold text-lg ${
                      Math.abs((searchedUser.usdtBalance || 0) - (searchedUser.usdtTxTotal || 0)) > 0.5
                        ? 'text-red-400' : 'text-green-400'
                    }`}>
                      ${(searchedUser.usdtBalance || 0).toFixed(2)}
                      {Math.abs((searchedUser.usdtBalance || 0) - (searchedUser.usdtTxTotal || 0)) <= 0.5 ? ' ✅' : ' ❌'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ADMIN ACTIONS */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">⚡ Admin Actions</p>
                <div className="flex gap-3 flex-wrap">
                  {searchedUser.status !== 'active' && (
                    <button
                      disabled={userActionLoading}
                      onClick={async () => {
                        if (!confirm(`⚡ Force Activate ${searchedUser.email}?\n\nThis will:\n• Set status to Active\n• Credit 150 BRS\n• Distribute referral commissions\n• Record as admin-verified deposit\n\nProceed?`)) return
                        setUserActionLoading(true)
                        try {
                          const userEmail = searchedUser.email
                          // Check if already active
                          const snap = await getDoc(doc(db, "users", userEmail))
                          if (snap.exists() && snap.data().status === 'active') {
                            alert('⚠️ User is already active!')
                            setUserActionLoading(false)
                            return
                          }
                          // 🔒 Check if deposit already exists
                          const depsSnap = await getDocs(collection(db, "deposits"))
                          const existingDeposit = depsSnap.docs.some((d: any) => {
                            const dd = d.data()
                            return dd.userId === userEmail && (dd.status === "verified" || dd.status === "approved") && dd.amount >= 12
                          })
                          if (!existingDeposit) {
                            await addDoc(collection(db, "deposits"), {
                              userId: userEmail,
                              amount: 12,
                              txHash: 'admin-force-activate',
                              status: "verified",
                              verifiedBy: "admin-manual",
                              fromAddress: "admin",
                              toAddress: "0xCD72FfF7F22eC409FCAcED1A06AEC227da6C1A56",
                              createdAt: new Date()
                            })
                          }

                          // 🔒 Use user document flag — 100% reliable duplicate check
                          const freshSnap = await getDoc(doc(db, "users", userEmail))
                          const alreadyRewarded = freshSnap.exists() && freshSnap.data().activationRewardPaid === true

                          if (alreadyRewarded) {
                            await updateDoc(doc(db, "users", userEmail), {
                              status: "active",
                              activatedAt: freshSnap.data().activatedAt || new Date()
                            })
                            await runFullActivation(userEmail)
                            alert(`✅ ${userEmail} Force Activated!\n• Status: Active\n• BRS already credited (no duplicate)\n• Commissions distributed`)
                          } else {
                            await updateDoc(doc(db, "users", userEmail), {
                              status: "active",
                              brsBalance: increment(150),
                              activatedAt: new Date(),
                              activationRewardPaid: true
                            })
                            await logTransaction(userEmail, 150, "BRS", "Membership activation reward (Admin)")
                            await runFullActivation(userEmail)
                            alert(`✅ ${userEmail} Force Activated!\n• Status: Active\n• 150 BRS credited\n• Commissions distributed`)
                          }
                          await searchUser(userEmail)
                          setUsersTabLoaded(false)
                        } catch (err) {
                          console.error('Force activate error:', err)
                          alert('❌ Force activation failed. Check console.')
                        }
                        setUserActionLoading(false)
                      }}
                      className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black rounded-lg font-bold text-sm transition-all hover:scale-105 disabled:opacity-50 shadow-lg shadow-green-500/20"
                    >
                      ⚡ Force Activate
                    </button>
                  )}
                  {searchedUser.status !== 'blocked' && (
                    <button
                      disabled={userActionLoading}
                      onClick={() => {
                        if (confirm(`⚠️ Block user ${searchedUser.email}? They won't be able to use the platform.`)) {
                          updateUserStatus(searchedUser.email, 'blocked')
                        }
                      }}
                      className="px-5 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
                    >
                      🚫 Block
                    </button>
                  )}
                  {searchedUser.status !== 'hold' && (
                    <button
                      disabled={userActionLoading}
                      onClick={() => {
                        if (confirm(`⏸ Put user ${searchedUser.email} on hold?`)) {
                          updateUserStatus(searchedUser.email, 'hold')
                        }
                      }}
                      className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-black rounded-lg font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
                    >
                      ⏸ Hold
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(searchedUser.email)
                      alert('Email copied!')
                    }}
                    className="px-5 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg font-bold text-sm hover:bg-cyan-500/30 transition-all"
                  >
                    📋 Copy Email
                  </button>
                  <button
                    disabled={userActionLoading}
                    onClick={async () => {
                      const current = searchedUser.brsBalance || 0
                      const newVal = prompt(`🪙 Adjust BRS Balance\n\nCurrent: ${current} BRS\n\nEnter NEW BRS balance:`, String(current))
                      if (newVal === null) return
                      const num = parseFloat(newVal)
                      if (isNaN(num) || num < 0) { alert('❌ Invalid number'); return }
                      if (!confirm(`⚠️ Change BRS balance?\n\nUser: ${searchedUser.email}\nOLD: ${current} BRS\nNEW: ${num} BRS\n\nDifference: ${num - current > 0 ? '+' : ''}${(num - current).toFixed(2)} BRS\n\nConfirm?`)) return
                      setUserActionLoading(true)
                      try {
                        await updateDoc(doc(db, "users", searchedUser.email), { brsBalance: num })
                        await addDoc(collection(db, "transactions"), {
                          userId: searchedUser.email,
                          amount: num - current,
                          currency: "BRS",
                          type: "ADMIN_ADJUST",
                          description: `Admin adjusted BRS: ${current} → ${num}`,
                          createdAt: new Date()
                        })
                        alert(`✅ BRS updated: ${current} → ${num}`)
                        await searchUser(searchedUser.email)
                      } catch (err) { console.error(err); alert('❌ Failed') }
                      setUserActionLoading(false)
                    }}
                    className="px-5 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg font-bold text-sm hover:bg-yellow-500/30 transition-all disabled:opacity-50"
                  >
                    🪙 Adjust BRS
                  </button>
                  <button
                    disabled={userActionLoading}
                    onClick={async () => {
                      const current = searchedUser.usdtBalance || 0
                      const newVal = prompt(`💰 Adjust USDT Balance\n\nCurrent: $${current.toFixed(2)}\n\nEnter NEW USDT balance:`, String(current))
                      if (newVal === null) return
                      const num = parseFloat(newVal)
                      if (isNaN(num) || num < 0) { alert('❌ Invalid number'); return }
                      if (!confirm(`⚠️ Change USDT balance?\n\nUser: ${searchedUser.email}\nOLD: $${current.toFixed(2)}\nNEW: $${num.toFixed(2)}\n\nDifference: ${num - current > 0 ? '+$' : '-$'}${Math.abs(num - current).toFixed(2)}\n\nConfirm?`)) return
                      setUserActionLoading(true)
                      try {
                        await updateDoc(doc(db, "users", searchedUser.email), { usdtBalance: num })
                        await addDoc(collection(db, "transactions"), {
                          userId: searchedUser.email,
                          amount: num - current,
                          currency: "USDT",
                          type: "ADMIN_ADJUST",
                          description: `Admin adjusted USDT: ${current} → ${num}`,
                          createdAt: new Date()
                        })
                        alert(`✅ USDT updated: $${current.toFixed(2)} → $${num.toFixed(2)}`)
                        await searchUser(searchedUser.email)
                      } catch (err) { console.error(err); alert('❌ Failed') }
                      setUserActionLoading(false)
                    }}
                    className="px-5 py-2 bg-green-500/20 text-green-400 rounded-lg font-bold text-sm hover:bg-green-500/30 transition-all disabled:opacity-50"
                  >
                    💰 Adjust USDT
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════ SPLIT VIEW: ACTIVE + PENDING ═══════════════════ */}

          {/* 🔍 BRS AUDIT TOOL — TRANSACTION-BASED (DEFINITIVE) */}
          <div className="bg-[#1a1a2e] p-6 mb-6 rounded-xl border border-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-red-400">🔍 BRS Audit Tool</h3>
                <p className="text-[10px] text-gray-500">Scans transaction history to calculate TRUE correct balance</p>
              </div>
              <button
                disabled={auditRunning}
                onClick={async () => {
                  setAuditRunning(true)
                  setAuditResults([])
                  setAuditDone(false)
                  try {
                    // Step 1: Get ALL BRS transactions
                    const txSnap = await getDocs(collection(db, "transactions"))
                    const allTx = txSnap.docs.map(d => d.data())
                    
                    // Step 2: Group by user — sum REAL earnings only (exclude audit/undo)
                    const userEarnings: Record<string, { earned: number, sources: string[] }> = {}
                    for (const tx of allTx) {
                      if (tx.currency !== "BRS") continue
                      // Skip audit-related transactions
                      if (tx.type === "ADMIN_AUDIT_FIX" || tx.type === "ADMIN_AUDIT_UNDO" || tx.type === "ADMIN_ADJUST") continue
                      const email = tx.userId
                      if (!email) continue
                      if (!userEarnings[email]) userEarnings[email] = { earned: 0, sources: [] }
                      userEarnings[email].earned += (tx.amount || 0)
                      // Track sources
                      const src = tx.type || tx.description || 'unknown'
                      if (!userEarnings[email].sources.includes(src)) {
                        userEarnings[email].sources.push(src)
                      }
                    }
                    
                    // Step 3: Get all users and compare
                    const usersSnap = await getDocs(collection(db, "users"))
                    const mismatched: any[] = []
                    usersSnap.docs.forEach(d => {
                      const u: any = d.data()
                      if (u.role === 'company') return
                      if (u.status !== 'active') return
                      const actual = u.brsBalance || 0
                      const fromTx = Math.round(userEarnings[u.email]?.earned || 0)
                      const diff = actual - fromTx
                      if (Math.abs(diff) > 1) {
                        mismatched.push({
                          email: u.email,
                          name: u.fullName || '',
                          actual,
                          correct: fromTx,
                          diff,
                          sources: userEarnings[u.email]?.sources?.join(', ') || 'none'
                        })
                      }
                    })
                    mismatched.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
                    setAuditResults(mismatched)
                    setAuditDone(true)
                  } catch (err) {
                    console.error('Audit error:', err)
                    alert('Audit failed: ' + err)
                  }
                  setAuditRunning(false)
                }}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-lg font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
              >
                {auditRunning ? '⏳ Scanning Transactions...' : '🔍 Audit (Transaction-Based)'}
              </button>
            </div>

            {auditDone && (
              <div>
                {auditResults.length === 0 ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                    <p className="text-green-400 font-bold">✅ All users BRS matches their transaction history! No mismatches.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-red-400 font-bold text-sm">⚠️ {auditResults.length} users with balance ≠ transaction history:</p>
                      <button
                        disabled={auditFixing}
                        onClick={async () => {
                          if (!confirm(`✅ Fix ALL ${auditResults.length} users?\n\nThis will set each user's BRS to EXACTLY what their transaction history shows.\n\nThis is 100% accurate based on real earnings.\n\nProceed?`)) return
                          setAuditFixing(true)
                          try {
                            for (const u of auditResults) {
                              await updateDoc(doc(db, "users", u.email), {
                                brsBalance: u.correct,
                                activationRewardPaid: true
                              })
                              await addDoc(collection(db, "transactions"), {
                                userId: u.email,
                                amount: u.correct - u.actual,
                                currency: "BRS",
                                type: "ADMIN_TX_SYNC",
                                description: `TX Sync: ${u.actual} → ${u.correct} BRS (matched to transaction history)`,
                                createdAt: new Date()
                              })
                            }
                            alert(`✅ Fixed ${auditResults.length} users! All balances now match transaction history.`)
                            setAuditResults([])
                            setAuditDone(false)
                          } catch (err) {
                            console.error('Fix error:', err)
                            alert('Fix failed: ' + err)
                          }
                          setAuditFixing(false)
                        }}
                        className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-black rounded-lg font-bold text-sm hover:scale-105 transition-all disabled:opacity-50"
                      >
                        {auditFixing ? '⏳ Syncing...' : `✅ Sync All to Transaction History`}
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {auditResults.map((u, i) => (
                        <div key={i} className={`border rounded-lg p-3 flex items-center justify-between ${u.diff > 0 ? 'bg-red-500/5 border-red-500/15' : 'bg-yellow-500/5 border-yellow-500/15'}`}>
                          <div>
                            <p className="text-white text-sm font-medium">{u.name || u.email}</p>
                            <p className="text-[10px] text-gray-500">{u.email}</p>
                            <p className="text-[9px] text-gray-600 mt-0.5">Sources: {u.sources}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-sm ${u.diff > 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                              {u.actual} → {u.correct} BRS
                            </p>
                            <p className="text-[9px] text-gray-500">
                              {u.diff > 0 ? `${u.diff} extra` : `${Math.abs(u.diff)} missing`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT PANEL — ✅ ACTIVE USERS */}
            <div className="bg-[#0d1117]/60 border border-green-500/15 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  ✅ Active Users
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full font-semibold">
                    {allUsersList.filter(u => u.status === 'active').length}
                  </span>
                </h3>
              </div>
              {(() => {
                const activeUsers = allUsersList
                  .filter(u => u.status === 'active')
                  .sort((a: any, b: any) => {
                    const tA = a.activatedAt?.seconds || a.createdAt?.seconds || 0
                    const tB = b.activatedAt?.seconds || b.createdAt?.seconds || 0
                    return tB - tA
                  })
                return activeUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No active users yet</p>
                ) : (
                  <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                    {activeUsers.map((u: any, i: number) => (
                      <div
                        key={u.email}
                        onClick={() => { setUserSearchEmail(u.email); searchUser(u.email) }}
                        className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10 hover:border-green-500/30 cursor-pointer transition-all hover:bg-green-500/10 group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center shrink-0">
                            <span className="text-green-400 text-[10px] font-bold">{i + 1}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate group-hover:text-green-300 transition-colors">
                              {u.fullName || u.email?.split('@')[0]}
                            </p>
                            <p className="text-gray-500 text-[10px] truncate">{u.email}</p>
                            {u.phone && <p className="text-gray-600 text-[10px]">📱 {u.phone}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-yellow-400 text-xs font-bold">{Number(u.brsBalance || 0)} BRS</p>
                            <p className="text-green-400 text-[10px]">${Number(u.usdtBalance || 0).toFixed(2)}</p>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-green-400/30 ring-offset-1 ring-offset-[#0d1117] shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* RIGHT PANEL — ⏳ PENDING USERS */}
            <div className="bg-[#0d1117]/60 border border-yellow-500/15 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  ⏳ Pending Users
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2.5 py-0.5 rounded-full font-semibold">
                    {allUsersList.filter(u => u.status !== 'active').length}
                  </span>
                </h3>
              </div>
              {(() => {
                const pendingUsers = allUsersList
                  .filter(u => u.status !== 'active')
                  .sort((a: any, b: any) => {
                    const tA = a.createdAt?.seconds || 0
                    const tB = b.createdAt?.seconds || 0
                    return tB - tA
                  })
                return pendingUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">🎉 All users are active!</p>
                ) : (
                  <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                    {pendingUsers.map((u: any, i: number) => (
                      <div
                        key={u.email}
                        onClick={() => { setUserSearchEmail(u.email); searchUser(u.email) }}
                        className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 hover:border-yellow-500/30 cursor-pointer transition-all hover:bg-yellow-500/10 group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center shrink-0">
                            <span className="text-yellow-400 text-[10px] font-bold">{i + 1}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate group-hover:text-yellow-300 transition-colors">
                              {u.fullName || u.email?.split('@')[0]}
                            </p>
                            <p className="text-gray-500 text-[10px] truncate">{u.email}</p>
                            {u.phone && <p className="text-gray-600 text-[10px]">📱 {u.phone}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-yellow-400/60 text-xs font-bold">{Number(u.brsBalance || 0)} BRS</p>
                            <p className="text-gray-500 text-[10px]">${Number(u.usdtBalance || 0).toFixed(2)}</p>
                          </div>
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-[#0d1117] ${
                            u.status === 'blocked' ? 'bg-red-400 ring-red-400/30'
                              : u.status === 'hold' ? 'bg-orange-400 ring-orange-400/30'
                              : 'bg-yellow-400 ring-yellow-400/30'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
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

      {/* 🤖 BOT REWARDS TAB */}
      {activeTab === "botRewards" && (
        <>
          <h1 className="text-3xl mb-6 font-bold">🤖 Bot Rewards Control</h1>

          {botConfigLoading && <p className="text-cyan-400 animate-pulse mb-4">⏳ Loading bot config...</p>}

          {botConfig && (
            <div className="space-y-6">

              {/* MASTER TOGGLE */}
              <div className="bg-[#1a1a2e] p-6 rounded-xl border border-cyan-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Master Toggle</h3>
                    <p className="text-sm text-gray-400">Enable or disable all bot earning features</p>
                  </div>
                  <button
                    onClick={async () => {
                      setBotSaving(true)
                      try {
                        const newVal = !botConfig.botEarnEnabled
                        await updateDoc(doc(db, "botConfig", "settings"), { botEarnEnabled: newVal })
                        setBotConfig({ ...botConfig, botEarnEnabled: newVal })
                        alert(newVal ? '✅ Bot Earn ENABLED!' : '🔒 Bot Earn DISABLED!')
                      } catch (err) { console.error(err); alert('Error updating') }
                      setBotSaving(false)
                    }}
                    disabled={botSaving}
                    className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
                      botConfig.botEarnEnabled
                        ? 'bg-green-500 text-black hover:bg-green-400'
                        : 'bg-red-500/80 text-white hover:bg-red-400'
                    }`}
                  >
                    {botConfig.botEarnEnabled ? '🟢 LIVE' : '🔴 DISABLED'}
                  </button>
                </div>
              </div>

              {/* POOL MONITOR */}
              <div className="bg-[#1a1a2e] p-6 rounded-xl border border-purple-500/20">
                <h3 className="text-lg font-bold text-purple-400 mb-4">📊 Token Pool Monitor</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-white">{((botConfig.totalPoolSize || 75000000) / 10000000).toFixed(1)} Cr</p>
                    <p className="text-xs text-gray-400 mt-1">Total Pool</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-green-400">{(botConfig.totalDistributed || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Distributed</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-cyan-400">
                      {(((botConfig.totalPoolSize || 75000000) - (botConfig.totalDistributed || 0)) / 10000000).toFixed(2)} Cr
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Remaining</p>
                  </div>
                </div>
                <div className="mt-4 bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((botConfig.totalDistributed || 0) / (botConfig.totalPoolSize || 75000000)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">
                  {(((botConfig.totalDistributed || 0) / (botConfig.totalPoolSize || 75000000)) * 100).toFixed(4)}% used
                </p>
              </div>

              {/* REWARD SETTINGS */}
              <div className="bg-[#1a1a2e] p-6 rounded-xl border border-amber-500/20">
                <h3 className="text-lg font-bold text-amber-400 mb-4">⚙️ Reward Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'checkinReward', label: '✅ Check-in Reward', suffix: 'BRS' },
                    { key: 'inviteReward', label: '👥 Invite Reward', suffix: 'BRS' },
                    { key: 'channelJoinReward', label: '📢 Channel Join', suffix: 'BRS' },
                    { key: 'streakBonusReward', label: '🔥 Streak Bonus', suffix: 'BRS' },
                    { key: 'streakBonusDays', label: '📅 Streak Days', suffix: 'days' },
                    { key: 'dailyMaxEarn', label: '🧢 Daily Cap', suffix: 'BRS' },
                  ].map(item => (
                    <div key={item.key} className="bg-white/5 p-3 rounded-xl">
                      <label className="text-xs text-gray-400">{item.label}</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          value={botConfig[item.key] || 0}
                          onChange={(e) => setBotConfig({ ...botConfig, [item.key]: Number(e.target.value) })}
                          className="w-full p-2 rounded-lg bg-black/30 border border-white/10 text-white text-lg font-bold"
                        />
                        <span className="text-xs text-gray-500 whitespace-nowrap">{item.suffix}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    setBotSaving(true)
                    try {
                      await updateDoc(doc(db, "botConfig", "settings"), {
                        checkinReward: botConfig.checkinReward,
                        inviteReward: botConfig.inviteReward,
                        channelJoinReward: botConfig.channelJoinReward,
                        streakBonusReward: botConfig.streakBonusReward,
                        streakBonusDays: botConfig.streakBonusDays,
                        dailyMaxEarn: botConfig.dailyMaxEarn,
                      })
                      alert('✅ Reward settings saved!')
                    } catch (err) { console.error(err); alert('Error saving') }
                    setBotSaving(false)
                  }}
                  disabled={botSaving}
                  className="mt-4 w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {botSaving ? '⏳ Saving...' : '💾 Save Reward Settings'}
                </button>
              </div>

              {/* TOP EARNERS */}
              <div className="bg-[#1a1a2e] p-6 rounded-xl border border-green-500/20">
                <h3 className="text-lg font-bold text-green-400 mb-4">🏆 Top Earners ({botEarners.length})</h3>
                {botEarners.length === 0 && <p className="text-gray-500">No earners yet</p>}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {botEarners.map((u, i) => (
                    <div key={u.telegramId || i} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-700 text-gray-300'
                        }`}>{i + 1}</span>
                        <div>
                          <p className="text-sm text-white font-medium">{u.username || u.linkedEmail || 'Unknown'}</p>
                          <p className="text-[10px] text-gray-500">
                            🔥 {u.currentStreak || 0}d streak | 👥 {u.inviteCount || 0} invites | 📋 {u.totalCheckins || 0} checkins
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-cyan-400">{u.totalEarned || 0} BRS</p>
                        <p className="text-[10px] text-gray-500">{u.linkedEmail ? '🔗' : '⚠️'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </>
      )}

    </div>

  )

}

// Load BRS Withdrawals function — add after other load functions