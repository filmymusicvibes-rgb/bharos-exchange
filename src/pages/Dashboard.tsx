import { getUser } from "../lib/session"
import { useEffect, useState, useRef } from "react"
import { navigate } from "@/lib/router"
import { db } from "../lib/firebase"
import { doc, getDoc, updateDoc, addDoc, collection, getDocs, query, where, orderBy, limit, increment } from "firebase/firestore"
import { Users, Trophy, ArrowUpRight, ArrowDownLeft, Activity, Target, Grid3X3, Plane, ChevronRight, User, Coins, Copy, Share2, MessageCircle, Send, Check, Gift, Sparkles, Clock } from "lucide-react"

import Navbar from "../components/Navbar"
import LoginPopup from "../components/LoginPopup"

import brsLogo from "../assets/brs.png"
import usdtLogo from "../assets/usdt.png"
import trustLogo from "../assets/trustwallet.png"
import BRSPriceCard from "../components/BRSPriceCard"
import { QRCodeSVG } from 'qrcode.react'
import UserBadgeCard from "../components/UserBadgeCard"
import AnnouncementBanner from "../components/AnnouncementBanner"
import { logTransaction, runFullActivation } from "../lib/commission"

export default function Dashboard() {

  const [loading, setLoading] = useState(true)
  const [referralLink, setReferralLink] = useState("")
  const [status, setStatus] = useState("")
  const [usdt, setUsdt] = useState(0)
  const [brs, setBrs] = useState(0)
  const [totalBrsEarned, setTotalBrsEarned] = useState(0)
  const [totalUsdtEarned, setTotalUsdtEarned] = useState(0)
  const [days, setDays] = useState(0)
  const [rewardClaimed, setRewardClaimed] = useState(false)
  const [tripAchieved, setTripAchieved] = useState(false)
  const [tripContactSubmitted, setTripContactSubmitted] = useState(false)
  const [tripFormLoading, setTripFormLoading] = useState(false)
  const [tripFullName, setTripFullName] = useState("")
  const [tripPhone, setTripPhone] = useState("")
  const [showTripForm, setShowTripForm] = useState(false)

  // NEW STATES
  const [teamSize, setTeamSize] = useState(0)
  const [rank, setRank] = useState(0)
  const [recentTxns, setRecentTxns] = useState<any[]>([])
  const [directCount, setDirectCount] = useState(0)
  const [matrixCount, setMatrixCount] = useState(0)
  const [tripCount, setTripCount] = useState(0)
  const [directAchieved, setDirectAchieved] = useState(false)
  const [matrixAchieved, setMatrixAchieved] = useState(false)
  const [tripMilestone, setTripMilestone] = useState(false)
  const [refCode, setRefCode] = useState("")
  const [isCompanyDirect, setIsCompanyDirect] = useState(false)
  const [userName, setUserName] = useState("")

  // AIRDROP STATES
  const [activeAirdrops, setActiveAirdrops] = useState<any[]>([])
  const [claimedAirdrops, setClaimedAirdrops] = useState<Record<string, boolean>>({})
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [justClaimedId, setJustClaimedId] = useState<string | null>(null)

  // BOT EARN STATES
  const [botEarnData, setBotEarnData] = useState<any>(null)
  const [botEarnEnabled, setBotEarnEnabled] = useState(false)
  
  const email = getUser()
  const healAttemptedRef = useRef(false)



  // Load extra dashboard data (team, rank, transactions, milestones)
  useEffect(() => {
    const loadExtras = async () => {
      const email = getUser()
      if (!email) return

      try {
        // Get user data
        const userSnap = await getDoc(doc(db, "users", email))
        if (!userSnap.exists()) return
        const userData: any = userSnap.data()
        const myCode = userData.referralCode

        setDirectAchieved(userData.directRewardPaid || false)
        setMatrixAchieved(userData.matrixRewardPaid || false)
        setTripMilestone(userData.tripAchieved || false)

        // Get all users for team + rank
        const usersSnap = await getDocs(collection(db, "users"))
        const allUsers = usersSnap.docs.map(d => d.data())

        // Team stats
        const l1 = allUsers.filter(u => u.referredBy === myCode && u.status === "active")
        const l1Codes = l1.map(u => u.referralCode)
        const l2 = allUsers.filter(u => l1Codes.includes(u.referredBy) && u.status === "active")
        const l2Codes = l2.map(u => u.referralCode)
        const l3 = allUsers.filter(u => l2Codes.includes(u.referredBy) && u.status === "active")
        const l3Codes = l3.map(u => u.referralCode)
        const l4 = allUsers.filter(u => l3Codes.includes(u.referredBy) && u.status === "active")

        setDirectCount(l1.length)
        setMatrixCount(l1.length + l2.length + l3.length)
        setTripCount(l1.length + l2.length + l3.length + l4.length)
        setTeamSize(l1.length + l2.length + l3.length + l4.length)

        // Rank (by USDT earnings)
        const sorted = allUsers
          .filter(u => u.status === "active")
          .sort((a, b) => (b.usdtBalance || 0) - (a.usdtBalance || 0))
        const myRank = sorted.findIndex(u => u.email === email) + 1
        setRank(myRank || 0)

        // Recent transactions
        try {
          const txnSnap = await getDocs(
            query(
              collection(db, "transactions"),
              where("userId", "==", email),
              orderBy("createdAt", "desc"),
              limit(4)
            )
          )
          setRecentTxns(txnSnap.docs.map(d => d.data()))
        } catch (txErr) {
          console.log("Recent txns load:", txErr)
        }
      } catch (err) {
        console.log("Extra data load:", err)
      }
    }
    loadExtras()
  }, [])

  // ✅ CALCULATE TOTAL EARNED (independent — never fails silently)
  useEffect(() => {
    const calcTotalEarned = async () => {
      const email = getUser()
      if (!email) return

      try {
        // Get current balances
        const userSnap = await getDoc(doc(db, "users", email))
        if (!userSnap.exists()) return
        const userData: any = userSnap.data()
        const currentBrs = Number(userData.brsBalance || 0)
        const currentUsdt = Number(userData.usdtBalance || 0)

        // USDT withdrawals (approved)
        let usdtWithdrawn = 0
        try {
          const wSnap = await getDocs(collection(db, "withdrawals"))
          wSnap.docs.forEach(d => {
            const w: any = d.data()
            if (w.userId === email && w.status === 'approved') {
              usdtWithdrawn += Number(w.amount || 0)
            }
          })
        } catch (e) { console.log("USDT withdrawals:", e) }

        // BRS withdrawals (approved)
        let brsWithdrawn = 0
        try {
          const bSnap = await getDocs(collection(db, "brs_withdrawals"))
          bSnap.docs.forEach(d => {
            const w: any = d.data()
            if (w.userId === email && w.status === 'approved') {
              brsWithdrawn += Number(w.amount || 0)
            }
          })
        } catch (e) { console.log("BRS withdrawals:", e) }

        // BRS sent via transfers
        let brsSent = 0
        try {
          const txSnap = await getDocs(
            query(collection(db, "transactions"), where("userId", "==", email))
          )
          txSnap.docs.forEach(d => {
            const tx: any = d.data()
            if (tx.currency === "BRS" && (tx.type === "BRS_SEND" || tx.type === "send")) {
              brsSent += Math.abs(Number(tx.amount || 0))
            }
          })
        } catch (e) { console.log("BRS sent:", e) }

        // Total Earned = what you have + what you withdrew + what you sent
        setTotalBrsEarned(currentBrs + brsWithdrawn + brsSent)
        setTotalUsdtEarned(currentUsdt + usdtWithdrawn)
      } catch (err) {
        console.log("Total earned calc:", err)
      }
    }
    calcTotalEarned()
  }, [])

  // LOAD AIRDROPS
  useEffect(() => {
    const loadAirdrops = async () => {
      const email = getUser()
      if (!email) return
      try {
        // Get user data to check claimed status
        const userSnap = await getDoc(doc(db, "users", email))
        const userData = userSnap.exists() ? userSnap.data() : null

        if (userSnap.exists()) {
          setClaimedAirdrops(userData?.claimedAirdrops || {})
        }

        const airdropSnap = await getDocs(collection(db, "airdrops"))
        const now = new Date()
        const active = airdropSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(a => {
            if (a.status !== 'active') return false
            const exp = a.expiresAt?.toDate ? a.expiresAt.toDate() : (a.expiresAt ? new Date(a.expiresAt) : null)
            if (exp && exp < now) return false
            // Show ALL airdrops to everyone (companyDirect ones visible but claim locked)
            return true
          })
        setActiveAirdrops(active)
      } catch (err) {
        console.log("Airdrops load:", err)
      }
    }
    loadAirdrops()
  }, [])

  // LOAD BOT EARNINGS
  useEffect(() => {
    const loadBotEarnings = async () => {
      const email = getUser()
      if (!email) return
      try {
        // Check if bot earn is enabled
        const configSnap = await getDoc(doc(db, "botConfig", "settings"))
        if (configSnap.exists()) {
          setBotEarnEnabled(configSnap.data()?.botEarnEnabled || false)
        }

        // Find bot earnings linked to this email
        const earningsSnap = await getDocs(
          query(collection(db, "botEarnings"), where("linkedEmail", "==", email), limit(1))
        )
        if (!earningsSnap.empty) {
          setBotEarnData(earningsSnap.docs[0].data())
        }
      } catch (err) {
        console.log("Bot earnings load:", err)
      }
    }
    loadBotEarnings()
  }, [])

  useEffect(() => {

    const loadUser = async () => {

      const email = getUser()
      if (!email) return navigate("/", true)

      const ref = doc(db, "users", email)
      const snap = await getDoc(ref)

      if (snap.exists()) {

        const data: any = snap.data()

        // ✅ STATUS
        setStatus(data.status || "pending")

        // 🔄 SELF-HEALING: If deposit exists but user not active, auto-complete activation (runs once)
        if (data.status !== "active" && !healAttemptedRef.current) {
          healAttemptedRef.current = true
          try {
            const depositsSnap = await getDocs(collection(db, "deposits"))
            const myDeposit = depositsSnap.docs.find((d: any) => {
              const dd = d.data()
              return dd.userId === email && (dd.status === "verified" || dd.status === "approved") && dd.amount >= 12
            })

            if (myDeposit) {
              console.log("🔄 Self-healing: Deposit found but user not active. Auto-activating...")

              // 🔒 Use user document flag — 100% reliable duplicate check
              const alreadyRewarded = data.activationRewardPaid === true

              if (alreadyRewarded) {
                console.log("🔒 BRS already credited — only fixing status")
                await updateDoc(ref, { status: "active", activatedAt: data.activatedAt || new Date() })
              } else {
                await updateDoc(ref, {
                  status: "active",
                  brsBalance: increment(150),
                  activatedAt: new Date(),
                  activationRewardPaid: true
                })
                await logTransaction(email, 150, "BRS", "Membership activation reward (auto-recovered)")
              }
              await runFullActivation(email)
              setStatus("active")
              console.log("✅ Self-healing complete!")
            }
          } catch (err) {
            console.error("Self-healing error:", err)
          }
        }

        // ✅ USER NAME FROM PROFILE
        setUserName(data.fullName || "")

        // ✅ TRIP STATUS
        setTripAchieved(data.tripAchieved || false)
        setTripContactSubmitted(data.tripContactSubmitted || false)

        // 🏢 COMPANY DIRECT CHECK
        setIsCompanyDirect(data.isCompanyDirect || false)

        // ✅ BALANCES (SAFE)
        setUsdt(Number(data.usdtBalance || 0))
        setBrs(Number(data.brsBalance || 0))

        // ✅ REF LINK
        const myRefCode = data.referralCode || ''
        setRefCode(myRefCode)
        setReferralLink(
          window.location.origin + "/auth?ref=" + myRefCode
        )

        // ✅ DAYS CALCULATION + 30-DAY AUTO REWARD
        if (data.activatedAt) {
          const start = new Date(data.activatedAt.seconds * 1000)
          const now = new Date()

          const diff = Math.floor(
            (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          )

          setDays(diff > 30 ? 30 : diff)

          // 🔥 AUTO-CREDIT 150 BRS after 30 days
          if (diff >= 30 && !data.brs30DayRewardPaid) {

            const freshSnap = await getDoc(ref)
            const freshData: any = freshSnap.data()

            if (!freshData?.brs30DayRewardPaid) {
              const currentBrs = Number(freshData?.brsBalance || 0)
              const newBrs = currentBrs + 150

              await updateDoc(ref, {
                brsBalance: newBrs,
                brs30DayRewardPaid: true
              })

              await addDoc(collection(db, "transactions"), {
                userId: email,
                amount: 150,
                currency: "BRS",
                type: "BRS_RECEIVE",
                description: "30-day membership BRS reward",
                createdAt: new Date()
              })

              setBrs(newBrs)
              setRewardClaimed(true)
              console.log(`✅ 30-day reward 150 BRS credited to ${email}`)
            }
          }

          if (data.brs30DayRewardPaid) {
            setRewardClaimed(true)
          }
        }

      }

      setLoading(false)
    }

    loadUser()

    // 🔥 AUTO REFRESH EVERY 5 SECONDS (IMPORTANT)
    const interval = setInterval(loadUser, 5000)

    return () => clearInterval(interval)

  }, [])

  const [copied, setCopied] = useState(false)

  const shareMessage = `🚀 Join Bharos Exchange — The Most Trusted Crypto Platform!\n\n🪙 Get FREE 150 BRS Coins on signup\n💰 Earn USDT through referrals\n🔥 BRS Token live on BSC Mainnet (BEP-20)\n📈 Smart Contract verified on BNB Smart Chain\n🛡️ Secure, transparent & community-driven\n\n👉 Sign up now: ${referralLink}`

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank')
  }

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('🚀 Join Bharos Exchange — Get FREE 150 BRS Coins! 🔥 BRS Token live on BSC (BEP-20)')}`, '_blank')
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Bharos Exchange',
          text: '🚀 Get FREE 150 BRS Coins on signup! BRS Token live on BSC (BEP-20) 🔥 Join now:',
          url: referralLink
        })
      } catch (err) {
        copyReferral()
      }
    } else {
      copyReferral()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050816]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (

    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">

      {/* AMBIENT BACKGROUND */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-yellow-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-green-500/5 blur-[120px] rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/3 blur-[100px] rounded-full" />

      {/* NAVBAR */}
      <Navbar />
      <LoginPopup userStatus={status} />

      <div className="relative z-10 px-4 max-w-5xl mx-auto">

        {/* SCROLL NEWS */}
        <div className="glass-shield overflow-hidden mt-3 rounded-xl">
          <div className="whitespace-nowrap animate-marquee font-medium px-4 py-2.5 text-sm bg-gradient-to-r from-orange-400 via-yellow-400 to-red-400 bg-clip-text text-transparent relative z-10">
            🚀 Phase 2 Coming Soon  |  💰 Bigger Rewards  |  🔥 New Features  |  📱 Exchange App Soon
          </div>
        </div>

        <div className="mt-6">

          <h2 className="text-2xl font-bold mb-5">
            Welcome, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{userName || email?.split("@")[0]}</span>
          </h2>

          {/* 📢 ANNOUNCEMENTS */}
          <AnnouncementBanner />

          {/* 🏢 COMPANY DIRECT MEMBER BANNER */}
          {isCompanyDirect && (
            <div className="relative mb-5 group">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-amber-500/25 rounded-xl blur-sm" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl">👑</div>
                <div>
                  <p className="text-sm font-bold text-amber-400">Company Direct Member</p>
                  <p className="text-[10px] text-amber-400/50">Joined directly under Bharos Exchange</p>
                </div>
              </div>
            </div>
          )}

          {/* 🔐 ADMIN QUICK ACCESS */}
          {localStorage.getItem("bharos_admin") === "true" && (
            <button
              onClick={() => navigate("/admin")}
              className="w-full mb-5 relative group text-left"
            >
              <div className="absolute -inset-[1px] bg-gradient-to-r from-red-500/25 via-pink-500/15 to-purple-500/25 rounded-xl blur-sm group-hover:blur-md transition-all" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-red-500/20 rounded-xl px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg">🔐</div>
                  <div>
                    <p className="font-bold text-white text-sm">Admin Panel</p>
                    <p className="text-[10px] text-gray-500">Manage deposits, withdrawals, airdrops & more</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          )}

          {/* 🎁 AIRDROP OFFERS */}
          {activeAirdrops.filter(a => !claimedAirdrops[a.id]).length > 0 && (
            <div className="mb-6 space-y-3">
              {activeAirdrops.map(drop => {
                const isClaimed = claimedAirdrops[drop.id]
                const isClaiming = claimingId === drop.id
                const justClaimed = justClaimedId === drop.id
                const exp = drop.expiresAt?.toDate ? drop.expiresAt.toDate() : (drop.expiresAt ? new Date(drop.expiresAt) : null)
                const hoursLeft = exp ? Math.max(0, Math.round((exp.getTime() - Date.now()) / (1000 * 60 * 60))) : null

                if (isClaimed && !justClaimed) return null

                return (
                  <div key={drop.id} className={`relative group ${justClaimed ? 'scale-[1.02]' : ''} transition-all duration-500`}>
                    {/* Animated glow border */}
                    <div className={`absolute -inset-[1px] rounded-2xl blur-sm transition-all ${
                      justClaimed
                        ? 'bg-gradient-to-r from-green-500/40 to-emerald-500/40 animate-pulse'
                        : 'bg-gradient-to-r from-yellow-500/25 via-amber-500/20 to-orange-500/25 group-hover:blur-md'
                    }`} />

                    <div className={`relative bg-[#0d1117]/95 backdrop-blur-xl border rounded-2xl p-5 overflow-hidden ${
                      justClaimed ? 'border-green-500/30' : 'border-yellow-500/20'
                    }`}>

                      {/* Floating sparkles */}
                      <div className="absolute top-3 right-6 w-2 h-2 bg-yellow-400/20 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="absolute top-8 right-16 w-1.5 h-1.5 bg-amber-400/30 rounded-full animate-bounce" style={{ animationDelay: '0.7s' }} />
                      <div className="absolute bottom-4 right-10 w-1 h-1 bg-orange-400/40 rounded-full animate-bounce" style={{ animationDelay: '1.4s' }} />

                      <div className="flex items-center gap-4">
                        {/* Gift icon */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative ${
                          justClaimed
                            ? 'bg-green-500/15 border border-green-500/30'
                            : 'bg-gradient-to-br from-yellow-500/15 to-amber-500/10 border border-yellow-500/25'
                        }`}>
                          <div className={`absolute inset-0 rounded-2xl ${
                            justClaimed ? '' : 'bg-yellow-400/5 animate-pulse'
                          }`} />
                          {justClaimed ? (
                            <Check className="w-7 h-7 text-green-400 relative z-10" />
                          ) : (
                            <Gift className="w-7 h-7 text-yellow-400 relative z-10" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h3 className={`font-bold text-sm ${
                              justClaimed ? 'text-green-400' : 'text-white'
                            }`}>
                              {justClaimed ? '✅ Claimed!' : drop.title}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              justClaimed
                                ? 'bg-green-500/15 border border-green-500/25 text-green-400'
                                : 'bg-yellow-500/15 border border-yellow-500/25 text-yellow-400'
                            }`}>
                              {drop.amount} BRS
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1">{drop.description}</p>
                          {hoursLeft !== null && !justClaimed && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Clock className="w-3 h-3 text-orange-400" />
                              <span className="text-[10px] text-orange-400 font-medium">
                                {hoursLeft > 24 ? `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h left` : `${hoursLeft}h left`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Claim Button */}
                        <div className="shrink-0">
                          {justClaimed ? (
                            <div className="px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-bold">
                              +{drop.amount} BRS ✨
                            </div>
                          ) : drop.target === 'companyDirect' && !isCompanyDirect ? (
                            <div className="px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400/70 font-bold text-center">
                              👑 Direct Members
                              <br />
                              <span className="text-[9px] text-gray-500">Only</span>
                            </div>
                          ) : (
                            <button
                              disabled={isClaiming || status !== 'active'}
                              onClick={async () => {
                                if (!email || isClaiming) return
                                setClaimingId(drop.id)
                                try {
                                  await updateDoc(doc(db, "users", email), {
                                    brsBalance: increment(drop.amount),
                                    [`claimedAirdrops.${drop.id}`]: true
                                  })
                                  await updateDoc(doc(db, "airdrops", drop.id), {
                                    totalClaimed: increment(1)
                                  })
                                  await addDoc(collection(db, "transactions"), {
                                    userId: email,
                                    amount: drop.amount,
                                    currency: "BRS",
                                    type: "AIRDROP",
                                    description: `Airdrop Claimed: ${drop.title}`,
                                    createdAt: new Date()
                                  })
                                  setBrs(prev => prev + drop.amount)
                                  setClaimedAirdrops(prev => ({ ...prev, [drop.id]: true }))
                                  setJustClaimedId(drop.id)
                                  setTimeout(() => setJustClaimedId(null), 4000)
                                } catch (err) {
                                  console.error("Claim error:", err)
                                  alert("Failed to claim. Try again!")
                                }
                                setClaimingId(null)
                              }}
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black transition-all shadow-lg ${
                                status !== 'active'
                                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                  : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 hover:scale-105 active:scale-95 shadow-yellow-500/20'
                              } ${isClaiming ? 'opacity-60' : ''}`}
                            >
                              {isClaiming ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                  <span>Claiming...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Claim {drop.amount} BRS</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Just claimed celebration overlay */}
                      {justClaimed && (
                        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 🏅 USER BADGE */}
          <UserBadgeCard brsBalance={brs} />

          {/* 🤖 BOT EARNINGS CARD */}
          <div className="relative mb-6">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/20 rounded-2xl blur-sm" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-cyan-500/15 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-xl">🤖</div>
                  <div>
                    <p className="font-bold text-white text-sm">Telegram Bot Earnings</p>
                    <p className="text-[10px] text-gray-500">Daily check-in & invite friends to earn BRS</p>
                  </div>
                </div>
                {botEarnData ? (
                  <div className="text-right">
                    <p className="text-lg font-bold text-cyan-400">{botEarnData.totalEarned || 0}</p>
                    <p className="text-[10px] text-gray-500">BRS earned</p>
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                    <p className="text-[10px] font-bold text-cyan-400">NEW</p>
                  </div>
                )}
              </div>

              {botEarnData ? (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
                    <p className="text-lg font-bold text-orange-400">
                      {botEarnData.currentStreak || 0}{botEarnData.currentStreak >= 7 ? '🔥' : ''}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">Day Streak</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
                    <p className="text-lg font-bold text-green-400">{botEarnData.inviteCount || 0}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Invites</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
                    <p className="text-lg font-bold text-purple-400">{botEarnData.totalCheckins || 0}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Check-ins</p>
                  </div>
                </div>
              ) : null}

              {botEarnData ? (
                <div className="flex items-center gap-2 bg-green-500/5 border border-green-500/15 rounded-xl px-4 py-2.5">
                  <span className="text-green-400 text-sm">✅</span>
                  <p className="text-xs text-green-400 font-medium">Telegram linked — earning BRS daily!</p>
                </div>
              ) : (
                <a
                  href="https://t.me/BharosExchangeBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl px-4 py-3 hover:border-cyan-500/40 transition-all group"
                >
                  <Send className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                  <div>
                    <p className="text-sm font-bold text-white">Open Telegram Bot</p>
                    <p className="text-[10px] text-gray-400">Start earning BRS — link with /link {email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 ml-auto group-hover:text-cyan-400 transition-colors" />
                </a>
              )}
            </div>
          </div>

          {/* 🏆 TRIP ACHIEVED - CONTACT FORM */}
          {tripAchieved && !tripContactSubmitted && (
            <div className="relative mb-6">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-green-500/25 to-emerald-500/25 rounded-2xl blur-sm" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🎉✈️</div>
                  <h3 className="text-xl font-bold text-green-400">Congratulations! Trip Unlocked!</h3>
                  <p className="text-sm text-gray-400 mt-1">You are eligible for an International Trip! Fill your details below.</p>
                </div>

                {!showTripForm ? (
                  <button
                    onClick={() => setShowTripForm(true)}
                    className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:scale-[1.02] transition-all shadow-lg shadow-green-500/20 text-lg"
                  >
                    📝 Fill Your Details Now
                  </button>
                ) : (
                  <div className="space-y-3 mt-2">
                    <div>
                      <label className="text-xs text-gray-400">Full Name *</label>
                      <input
                        value={tripFullName}
                        onChange={(e) => setTripFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full p-3 rounded-xl bg-white/5 border border-green-500/20 text-white placeholder-gray-500 focus:border-green-400/50 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Email</label>
                      <input
                        value={email || ""}
                        disabled
                        className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/5 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Phone Number *</label>
                      <input
                        value={tripPhone}
                        onChange={(e) => setTripPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full p-3 rounded-xl bg-white/5 border border-green-500/20 text-white placeholder-gray-500 focus:border-green-400/50 outline-none transition-all"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!tripFullName.trim()) { alert("Please enter your full name"); return }
                        if (!tripPhone.trim()) { alert("Please enter your phone number"); return }
                        if (!email) return

                        setTripFormLoading(true)
                        try {
                          await addDoc(collection(db, "tripSubmissions"), {
                            email: email,
                            fullName: tripFullName.trim(),
                            phone: tripPhone.trim(),
                            submittedAt: new Date()
                          })
                          await updateDoc(doc(db, "users", email), {
                            tripContactSubmitted: true,
                            tripFullName: tripFullName.trim(),
                            tripPhone: tripPhone.trim()
                          })
                          setTripContactSubmitted(true)
                          alert("✅ Details submitted! Our team will contact you soon.")
                        } catch (err) {
                          console.error(err)
                          alert("Submit failed. Please try again.")
                        }
                        setTripFormLoading(false)
                      }}
                      disabled={tripFormLoading}
                      className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                    >
                      {tripFormLoading ? "Submitting..." : "✅ Submit Details"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ✅ TRIP SUBMITTED */}
          {tripAchieved && tripContactSubmitted && (
            <div className="bg-green-500/5 backdrop-blur-sm p-4 rounded-xl mb-6 border border-green-500/15">
              <p className="font-bold text-green-400 text-sm">✅ Trip Details Submitted!</p>
              <p className="text-xs text-gray-500 mt-1">Our team will contact you soon. Thank you!</p>
            </div>
          )}

          {/* STATUS CARD */}
          <div className="relative mb-6">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/15 to-blue-500/15 rounded-xl blur-sm" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Account Status</p>
                {status === "active" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-green-400 font-semibold">Active</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                    <p className="text-yellow-400 font-semibold">Not Activated</p>
                  </div>
                )}
              </div>

              {status !== "active" && (
                <button
                  onClick={() => {
                    navigate("/activate")
                    window.scrollTo(0, 0)
                  }}
                  className="px-5 py-2 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:scale-105 transition-all shadow-lg shadow-yellow-500/20"
                >
                  Activate Now (12 USDT)
                </button>
              )}
            </div>
          </div>

          {/* WALLET CARDS */}
          <div className="grid md:grid-cols-2 gap-5 mb-6">

            {/* BRS CARD */}
            <div className="relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-br from-yellow-500/25 to-amber-500/15 rounded-2xl blur-sm group-hover:blur-md transition-all" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-yellow-500/15 rounded-2xl p-6">

                <div className="flex justify-between items-start mb-5">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">BRS Coin</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">{brs} <span className="text-base md:text-lg text-yellow-400">BRS</span></h3>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-2 bg-yellow-400/15 rounded-full blur-md" />
                    <img src={brsLogo} className="relative w-10 h-10" />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Total Earned</p>
                  <p className="text-xs text-yellow-400 font-semibold">{totalBrsEarned} BRS</p>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Token Price</p>
                  <p className="text-xs text-yellow-400 font-medium">$0.005</p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-gray-500">Value</p>
                  <p className="text-xs text-green-400 font-semibold">${(brs * 0.005).toFixed(2)}</p>
                </div>

                <div className="glass-shield flex items-center gap-2 rounded-lg px-3 py-2.5 mb-5">
                  <img src={trustLogo} className="w-4 h-4 relative z-10" />
                  <span className="text-[10px] text-cyan-300/70 relative z-10">Phase 3: Transfer to Trust Wallet</span>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled
                    className="flex-1 py-2.5 rounded-xl font-medium text-xs md:text-sm text-gray-500 border border-white/10 bg-white/[0.03] cursor-not-allowed opacity-50 whitespace-nowrap"
                  >
                    🔒 Withdraw (Phase 3)
                  </button>
                  <button
                    onClick={() => navigate("/transfer")}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-xs md:text-sm text-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-yellow-500/20 whitespace-nowrap"
                  >
                    Send BRS
                  </button>
                </div>

              </div>
            </div>

            {/* USDT CARD */}
            <div className="relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-br from-green-500/25 to-emerald-500/15 rounded-2xl blur-sm group-hover:blur-md transition-all" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-green-500/15 rounded-2xl p-6">

                <div className="flex justify-between items-start mb-5">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">USDT (BEP-20)</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">${usdt.toFixed(2)}</h3>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-2 bg-green-400/15 rounded-full blur-md" />
                    <img src={usdtLogo} className="relative w-10 h-10" />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Total Earned</p>
                  <p className="text-xs text-green-400 font-semibold">${totalUsdtEarned.toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Network</p>
                  <p className="text-xs text-green-400 font-medium">BEP-20 (BSC)</p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-xs text-green-400 font-medium">Active</p>
                  </div>
                </div>

                <div className="glass-shield flex items-center gap-2 rounded-lg px-3 py-2.5 mb-5">
                  <img src={usdtLogo} className="w-4 h-4 relative z-10" />
                  <span className="text-[10px] text-cyan-300/70 relative z-10">Phase 3: Deposits Live Soon</span>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2.5 rounded-xl font-medium text-xs md:text-sm text-gray-400 border border-white/10 bg-white/[0.03] hover:bg-white/8 hover:text-white transition-all whitespace-nowrap"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => navigate("/withdraw")}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-xs md:text-sm text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-green-500/20 whitespace-nowrap"
                  >
                    Withdraw
                  </button>
                </div>

              </div>
            </div>

          </div>

          <div className="glass-shield rounded-xl mb-5 p-5">
              <div className="flex justify-between items-center mb-2 relative z-10">
                <p className="text-sm text-gray-300">{rewardClaimed ? "🎉 Reward Claimed" : "Upcoming Reward"}</p>
                <p className="text-xs text-cyan-300/70">
                  {rewardClaimed ? "✅ +150 BRS Credited!" : `${days}/30 days`}
                </p>
              </div>
              <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/8 relative z-10">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${rewardClaimed
                    ? "bg-gradient-to-r from-green-400 to-emerald-400"
                    : "bg-gradient-to-r from-cyan-400 to-blue-400"
                  }`}
                  style={{ width: `${(days / 30) * 100}%` }}
                />
              </div>
              {!rewardClaimed && (
                <p className="text-[10px] text-gray-500 mt-1.5 relative z-10">Complete 30 days for +150 BRS bonus</p>
              )}
          </div>

          {/* BRS PRICE CHART */}
          <BRSPriceCard />

          {/* 🎁 SOCIAL EARN CARD */}
          <button onClick={() => navigate("/social-earn")} className="w-full relative mb-6 group text-left">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500/30 via-purple-500/20 to-cyan-500/30 rounded-2xl blur-sm group-hover:blur-md transition-all animate-pulse" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-yellow-500/15 rounded-2xl p-5 overflow-hidden">
                {/* Floating sparkle */}
                <div className="absolute top-3 right-4 text-yellow-400/30 animate-bounce">✨</div>
                <div className="absolute bottom-3 right-12 text-cyan-400/20 animate-bounce" style={{ animationDelay: '1s' }}>⭐</div>

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/20 flex items-center justify-center text-2xl">
                    🎁
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-white text-sm">Social Media Earn</h3>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[9px] text-yellow-400 font-bold tracking-wider uppercase animate-pulse">
                        NEW
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Follow us & earn <span className="text-yellow-400 font-semibold">50 BRS</span> coins!</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </button>

          {/* 🎰 DAILY REWARDS CARD */}
          <button onClick={() => navigate("/daily-rewards")} className="w-full relative mb-6 group text-left">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-orange-500/25 via-red-500/15 to-purple-500/25 rounded-2xl blur-sm group-hover:blur-md transition-all" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-orange-500/15 rounded-2xl p-5 overflow-hidden">
                <div className="absolute top-2 right-3 text-orange-400/20 animate-bounce text-lg">🎰</div>
                <div className="absolute bottom-2 right-10 text-purple-400/15 animate-bounce text-sm" style={{ animationDelay: '1s' }}>🎁</div>

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20 flex items-center justify-center text-2xl">
                    🎰
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-white text-sm">Daily Rewards</h3>
                      <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 font-bold tracking-wider uppercase">
                        HOT
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Check in + Spin the Wheel — earn up to <span className="text-orange-400 font-semibold">75 BRS/day!</span></p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </button>

          <div className="relative mb-6">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl blur-sm" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-yellow-400 font-medium">Your Referral Link</p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-green-400 font-medium">Active</span>
                </div>
              </div>

              {/* Referral Link Input */}
              <div className="flex gap-2 mb-4">
                <input
                  value={referralLink}
                  readOnly
                  className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 text-white text-xs rounded-xl font-mono truncate"
                />
                <button
                  onClick={copyReferral}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    copied 
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                      : 'text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-105 shadow-lg shadow-cyan-500/20'
                  }`}
                >
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>

              {/* Share Buttons */}
              <p className="text-[10px] text-gray-500 mb-2.5 uppercase tracking-wider font-semibold">Share & Invite Friends</p>
              <div className="grid grid-cols-3 gap-2">
                {/* WhatsApp */}
                <button
                  onClick={shareWhatsApp}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 transition-all group"
                >
                  <MessageCircle className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-green-400 font-medium">WhatsApp</span>
                </button>

                {/* Telegram */}
                <button
                  onClick={shareTelegram}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all group"
                >
                  <Send className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-blue-400 font-medium">Telegram</span>
                </button>

                {/* Share */}
                <button
                  onClick={shareNative}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all group"
                >
                  <Share2 className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-purple-400 font-medium">Share</span>
                </button>
              </div>

            </div>
          </div>

          {/* 🎴 PREMIUM QR REFERRAL CARD */}
          <div className="relative mb-6">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/15 via-cyan-500/10 to-yellow-500/15 rounded-xl blur-sm" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-purple-400 font-semibold flex items-center gap-1.5">🎴 Referral Card</p>
                <span className="text-[10px] text-gray-500">Share & Grow</span>
              </div>

              {/* Card Preview */}
              <div
                id="referral-card-preview"
                className="relative rounded-2xl overflow-hidden mb-4"
                style={{
                  background: 'linear-gradient(135deg, #0d0d2b 0%, #1a0a3e 30%, #0d1f3c 60%, #0a1628 100%)',
                  padding: '24px',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                }}
              >
                {/* Decorative circles */}
                <div className="absolute top-[-20px] right-[-20px] w-40 h-40 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute bottom-[-30px] left-[-20px] w-48 h-48 rounded-full bg-cyan-500/8 blur-3xl" />

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-black text-white tracking-wide">BHAROS</h3>
                      <p className="text-[9px] text-cyan-400/60 uppercase tracking-[3px]">Exchange</p>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/25">
                      <span className="text-[9px] text-green-400 font-bold">● ACTIVE</span>
                    </div>
                  </div>

                  {/* User info + QR */}
                  <div className="flex items-center gap-4">
                    {/* QR Code */}
                    <div className="bg-white p-2.5 rounded-xl shadow-lg shadow-purple-500/10" id="qr-card-container">
                      <QRCodeSVG
                        value={referralLink}
                        size={88}
                        bgColor="#ffffff"
                        fgColor="#0d0d2b"
                        level="H"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-500 mb-0.5">MEMBER</p>
                      <p className="text-white font-bold text-base mb-2">{email?.split("@")[0]}</p>

                      <p className="text-[10px] text-gray-500 mb-0.5">REFERRAL CODE</p>
                      <div className="flex items-center gap-2">
                        <code className="text-cyan-400 font-mono font-bold text-sm tracking-wider">{refCode}</code>
                      </div>

                      <div className="mt-2 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        <p className="text-[9px] text-gray-400">Scan QR or use code to join</p>
                      </div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[9px] text-gray-600">bharosexchange.com</p>
                    <p className="text-[9px] text-gray-600">Trustworthy Crypto for Everyone</p>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={() => {
                  const qrContainer = document.getElementById('qr-card-container')
                  const svgEl = qrContainer?.querySelector('svg')
                  if (!svgEl) return

                  const svgData = new XMLSerializer().serializeToString(svgEl)
                  const qrImg = new Image()

                  // Load BRS coin logo
                  const coinImg = new Image()
                  coinImg.crossOrigin = 'anonymous'

                  let loaded = 0
                  const onBothLoaded = () => {
                    loaded++
                    if (loaded < 2) return

                    // ═══ PORTRAIT 9:16 HD CARD ═══
                    const W = 1080
                    const H = 1920
                    const canvas = document.createElement('canvas')
                    canvas.width = W
                    canvas.height = H
                    const ctx = canvas.getContext('2d')!
                    const cx = W / 2

                    // ═══ BACKGROUND — Deep space gradient ═══
                    const bg = ctx.createLinearGradient(0, 0, 0, H)
                    bg.addColorStop(0, '#020515')
                    bg.addColorStop(0.12, '#0a0825')
                    bg.addColorStop(0.35, '#081428')
                    bg.addColorStop(0.55, '#0c0a30')
                    bg.addColorStop(0.8, '#06101e')
                    bg.addColorStop(1, '#020515')
                    ctx.fillStyle = bg
                    ctx.fillRect(0, 0, W, H)

                    // Ambient glows
                    const glow = (x: number, y: number, r: number, c: string) => {
                      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
                      g.addColorStop(0, c)
                      g.addColorStop(1, 'transparent')
                      ctx.fillStyle = g
                      ctx.fillRect(0, 0, W, H)
                    }
                    glow(cx, 180, 500, 'rgba(139, 92, 246, 0.06)')
                    glow(150, 650, 400, 'rgba(6, 182, 212, 0.04)')
                    glow(W - 150, 1300, 450, 'rgba(250, 204, 21, 0.035)')
                    glow(cx, H - 200, 350, 'rgba(236, 72, 153, 0.03)')
                    glow(cx, 500, 600, 'rgba(99, 102, 241, 0.03)')

                    // Subtle dot grid
                    ctx.fillStyle = 'rgba(255,255,255,0.015)'
                    for (let dotX = 25; dotX < W; dotX += 35) {
                      for (let dotY = 25; dotY < H; dotY += 35) {
                        ctx.beginPath()
                        ctx.arc(dotX, dotY, 0.8, 0, Math.PI * 2)
                        ctx.fill()
                      }
                    }

                    // ═══ TOP: BHAROS EXCHANGE BRANDING ═══
                    // BRS Coin Logo 
                    try { ctx.drawImage(coinImg, cx - 32, 50, 64, 64) } catch {}

                    ctx.textAlign = 'center'

                    // "BHAROS" — bold white
                    ctx.fillStyle = '#ffffff'
                    ctx.font = '900 72px system-ui'
                    ctx.shadowColor = 'rgba(139, 92, 246, 0.3)'
                    ctx.shadowBlur = 15
                    ctx.fillText('BHAROS', cx, 175)
                    ctx.shadowBlur = 0

                    // "EXCHANGE" — bold gold gradient simulated
                    ctx.fillStyle = '#fbbf24'
                    ctx.font = '800 30px system-ui'
                    ctx.fillText('E X C H A N G E', cx, 215)

                    // Decorative gradient line
                    const lineGrad = ctx.createLinearGradient(cx - 250, 0, cx + 250, 0)
                    lineGrad.addColorStop(0, 'transparent')
                    lineGrad.addColorStop(0.2, 'rgba(251, 191, 36, 0.4)')
                    lineGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.6)')
                    lineGrad.addColorStop(0.8, 'rgba(34, 211, 238, 0.4)')
                    lineGrad.addColorStop(1, 'transparent')
                    ctx.strokeStyle = lineGrad
                    ctx.lineWidth = 2.5
                    ctx.beginPath()
                    ctx.moveTo(cx - 250, 238)
                    ctx.lineTo(cx + 250, 238)
                    ctx.stroke()

                    // Tagline
                    ctx.fillStyle = 'rgba(255,255,255,0.35)'
                    ctx.font = '500 17px system-ui'
                    ctx.fillText('The Future of Crypto Trading & Earning', cx, 268)

                    // ═══ QR CODE — MASSIVE CENTER ═══
                    const qrSize = 380
                    const qrX = cx - qrSize / 2
                    const qrY = 310

                    // Outer glow
                    ctx.shadowColor = 'rgba(139, 92, 246, 0.5)'
                    ctx.shadowBlur = 50
                    ctx.fillStyle = '#ffffff'
                    ctx.beginPath()
                    ctx.roundRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 28)
                    ctx.fill()
                    ctx.shadowBlur = 0

                    // Multi-color border
                    const borderGrad = ctx.createLinearGradient(qrX, qrY, qrX + qrSize, qrY + qrSize)
                    borderGrad.addColorStop(0, '#8b5cf6')
                    borderGrad.addColorStop(0.33, '#06b6d4')
                    borderGrad.addColorStop(0.66, '#fbbf24')
                    borderGrad.addColorStop(1, '#ec4899')
                    ctx.strokeStyle = borderGrad
                    ctx.lineWidth = 4
                    ctx.stroke()

                    // QR Image
                    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

                    // ═══ SCAN LABEL ═══
                    const scanY = qrY + qrSize + 55
                    ctx.fillStyle = 'rgba(255,255,255,0.3)'
                    ctx.font = '600 14px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('▲  SCAN QR CODE TO JOIN  ▲', cx, scanY)

                    // ═══ MEMBER INFO — GRADIENT NAME ═══
                    const memberY = scanY + 45
                    ctx.fillStyle = 'rgba(255,255,255,0.35)'
                    ctx.font = '700 15px system-ui'
                    ctx.fillText('M E M B E R', cx, memberY)

                    // Member Name — Gradient text effect
                    const memberName = (email?.split("@")[0] || 'User').toUpperCase()
                    const nameGrad = ctx.createLinearGradient(cx - 200, memberY, cx + 200, memberY + 50)
                    nameGrad.addColorStop(0, '#ffffff')
                    nameGrad.addColorStop(0.4, '#e0e7ff')
                    nameGrad.addColorStop(0.7, '#c7d2fe')
                    nameGrad.addColorStop(1, '#a5b4fc')
                    ctx.fillStyle = nameGrad
                    ctx.font = '900 52px system-ui'
                    ctx.shadowColor = 'rgba(165, 180, 252, 0.2)'
                    ctx.shadowBlur = 12
                    ctx.fillText(memberName, cx, memberY + 52)
                    ctx.shadowBlur = 0

                    // Gold decorative dots
                    ctx.fillStyle = '#fbbf24'
                    ;[-40, -15, 0, 15, 40].forEach(offset => {
                      ctx.beginPath()
                      ctx.arc(cx + offset, memberY + 78, offset === 0 ? 5 : 3.5, 0, Math.PI * 2)
                      ctx.fill()
                    })

                    // Ref code label
                    ctx.fillStyle = 'rgba(255,255,255,0.35)'
                    ctx.font = '700 15px system-ui'
                    ctx.fillText('R E F E R R A L   C O D E', cx, memberY + 108)

                    // REF CODE — Golden gradient with glow
                    const refGrad = ctx.createLinearGradient(cx - 180, 0, cx + 180, 0)
                    refGrad.addColorStop(0, '#f59e0b')
                    refGrad.addColorStop(0.3, '#fbbf24')
                    refGrad.addColorStop(0.5, '#fde68a')
                    refGrad.addColorStop(0.7, '#fbbf24')
                    refGrad.addColorStop(1, '#f59e0b')
                    ctx.fillStyle = refGrad
                    ctx.font = '900 60px monospace'
                    ctx.shadowColor = 'rgba(251, 191, 36, 0.4)'
                    ctx.shadowBlur = 25
                    ctx.fillText(refCode, cx, memberY + 170)
                    ctx.shadowBlur = 0

                    // ═══ BENEFITS SECTION ═══
                    const benefitsY = memberY + 220

                    // Section divider
                    const divGrad = ctx.createLinearGradient(80, 0, W - 80, 0)
                    divGrad.addColorStop(0, 'transparent')
                    divGrad.addColorStop(0.15, 'rgba(251, 191, 36, 0.3)')
                    divGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.5)')
                    divGrad.addColorStop(0.85, 'rgba(34, 211, 238, 0.3)')
                    divGrad.addColorStop(1, 'transparent')
                    ctx.strokeStyle = divGrad
                    ctx.lineWidth = 1.5
                    ctx.beginPath()
                    ctx.moveTo(80, benefitsY - 15)
                    ctx.lineTo(W - 80, benefitsY - 15)
                    ctx.stroke()

                    ctx.fillStyle = '#fbbf24'
                    ctx.font = '800 15px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('★  W H Y   J O I N   B H A R O S ?  ★', cx, benefitsY + 8)

                    const benefits = [
                      { icon: '🪙', title: '150 BRS Welcome Bonus', desc: 'Free BRS coins on signup' },
                      { icon: '📈', title: 'Staking Rewards', desc: 'Earn daily passive income on your BRS' },
                      { icon: '👥', title: '12-Level Referral Income', desc: 'Earn commissions from 12 levels deep' },
                      { icon: '🎰', title: 'Daily Spin & Rewards', desc: 'Win BRS coins every single day' },
                      { icon: '🌍', title: 'International Trip Rewards', desc: 'Build your team & win free trips abroad' },
                      { icon: '💹', title: 'Bharos Futures Trading', desc: 'Trade crypto futures with low fees' },
                      { icon: '🏆', title: 'Leaderboard & Badges', desc: 'Compete for top spots & earn badges' },
                      { icon: '🔒', title: 'Bank-Grade Security', desc: 'Your assets are fully protected 24/7' },
                    ]

                    // Clean single-column centered list
                    const listX = 160
                    benefits.forEach((b, i) => {
                      const y = benefitsY + 38 + i * 44

                      // Emoji icon
                      ctx.font = '20px system-ui'
                      ctx.textAlign = 'left'
                      ctx.fillText(b.icon, listX, y + 6)

                      // Title — bold white
                      ctx.fillStyle = '#ffffff'
                      ctx.font = '700 17px system-ui'
                      ctx.fillText(b.title, listX + 34, y)

                      // Description — subtle
                      ctx.fillStyle = 'rgba(255,255,255,0.35)'
                      ctx.font = '400 13px system-ui'
                      ctx.fillText(b.desc, listX + 34, y + 19)
                    })

                    // ═══ CTA BUTTON — right below benefits ═══
                    const lastItemY = benefitsY + 38 + 7 * 44
                    const ctaY = lastItemY + 50
                    const ctaW2 = 650
                    const ctaH2 = 68
                    const ctaX2 = cx - ctaW2 / 2

                    const btnGrad = ctx.createLinearGradient(ctaX2, ctaY, ctaX2 + ctaW2, ctaY)
                    btnGrad.addColorStop(0, '#7c3aed')
                    btnGrad.addColorStop(0.3, '#8b5cf6')
                    btnGrad.addColorStop(0.5, '#06b6d4')
                    btnGrad.addColorStop(0.7, '#fbbf24')
                    btnGrad.addColorStop(1, '#f59e0b')
                    ctx.fillStyle = btnGrad
                    ctx.shadowColor = 'rgba(139, 92, 246, 0.5)'
                    ctx.shadowBlur = 25
                    ctx.beginPath()
                    ctx.roundRect(ctaX2, ctaY, ctaW2, ctaH2, 20)
                    ctx.fill()
                    ctx.shadowBlur = 0

                    ctx.fillStyle = '#ffffff'
                    ctx.font = '900 22px system-ui'
                    ctx.textAlign = 'center'
                    ctx.fillText('🚀  Join Now & Start Earning!', cx, ctaY + 43)

                    // ═══ COMING SOON — App Stores ═══
                    const storeY = ctaY + ctaH2 + 40

                    ctx.fillStyle = 'rgba(255,255,255,0.3)'
                    ctx.font = '600 13px system-ui'
                    ctx.fillText('C O M I N G   S O O N', cx, storeY)

                    const badgeW = 170
                    const badgeH = 48
                    const gap = 16
                    const playX = cx - badgeW - gap / 2
                    const appX = cx + gap / 2
                    const badgeY2 = storeY + 15

                    // Play Store
                    ctx.fillStyle = 'rgba(255,255,255,0.06)'
                    ctx.beginPath()
                    ctx.roundRect(playX, badgeY2, badgeW, badgeH, 10)
                    ctx.fill()
                    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
                    ctx.lineWidth = 1
                    ctx.stroke()
                    ctx.fillStyle = 'rgba(255,255,255,0.45)'
                    ctx.font = '400 9px system-ui'
                    ctx.fillText('GET IT ON', playX + badgeW / 2, badgeY2 + 16)
                    ctx.fillStyle = '#ffffff'
                    ctx.font = '700 15px system-ui'
                    ctx.fillText('▶ Google Play', playX + badgeW / 2, badgeY2 + 35)

                    // App Store
                    ctx.fillStyle = 'rgba(255,255,255,0.06)'
                    ctx.beginPath()
                    ctx.roundRect(appX, badgeY2, badgeW, badgeH, 10)
                    ctx.fill()
                    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
                    ctx.lineWidth = 1
                    ctx.stroke()
                    ctx.fillStyle = 'rgba(255,255,255,0.45)'
                    ctx.font = '400 9px system-ui'
                    ctx.fillText('DOWNLOAD ON', appX + badgeW / 2, badgeY2 + 16)
                    ctx.fillStyle = '#ffffff'
                    ctx.font = '700 15px system-ui'
                    ctx.fillText(' App Store', appX + badgeW / 2, badgeY2 + 35)

                    // ═══ FOOTER — tight, no wasted space ═══
                    const footerY = badgeY2 + badgeH + 30
                    ctx.fillStyle = 'rgba(255,255,255,0.25)'
                    ctx.font = '500 13px system-ui'
                    ctx.fillText('bharosexchange.com  •  © 2026 Bharos Exchange', cx, footerY)
                    ctx.fillStyle = 'rgba(255,255,255,0.15)'
                    ctx.font = '400 11px system-ui'
                    ctx.fillText('Scan the QR code or use the referral code to register & earn', cx, footerY + 22)

                    // ═══ RESIZE CANVAS to actual content height ═══
                    const finalH = footerY + 45
                    const trimmed = document.createElement('canvas')
                    trimmed.width = W
                    trimmed.height = finalH
                    const tCtx = trimmed.getContext('2d')!
                    tCtx.drawImage(canvas, 0, 0)

                    // ═══ DOWNLOAD ═══
                    const a = document.createElement('a')
                    a.href = trimmed.toDataURL('image/png')
                    a.download = `bharos-referral-${refCode}.png`
                    a.click()
                  }

                  qrImg.onload = onBothLoaded
                  coinImg.onload = onBothLoaded
                  coinImg.onerror = onBothLoaded // fallback if coin logo fails

                  qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
                  coinImg.src = brsLogo
                }}
                className="w-full py-3 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-purple-400 via-cyan-400 to-yellow-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20"
              >
                📥 Download Referral Card
              </button>
            </div>
          </div>

          {/* ════════ SECTION 1: QUICK STATS ════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-br from-cyan-500/15 to-blue-500/10 rounded-xl blur-sm" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-left">
                <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20 mb-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-lg font-bold text-white">{teamSize}</p>
                <p className="text-[10px] text-gray-500">Team Size</p>
              </div>
            </div>

            <button onClick={() => navigate("/leaderboard")} className="relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-br from-yellow-500/15 to-amber-500/10 rounded-xl blur-sm group-hover:blur-md transition-all" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-left hover:border-yellow-500/30 transition-all">
                <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center border border-yellow-500/20 mb-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-lg font-bold text-white">#{rank || '-'}</p>
                <p className="text-[10px] text-gray-500">Your Rank</p>
                <ChevronRight className="w-3 h-3 text-gray-600 absolute top-4 right-3" />
              </div>
            </button>

            <button onClick={() => navigate("/transactions")} className="relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-br from-green-500/15 to-emerald-500/10 rounded-xl blur-sm group-hover:blur-md transition-all" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-left hover:border-green-500/30 transition-all">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20 mb-2">
                  <Activity className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-lg font-bold text-white">{recentTxns.length > 0 ? recentTxns.length + '+' : '0'}</p>
                <p className="text-[10px] text-gray-500">Transactions</p>
                <ChevronRight className="w-3 h-3 text-gray-600 absolute top-4 right-3" />
              </div>
            </button>

            <button onClick={() => navigate("/profile")} className="relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-br from-purple-500/15 to-pink-500/10 rounded-xl blur-sm group-hover:blur-md transition-all" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-left hover:border-purple-500/30 transition-all">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20 mb-2">
                  <User className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-lg font-bold text-white">{status === 'active' ? '✓' : '—'}</p>
                <p className="text-[10px] text-gray-500">Profile</p>
                <ChevronRight className="w-3 h-3 text-gray-600 absolute top-4 right-3" />
              </div>
            </button>
          </div>

          {/* ════════ SECTION 2: RECENT ACTIVITY ════════ */}
          <div className="relative mb-6">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-xl blur-sm" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  Recent Activity
                </p>
                <button onClick={() => navigate('/transactions')} className="text-[10px] text-cyan-400 hover:underline">View All →</button>
              </div>

              {recentTxns.length === 0 ? (
                <div className="text-center py-6">
                  <Coins className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentTxns.map((txn, i) => {
                    const isSend = txn.type?.includes('SEND') || txn.type?.includes('WITHDRAW')
                    const timeAgo = txn.createdAt?.toDate ? (() => {
                      const diff = Date.now() - txn.createdAt.toDate().getTime()
                      const mins = Math.floor(diff / 60000)
                      if (mins < 60) return `${mins}m ago`
                      const hrs = Math.floor(mins / 60)
                      if (hrs < 24) return `${hrs}h ago`
                      return `${Math.floor(hrs / 24)}d ago`
                    })() : ''

                    return (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                            isSend
                              ? 'bg-red-500/10 border-red-500/20'
                              : 'bg-green-500/10 border-green-500/20'
                          }`}>
                            {isSend
                              ? <ArrowUpRight className="w-4 h-4 text-red-400" />
                              : <ArrowDownLeft className="w-4 h-4 text-green-400" />
                            }
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white">
                              {txn.type?.replace(/_/g, ' ') || txn.description || 'Transaction'}
                            </p>
                            <p className="text-[10px] text-gray-500">{timeAgo}</p>
                          </div>
                        </div>
                        <p className={`text-sm font-semibold ${isSend ? 'text-red-400' : 'text-green-400'}`}>
                          {isSend ? '-' : '+'}{txn.amount} {txn.currency || 'USDT'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ════════ SECTION 3: LEADER PROGRAM JOURNEY ════════ */}
          <div className="glass-shield rounded-xl p-5 mb-8">
            <p className="text-sm font-medium text-gray-300 mb-5 flex items-center gap-2 relative z-10">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Bharos Leader Program
            </p>

            {/* MILESTONE TRACKER */}
            <div className="relative z-10">
              {/* LINE */}
              <div className="absolute top-4 left-4 right-4 h-[2px] bg-white/5 z-0" />
              <div className="absolute top-4 left-4 h-[2px] bg-gradient-to-r from-cyan-400 to-yellow-400 z-0 transition-all duration-1000"
                style={{ width: `${tripMilestone ? '100%' : matrixAchieved ? '66%' : directAchieved ? '33%' : directCount > 0 ? '10%' : '0%'}` }} />

              <div className="grid grid-cols-4 gap-2 relative z-10">
                {/* DIRECT */}
                <div className="text-center">
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center border-2 mb-2 transition-all ${
                    directAchieved
                      ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                      : 'bg-[#0d1117] border-white/20'
                  }`}>
                    <Target className={`w-3.5 h-3.5 ${directAchieved ? 'text-black' : 'text-gray-500'}`} />
                  </div>
                  <p className="text-[10px] font-medium text-gray-300">Direct</p>
                  <p className={`text-[10px] font-bold ${directAchieved ? 'text-cyan-400' : 'text-gray-500'}`}>{directCount}/10</p>
                  <p className="text-[8px] text-gray-600">+20 USDT</p>
                </div>

                {/* MATRIX */}
                <div className="text-center">
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center border-2 mb-2 transition-all ${
                    matrixAchieved
                      ? 'bg-yellow-400 border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                      : 'bg-[#0d1117] border-white/20'
                  }`}>
                    <Grid3X3 className={`w-3.5 h-3.5 ${matrixAchieved ? 'text-black' : 'text-gray-500'}`} />
                  </div>
                  <p className="text-[10px] font-medium text-gray-300">Matrix</p>
                  <p className={`text-[10px] font-bold ${matrixAchieved ? 'text-yellow-400' : 'text-gray-500'}`}>{matrixCount}/39</p>
                  <p className="text-[8px] text-gray-600">+30 USDT</p>
                </div>

                {/* TRIP */}
                <div className="text-center">
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center border-2 mb-2 transition-all ${
                    tripMilestone
                      ? 'bg-green-400 border-green-400 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                      : 'bg-[#0d1117] border-white/20'
                  }`}>
                    <Plane className={`w-3.5 h-3.5 ${tripMilestone ? 'text-black' : 'text-gray-500'}`} />
                  </div>
                  <p className="text-[10px] font-medium text-gray-300">Trip</p>
                  <p className={`text-[10px] font-bold ${tripMilestone ? 'text-green-400' : 'text-gray-500'}`}>{tripCount}/100</p>
                  <p className="text-[8px] text-gray-600">Int'l Trip</p>
                </div>

                {/* LEGEND */}
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto rounded-full flex items-center justify-center border-2 border-dashed border-white/10 bg-[#0d1117] mb-2">
                    <Trophy className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <p className="text-[10px] font-medium text-gray-400">Legend</p>
                  <p className="text-[10px] text-gray-600">Coming</p>
                  <p className="text-[8px] text-gray-600">Soon</p>
                </div>
              </div>
          </div>
          </div>

          {/* ⏳ RESUME PAYMENT VERIFICATION BANNER */}
          {status === "awaiting_verification" && (
            <div className="relative mb-6">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-red-500/30 rounded-xl blur-sm animate-pulse" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-amber-500/20 rounded-xl p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl shrink-0">
                    ⏳
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-400">Payment Verification Pending</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Your payment is being verified. Click below to check status.</p>
                  </div>
                  <button
                    onClick={() => { navigate("/activate"); window.scrollTo(0, 0) }}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:scale-105 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
                  >
                    Check Now
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}