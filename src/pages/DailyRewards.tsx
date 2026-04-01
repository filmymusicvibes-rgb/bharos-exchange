import { useEffect, useState, useRef } from "react"
import { getUser } from "../lib/session"
import { navigate } from "@/lib/router"
import { db } from "../lib/firebase"
import { doc, getDoc, updateDoc, addDoc, collection, increment } from "firebase/firestore"
import { ArrowLeft, Calendar, Star, Flame, Gift, Trophy, Zap } from "lucide-react"
import Navbar from "../components/Navbar"

// ═══════════════════════════════════════════
// DAILY REWARDS CONFIG
// ═══════════════════════════════════════════
const DAILY_CHECKIN_REWARDS = [2, 3, 5, 7, 10, 15, 25] // Day 1-7
const SPIN_PRIZES = [
  { label: "1 BRS", value: 1, color: "#3b82f6", chance: 25 },
  { label: "3 BRS", value: 3, color: "#8b5cf6", chance: 20 },
  { label: "5 BRS", value: 5, color: "#06b6d4", chance: 18 },
  { label: "10 BRS", value: 10, color: "#f59e0b", chance: 15 },
  { label: "15 BRS", value: 15, color: "#10b981", chance: 10 },
  { label: "25 BRS", value: 25, color: "#ef4444", chance: 7 },
  { label: "50 BRS", value: 50, color: "#ec4899", chance: 3 },
  { label: "2 BRS", value: 2, color: "#6366f1", chance: 2 },
]

function getWeightedPrize(): number {
  const total = SPIN_PRIZES.reduce((sum, p) => sum + p.chance, 0)
  let rand = Math.random() * total
  for (let i = 0; i < SPIN_PRIZES.length; i++) {
    rand -= SPIN_PRIZES[i].chance
    if (rand <= 0) return i
  }
  return 0
}

export default function DailyRewards() {
  const email = getUser()
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [lastCheckin, setLastCheckin] = useState<string | null>(null)
  const [canCheckin, setCanCheckin] = useState(false)
  const [checkinDone, setCheckinDone] = useState(false)
  const [checkinReward, setCheckinReward] = useState(0)

  // Spin states
  const [canSpin, setCanSpin] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState<number | null>(null)
  const [spinAngle, setSpinAngle] = useState(0)
  const [showPrize, setShowPrize] = useState(false)
  const [totalEarnedToday, setTotalEarnedToday] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!email) return navigate("/", true)
    loadData()
  }, [])

  useEffect(() => {
    drawWheel()
  }, [spinAngle])

  const loadData = async () => {
    if (!email) return
    try {
      const snap = await getDoc(doc(db, "users", email))
      if (snap.exists()) {
        const data: any = snap.data()
        const today = new Date().toISOString().split("T")[0]
        const lastDate = data.lastCheckinDate || null
        const currentStreak = data.checkinStreak || 0
        const lastSpinDate = data.lastSpinDate || null

        setLastCheckin(lastDate)
        setStreak(currentStreak)

        // Can check in today?
        if (lastDate !== today) {
          setCanCheckin(true)
        } else {
          setCheckinDone(true)
          const dayReward = DAILY_CHECKIN_REWARDS[Math.min(currentStreak - 1, 6)]
          setCheckinReward(dayReward)
        }

        // Can spin today?
        if (lastSpinDate !== today) {
          setCanSpin(true)
        }
      }
    } catch (err) {
      console.error("Load error:", err)
    }
    setLoading(false)
  }

  const handleCheckin = async () => {
    if (!email || !canCheckin) return

    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

    // Calculate streak
    let newStreak = 1
    if (lastCheckin === yesterday) {
      newStreak = Math.min(streak + 1, 7)
    }

    const reward = DAILY_CHECKIN_REWARDS[Math.min(newStreak - 1, 6)]

    try {
      await updateDoc(doc(db, "users", email), {
        lastCheckinDate: today,
        checkinStreak: newStreak,
        brsBalance: increment(reward),
      })

      await addDoc(collection(db, "transactions"), {
        userId: email,
        amount: reward,
        currency: "BRS",
        type: "DAILY_CHECKIN",
        description: `Day ${newStreak} check-in reward`,
        createdAt: new Date(),
      })

      setStreak(newStreak)
      setCheckinReward(reward)
      setCheckinDone(true)
      setCanCheckin(false)
      setCanSpin(true) // Unlock spin after check-in
      setTotalEarnedToday(prev => prev + reward)
    } catch (err) {
      console.error("Checkin error:", err)
      alert("Check-in failed. Try again!")
    }
  }

  const drawWheel = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const size = canvas.width
    const center = size / 2
    const radius = center - 8
    const segments = SPIN_PRIZES.length
    const arc = (2 * Math.PI) / segments

    ctx.clearRect(0, 0, size, size)

    // Draw segments
    for (let i = 0; i < segments; i++) {
      const angle = i * arc + (spinAngle * Math.PI) / 180

      // Segment
      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, angle, angle + arc)
      ctx.closePath()

      // Gradient fill
      const grad = ctx.createRadialGradient(center, center, 0, center, center, radius)
      grad.addColorStop(0, SPIN_PRIZES[i].color + "40")
      grad.addColorStop(0.7, SPIN_PRIZES[i].color + "90")
      grad.addColorStop(1, SPIN_PRIZES[i].color)
      ctx.fillStyle = grad
      ctx.fill()

      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.15)"
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Text
      ctx.save()
      ctx.translate(center, center)
      ctx.rotate(angle + arc / 2)
      ctx.textAlign = "right"
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 13px system-ui"
      ctx.shadowColor = "rgba(0,0,0,0.5)"
      ctx.shadowBlur = 3
      ctx.fillText(SPIN_PRIZES[i].label, radius - 18, 5)
      ctx.restore()
    }

    // Center circle
    const centerGrad = ctx.createRadialGradient(center, center, 0, center, center, 30)
    centerGrad.addColorStop(0, "#1e293b")
    centerGrad.addColorStop(1, "#0f172a")
    ctx.beginPath()
    ctx.arc(center, center, 30, 0, 2 * Math.PI)
    ctx.fillStyle = centerGrad
    ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.2)"
    ctx.lineWidth = 2
    ctx.stroke()

    // Center text
    ctx.fillStyle = "#fbbf24"
    ctx.font = "bold 11px system-ui"
    ctx.textAlign = "center"
    ctx.fillText("SPIN", center, center - 2)
    ctx.fillText("& WIN", center, center + 11)
  }

  const handleSpin = () => {
    if (!canSpin || spinning) return

    setSpinning(true)
    setShowPrize(false)
    setSpinResult(null)

    const prizeIndex = getWeightedPrize()
    const segments = SPIN_PRIZES.length
    const segmentAngle = 360 / segments

    // Calculate target angle (spin at least 5 full rotations + land on prize)
    const targetAngle = 360 * 7 + (360 - prizeIndex * segmentAngle - segmentAngle / 2)

    let currentAngle = 0
    const duration = 4000 // 4 seconds
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing: decelerate
      const eased = 1 - Math.pow(1 - progress, 3)
      currentAngle = eased * targetAngle

      setSpinAngle(currentAngle % 360)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Done spinning
        setSpinResult(prizeIndex)
        setShowPrize(true)
        creditSpinReward(prizeIndex)
      }
    }

    requestAnimationFrame(animate)
  }

  const creditSpinReward = async (prizeIndex: number) => {
    if (!email) return
    const prize = SPIN_PRIZES[prizeIndex]
    const today = new Date().toISOString().split("T")[0]

    try {
      await updateDoc(doc(db, "users", email), {
        lastSpinDate: today,
        brsBalance: increment(prize.value),
      })

      await addDoc(collection(db, "transactions"), {
        userId: email,
        amount: prize.value,
        currency: "BRS",
        type: "SPIN_WIN",
        description: `Spin the Wheel — Won ${prize.value} BRS!`,
        createdAt: new Date(),
      })

      setCanSpin(false)
      setSpinning(false)
      setTotalEarnedToday(prev => prev + prize.value)
    } catch (err) {
      console.error("Spin credit error:", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050816]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading Daily Rewards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">
      {/* AMBIENT */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-yellow-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-500/5 blur-[120px] rounded-full" />
      <div className="absolute top-1/3 left-1/2 w-[300px] h-[300px] bg-cyan-500/3 blur-[100px] rounded-full" />

      <Navbar />

      <div className="relative z-10 px-4 max-w-3xl mx-auto pb-20">

        {/* BACK */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mt-4 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Dashboard</span>
        </button>

        {/* ═══════ HERO ═══════ */}
        <div className="relative mb-8">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500/30 via-orange-500/20 to-red-500/30 rounded-2xl blur-md" />
          <div className="relative bg-[#0d1117]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center overflow-hidden">
            <div className="absolute top-3 left-6 text-2xl animate-bounce" style={{ animationDelay: '0s' }}>🎰</div>
            <div className="absolute top-3 right-6 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎁</div>
            <div className="absolute bottom-3 left-10 text-lg animate-bounce" style={{ animationDelay: '1s' }}>✨</div>
            <div className="absolute bottom-3 right-10 text-lg animate-bounce" style={{ animationDelay: '1.5s' }}>⭐</div>

            <div className="relative z-10">
              <h1 className="text-3xl font-black mb-2">
                <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  Daily Rewards
                </span>
              </h1>
              <p className="text-gray-400 text-sm mb-4">Check in daily + Spin the Wheel to earn BRS!</p>

              {totalEarnedToday > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                  <Trophy className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-bold text-sm">Today's Earnings: +{totalEarnedToday} BRS</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ DAILY CHECK-IN ═══════ */}
        <div className="relative mb-8">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/15 to-blue-500/15 rounded-2xl blur-sm" />
          <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6">

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-lg text-white">Daily Check-in</h2>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs text-orange-400 font-bold">{streak} Day Streak</span>
              </div>
            </div>

            {/* 7-Day Grid */}
            <div className="grid grid-cols-7 gap-2 mb-5">
              {DAILY_CHECKIN_REWARDS.map((reward, i) => {
                const dayNum = i + 1
                const isCompleted = i < streak
                const isToday = i === streak && !canCheckin
                const isNext = i === streak && canCheckin
                const isFuture = i > streak

                return (
                  <div
                    key={i}
                    className={`relative rounded-xl p-2 text-center transition-all ${
                      isCompleted
                        ? "bg-gradient-to-b from-green-500/20 to-green-500/5 border border-green-500/30"
                        : isToday
                        ? "bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30"
                        : isNext
                        ? "bg-gradient-to-b from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 animate-pulse"
                        : "bg-white/[0.03] border border-white/5"
                    }`}
                  >
                    <p className={`text-[9px] font-bold mb-1 ${
                      isCompleted ? "text-green-400" : isToday ? "text-cyan-400" : isNext ? "text-yellow-400" : "text-gray-600"
                    }`}>
                      Day {dayNum}
                    </p>
                    <div className={`text-lg mb-0.5 ${isFuture ? "opacity-30" : ""}`}>
                      {isCompleted ? "✅" : dayNum === 7 ? "🎁" : "🪙"}
                    </div>
                    <p className={`text-[10px] font-bold ${
                      isCompleted ? "text-green-400" : isNext ? "text-yellow-400" : "text-gray-500"
                    }`}>
                      +{reward}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Check-in Button */}
            {canCheckin ? (
              <button
                onClick={handleCheckin}
                className="w-full py-3.5 rounded-xl font-bold text-black bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-yellow-500/20 text-base"
              >
                ✨ Check In — Earn {DAILY_CHECKIN_REWARDS[Math.min(streak, 6)]} BRS
              </button>
            ) : checkinDone ? (
              <div className="w-full py-3.5 rounded-xl text-center bg-green-500/10 border border-green-500/20">
                <span className="text-green-400 font-bold text-sm">✅ Checked In Today — +{checkinReward} BRS!</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* ═══════ SPIN THE WHEEL ═══════ */}
        <div className="relative mb-8">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/20 via-pink-500/15 to-yellow-500/20 rounded-2xl blur-sm" />
          <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6">

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h2 className="font-bold text-lg text-white">Spin the Wheel</h2>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                <Gift className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-purple-400 font-bold">1 Spin / Day</span>
              </div>
            </div>

            {/* Wheel */}
            <div className="flex flex-col items-center">
              <div className="relative mb-5">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
                </div>

                {/* Outer glow ring */}
                <div className={`absolute -inset-3 rounded-full blur-lg transition-all duration-500 ${
                  spinning ? "bg-gradient-to-r from-yellow-500/30 via-purple-500/30 to-cyan-500/30 animate-pulse" : "bg-transparent"
                }`} />

                {/* Outer border ring */}
                <div className="relative p-2 rounded-full bg-gradient-to-r from-yellow-500/30 via-purple-500/20 to-cyan-500/30">
                  <div className="rounded-full p-1 bg-[#0d1117] border border-white/10">
                    <canvas
                      ref={canvasRef}
                      width={280}
                      height={280}
                      className="rounded-full"
                      style={{ display: 'block' }}
                    />
                  </div>
                </div>

                {/* Decorative dots around wheel */}
                {[...Array(16)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full ${spinning ? 'bg-yellow-400' : 'bg-white/10'} transition-colors`}
                    style={{
                      top: `${50 + 48 * Math.sin((i * 22.5 * Math.PI) / 180)}%`,
                      left: `${50 + 48 * Math.cos((i * 22.5 * Math.PI) / 180)}%`,
                      transform: 'translate(-50%, -50%)',
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Spin Button */}
              {canSpin ? (
                <button
                  onClick={handleSpin}
                  disabled={spinning}
                  className={`px-10 py-3.5 rounded-xl font-bold text-base transition-all shadow-lg ${
                    spinning
                      ? "bg-gray-500/20 text-gray-400 cursor-not-allowed border border-white/5"
                      : "text-black bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:scale-105 active:scale-95 shadow-yellow-500/20"
                  }`}
                >
                  {spinning ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                      Spinning...
                    </span>
                  ) : (
                    "🎰 SPIN NOW!"
                  )}
                </button>
              ) : !canCheckin && !checkinDone ? (
                <div className="px-8 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                  <p className="text-orange-400 font-bold text-sm">🔒 Check in first to unlock spin!</p>
                </div>
              ) : showPrize ? null : (
                <div className="px-8 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-green-400 font-bold text-sm">✅ Already spun today — Come back tomorrow!</p>
                </div>
              )}
            </div>

            {/* Prize Pop-up */}
            {showPrize && spinResult !== null && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500/40 to-green-500/40 rounded-2xl blur-md animate-pulse" />
                  <div className="relative bg-[#0d1117]/95 border border-yellow-500/30 rounded-2xl p-6 text-center">
                    <div className="text-5xl mb-3 animate-bounce">🎉</div>
                    <h3 className="text-2xl font-black mb-1">
                      <span className="bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent">
                        You Won!
                      </span>
                    </h3>
                    <div className="text-4xl font-black text-yellow-400 mb-2">
                      +{SPIN_PRIZES[spinResult].value} BRS
                    </div>
                    <p className="text-gray-500 text-xs">Coins added to your wallet instantly!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════ PRIZE TABLE ═══════ */}
        <div className="relative mb-8">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl blur-sm" />
          <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Spin Prizes
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {SPIN_PRIZES.map((prize, i) => (
                <div
                  key={i}
                  className="text-center py-2.5 px-2 rounded-lg border border-white/5 bg-white/[0.02]"
                  style={{ borderColor: prize.color + '30' }}
                >
                  <div
                    className="w-3 h-3 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: prize.color }}
                  />
                  <p className="text-xs font-bold text-white">{prize.label}</p>
                  <p className="text-[9px] text-gray-500">{prize.chance}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RULES */}
        <div className="relative mb-8">
          <div className="relative bg-[#0d1117]/60 backdrop-blur-xl border border-white/5 rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-400 mb-2">📋 Rules</h4>
            <ul className="text-[11px] text-gray-500 space-y-1">
              <li>• Check in every day to maintain your streak</li>
              <li>• Missing a day resets your streak to Day 1</li>
              <li>• Day 7 gives the biggest reward: <span className="text-yellow-400">25 BRS!</span></li>
              <li>• 1 free spin per day after checking in</li>
              <li>• All rewards are instantly credited to your wallet</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
