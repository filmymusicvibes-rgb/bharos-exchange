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
      <div className="min-h-screen flex items-center justify-center bg-[#0B0919] text-cyan-400 animate-pulse">
        Loading...
      </div>
    )
  }

  return (

    <div className="min-h-screen bg-[#0B0919] text-white">

      {/* ✅ GLOBAL NAVBAR */}
      <Navbar />
      <LoginPopup userStatus={status} />

      <div className="px-4">

        {/* 🔥 SCROLL NEWS */}
        <div className="overflow-hidden mt-3 bg-gradient-to-r from-orange-500 via-yellow-400 to-red-500 text-black py-2 rounded">
          <div className="whitespace-nowrap animate-marquee font-semibold px-4">
            🚀 Phase 2 Coming Soon | 💰 Bigger Rewards | 🔥 New Features | 📱 Exchange App Soon
          </div>
        </div>

        <div className="mt-6">

          <h2 className="text-3xl font-bold mb-4">
            Welcome, <span className="text-cyan-400">{email?.split("@")[0]}</span>
          </h2>

          {/* 🏆 TRIP ACHIEVED - CONTACT FORM */}
          {tripAchieved && !tripContactSubmitted && (
            <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/10 p-6 rounded-2xl mt-4 mb-6 border border-green-500/40 shadow-[0_0_25px_rgba(34,197,94,0.15)]">
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">🎉✈️</div>
                <h3 className="text-xl font-bold text-green-400">Congratulations! Trip Unlocked!</h3>
                <p className="text-sm text-gray-300 mt-1">You are eligible for an International Trip! Fill your details below so we can contact you.</p>
              </div>

              {!showTripForm ? (
                <button
                  onClick={() => setShowTripForm(true)}
                  className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:scale-[1.02] transition-all shadow-lg shadow-green-500/30 text-lg"
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
                      className="w-full p-3 rounded-lg bg-[#0B0919] border border-green-500/30 text-white focus:border-green-400 focus:ring-2 focus:ring-green-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Email</label>
                    <input
                      value={email || ""}
                      disabled
                      className="w-full p-3 rounded-lg bg-[#0B0919]/60 border border-gray-500/20 text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Phone Number *</label>
                    <input
                      value={tripPhone}
                      onChange={(e) => setTripPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full p-3 rounded-lg bg-[#0B0919] border border-green-500/30 text-white focus:border-green-400 focus:ring-2 focus:ring-green-400 outline-none"
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
                    className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:scale-[1.02] transition-all shadow-lg shadow-green-500/30 disabled:opacity-50"
                  >
                    {tripFormLoading ? "Submitting..." : "✅ Submit Details"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ✅ TRIP DETAILS ALREADY SUBMITTED */}
          {tripAchieved && tripContactSubmitted && (
            <div className="bg-green-500/10 p-4 rounded-xl mt-4 mb-6 border border-green-500/30">
              <p className="font-bold text-green-400">✅ Trip Details Submitted!</p>
              <p className="text-sm text-gray-400 mt-1">Our team will contact you soon. Thank you!</p>
            </div>
          )}

          <div className="bg-[#1a1a2e] p-6 rounded-xl flex justify-between items-center">

            <div>
              <p className="text-gray-400">Account Status</p>

              {status === "active" ? (
                <p className="text-green-400">✅ Active</p>
              ) : (
                <p className="text-yellow-400">🟡 Not Activated</p>
              )}
            </div>

            {/* 👉 THIS IS IMPORTANT BUTTON */}

            {status !== "active" && (
              <button
                onClick={() => {
                  navigate("/activate")
                  window.scrollTo(0, 0)
                }}
                style={{
                  background: "linear-gradient(90deg, #f59e0b, #d97706)",
                  boxShadow: "0 0 15px rgba(245,158,11,0.5)"
                }}
                className="px-6 py-2 rounded-lg font-bold text-black hover:scale-105 transition"
              >
                Activate Now (12 USDT)
              </button>
            )}

          </div>

          {/* CARDS */}
          <div className="grid md:grid-cols-2 gap-6 mb-8 mt-8">

            {/* BRS */}
            <div
              className="p-7 rounded-2xl animate-glow"
              style={{
                border: "1.5px solid rgba(250, 204, 21, 0.6)",
                background: "linear-gradient(135deg, rgba(202,138,4,0.35) 0%, #0d0d1a 100%)",
                boxShadow: "0 0 40px rgba(255, 200, 0, 0.3)"
              }}
            >

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-yellow-300 text-lg font-bold">BRS Coin</h3>
                <img src={brsLogo} className="w-14 h-14 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]" />
              </div>

              <h1 className="text-4xl font-bold">{brs} BRS</h1>

              <p className="text-sm text-gray-400 mt-2">
                Token Price: <span className="text-yellow-400">$0.005</span>
              </p>

              <p className="text-green-400 mt-1 font-semibold">
                Value: ${(brs * 0.005).toFixed(2)}
              </p>

              <div className="flex items-center gap-3 mt-4">
                <img src={trustLogo} className="w-6" />
                <span className="text-xs text-blue-400">
                  Phase 3: Transfer to Trust Wallet
                </span>
              </div>

              <button
                onClick={() => navigate("/transfer")}
                style={{
                  background: "linear-gradient(90deg, #facc15, #ca8a04)",
                  boxShadow: "0 0 18px rgba(250,204,21,0.5)"
                }}
                className="mt-6 w-full py-3 rounded-full text-black font-semibold hover:scale-110 transition-all duration-300"
              >
                Send BRS
              </button>

            </div>

            {/* USDT */}
            <div
              className="p-7 rounded-2xl animate-glow"
              style={{
                border: "1.5px solid rgba(34, 197, 94, 0.6)",
                background: "linear-gradient(135deg, rgba(21,128,61,0.35) 0%, #0d0d1a 100%)",
                boxShadow: "0 0 40px rgba(34, 197, 94, 0.25)"
              }}
            >

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-green-300 text-lg font-bold">USDT (BEP-20)</h3>
                <img src={usdtLogo} className="w-14 h-14 drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
              </div>

              <h1 className="text-4xl font-bold">${usdt.toFixed(2)}</h1>

              <p className="text-sm text-gray-400 mt-2">
                Network: <span className="text-green-400">BEP-20 (BSC)</span>
              </p>

              <p className="text-green-400 mt-1 font-semibold">Status: Active</p>

              <div className="flex items-center gap-3 mt-4">
                <img src={usdtLogo} className="w-6 h-6" />
                <span className="text-xs text-blue-400">
                  Phase 3: Deposits Live Soon
                </span>
              </div>

              <div className="flex gap-3 mt-6">

                <button
                  style={{ border: "1.5px solid rgba(255,255,255,0.3)" }}
                  className="flex-1 py-3 rounded-full hover:bg-white/10 hover:scale-105 transition-all"
                >
                  Deposit
                </button>

                <button
                  onClick={() => navigate("/withdraw")}
                  style={{
                    background: "linear-gradient(90deg, #4ade80, #16a34a)",
                    boxShadow: "0 0 18px rgba(34,197,94,0.5)"
                  }}
                  className="flex-1 py-3 rounded-full text-black font-semibold hover:scale-110 transition-all duration-300"
                >
                  Withdraw
                </button>

              </div>

            </div>

          </div>

          {/* PROGRESS */}
          <div className="bg-[#1a1a2e] p-4 rounded-xl mb-6">
            <p>{rewardClaimed ? "🎉 Reward Claimed" : "Upcoming Reward"}</p>
            <div className="w-full bg-gray-700 h-2 rounded mt-2">
              <div
                className={`h-2 rounded transition-all ${rewardClaimed ? "bg-green-400" : "bg-cyan-400"}`}
                style={{ width: `${(days / 30) * 100}%` }}
              />
            </div>
            <p className="text-xs mt-2">
              {rewardClaimed
                ? "✅ +150 BRS Credited!"
                : `${days}/30 days → +150 BRS`
              }
            </p>
          </div>

          {/* REF */}
          <div className="bg-[#1a1a2e] p-4 rounded-xl">
            <p className="text-yellow-400">Referral Link</p>
            <div className="flex gap-2 mt-2">
              <input
                value={referralLink}
                readOnly
                className="flex-1 p-2 bg-black/30 text-white rounded"
              />
              <button
                onClick={copyReferral}
                className="bg-cyan-500 px-3 rounded text-black hover:scale-110 hover:shadow-[0_0_10px_cyan] transition-all"
              >
                Copy
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}