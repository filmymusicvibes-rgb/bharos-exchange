import { useEffect, useState } from "react"
import { navigate } from "@/lib/router"
import { db } from "../lib/firebase"
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore"

import Navbar from "../components/Navbar" // ✅ ADDED
import LoginPopup from "../components/LoginPopup"

import brsLogo from "../assets/brs.png"
import usdtLogo from "../assets/usdt.png"
import trustLogo from "../assets/trustwallet.png"

export default function Dashboard() {

  const [loading, setLoading] = useState(true)
  const [referralLink, setReferralLink] = useState("")
  const [status, setStatus] = useState("")
  const [usdt, setUsdt] = useState(0)
  const [brs, setBrs] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [days, setDays] = useState(0)
  const [rewardClaimed, setRewardClaimed] = useState(false)
  const [tripAchieved, setTripAchieved] = useState(false)
  const [tripContactSubmitted, setTripContactSubmitted] = useState(false)
  const [tripFormLoading, setTripFormLoading] = useState(false)
  const [tripFullName, setTripFullName] = useState("")
  const [tripPhone, setTripPhone] = useState("")
  const [showTripForm, setShowTripForm] = useState(false)
  
  const email = localStorage.getItem("bharos_user")



  useEffect(() => {
    const checkAdmin = async () => {
      const email = localStorage.getItem("bharos_user")
      if (!email) return

      const snap = await getDoc(doc(db, "users", email))

      if (snap.exists()) {
        const data: any = snap.data()
        if (data.role === "admin") {
          setIsAdmin(true)
        }
      }
    }
    checkAdmin()
  }, [])

  useEffect(() => {

    const loadUser = async () => {

      const email = localStorage.getItem("bharos_user")
      if (!email) return navigate("/")

      const ref = doc(db, "users", email)
      const snap = await getDoc(ref)

      if (snap.exists()) {

        const data: any = snap.data()

        // ✅ STATUS
        setStatus(data.status || "pending")

        // ✅ TRIP STATUS
        setTripAchieved(data.tripAchieved || false)
        setTripContactSubmitted(data.tripContactSubmitted || false)

        // ✅ BALANCES (SAFE)
        setUsdt(Number(data.usdtBalance || 0))
        setBrs(Number(data.brsBalance || 0))

        // ✅ REF LINK
        setReferralLink(
          window.location.origin + "/auth?ref=" + data.referralCode
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

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink)
    alert("Copied")
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
        <div className="overflow-hidden mt-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <div className="whitespace-nowrap animate-marquee font-medium px-4 py-2.5 text-sm bg-gradient-to-r from-orange-400 via-yellow-400 to-red-400 bg-clip-text text-transparent">
            🚀 Phase 2 Coming Soon  |  💰 Bigger Rewards  |  🔥 New Features  |  📱 Exchange App Soon
          </div>
        </div>

        <div className="mt-6">

          <h2 className="text-2xl font-bold mb-5">
            Welcome, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{email?.split("@")[0]}</span>
          </h2>

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
                    <h3 className="text-3xl font-bold text-white">{brs} <span className="text-lg text-yellow-400">BRS</span></h3>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-2 bg-yellow-400/15 rounded-full blur-md" />
                    <img src={brsLogo} className="relative w-12 h-12" />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Token Price</p>
                  <p className="text-xs text-yellow-400 font-medium">$0.005</p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-gray-500">Value</p>
                  <p className="text-xs text-green-400 font-semibold">${(brs * 0.005).toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5 mb-5">
                  <img src={trustLogo} className="w-4 h-4" />
                  <span className="text-[10px] text-gray-500">Phase 3: Transfer to Trust Wallet</span>
                </div>

                <button
                  onClick={() => navigate("/transfer")}
                  className="w-full py-3 rounded-xl font-semibold text-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-yellow-500/20"
                >
                  Send BRS
                </button>

              </div>
            </div>

            {/* USDT CARD */}
            <div className="relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-br from-green-500/25 to-emerald-500/15 rounded-2xl blur-sm group-hover:blur-md transition-all" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-green-500/15 rounded-2xl p-6">

                <div className="flex justify-between items-start mb-5">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">USDT (BEP-20)</p>
                    <h3 className="text-3xl font-bold text-white">${usdt.toFixed(2)}</h3>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-2 bg-green-400/15 rounded-full blur-md" />
                    <img src={usdtLogo} className="relative w-12 h-12" />
                  </div>
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

                <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5 mb-5">
                  <img src={usdtLogo} className="w-4 h-4" />
                  <span className="text-[10px] text-gray-500">Phase 3: Deposits Live Soon</span>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 py-3 rounded-xl font-medium text-sm text-gray-400 border border-white/10 bg-white/[0.03] hover:bg-white/8 hover:text-white transition-all"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => navigate("/withdraw")}
                    className="flex-1 py-3 rounded-xl font-semibold text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-green-500/20"
                  >
                    Withdraw
                  </button>
                </div>

              </div>
            </div>

          </div>

          {/* PROGRESS */}
          <div className="relative mb-5">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur-sm" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-400">{rewardClaimed ? "🎉 Reward Claimed" : "Upcoming Reward"}</p>
                <p className="text-xs text-gray-500">
                  {rewardClaimed ? "✅ +150 BRS Credited!" : `${days}/30 days`}
                </p>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${rewardClaimed
                    ? "bg-gradient-to-r from-green-400 to-emerald-400"
                    : "bg-gradient-to-r from-cyan-400 to-blue-400"
                  }`}
                  style={{ width: `${(days / 30) * 100}%` }}
                />
              </div>
              {!rewardClaimed && (
                <p className="text-[10px] text-gray-600 mt-1.5">Complete 30 days for +150 BRS bonus</p>
              )}
            </div>
          </div>

          {/* REFERRAL */}
          <div className="relative mb-8">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl blur-sm" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <p className="text-xs text-yellow-400 font-medium mb-2.5">Referral Link</p>
              <div className="flex gap-2">
                <input
                  value={referralLink}
                  readOnly
                  className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 text-white text-xs rounded-xl font-mono"
                />
                <button
                  onClick={copyReferral}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-105 transition-all shadow-lg shadow-cyan-500/20"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}