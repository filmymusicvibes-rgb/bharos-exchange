import { useEffect, useState, useRef, useCallback } from "react"
import { getUser } from "../lib/session"
import { navigate } from "@/lib/router"
import { db } from "../lib/firebase"
import { doc, getDoc, updateDoc, addDoc, collection, increment, getDocs, query, where } from "firebase/firestore"
import { ArrowLeft, Calendar, Star, Flame, Gift, Trophy, Zap, Lock, Users, X, Coins } from "lucide-react"
import Navbar from "../components/Navbar"

// ═══════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════
const REQUIRED_DIRECT_ACTIVE = 10 // Need 10 direct active members to unlock
const DAILY_CHECKIN_REWARDS = [2, 3, 5, 7, 10, 15, 25] // Day 1-7

// Rebalanced: average ~5 BRS/spin (50 BRS over ~10 spins)
const SPIN_PRIZES = [
  { label: "1 BRS", value: 1, color: "#6b7280", chance: 30 },
  { label: "2 BRS", value: 2, color: "#3b82f6", chance: 25 },
  { label: "3 BRS", value: 3, color: "#8b5cf6", chance: 18 },
  { label: "5 BRS", value: 5, color: "#06b6d4", chance: 12 },
  { label: "8 BRS", value: 8, color: "#f59e0b", chance: 7 },
  { label: "10 BRS", value: 10, color: "#10b981", chance: 4 },
  { label: "15 BRS", value: 15, color: "#ef4444", chance: 2.5 },
  { label: "25 BRS", value: 25, color: "#ec4899", chance: 1.5 },
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

  // Lock state
  const [directActiveCount, setDirectActiveCount] = useState(0)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showLockPopup, setShowLockPopup] = useState(false)

  // Spin states
  const [canSpin, setCanSpin] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState<number | null>(null)
  const [spinAngle, setSpinAngle] = useState(0)
  const [showPrize, setShowPrize] = useState(false)
  const [totalEarnedToday, setTotalEarnedToday] = useState(0)
  const [showCoinShower, setShowCoinShower] = useState(false)
  const [tickerBounce, setTickerBounce] = useState(false)
  const [lightPhase, setLightPhase] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lightIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

        // Check direct active members
        const refCode = data.referralCode || ""
        if (refCode) {
          const usersSnap = await getDocs(
            query(collection(db, "users"), where("referredBy", "==", refCode))
          )
          let activeCount = 0
          usersSnap.forEach(d => {
            const u: any = d.data()
            if (u.status === "active") activeCount++
          })
          setDirectActiveCount(activeCount)
          setIsUnlocked(activeCount >= REQUIRED_DIRECT_ACTIVE)
        }
      }
    } catch (err) {
      console.error("Load error:", err)
    }
    setLoading(false)
  }

  const handleCheckin = async () => {
    if (!email || !canCheckin || !isUnlocked) return

    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

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
      setCanSpin(true)
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

    for (let i = 0; i < segments; i++) {
      const angle = i * arc + (spinAngle * Math.PI) / 180

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, angle, angle + arc)
      ctx.closePath()

      const grad = ctx.createRadialGradient(center, center, 0, center, center, radius)
      grad.addColorStop(0, SPIN_PRIZES[i].color + "40")
      grad.addColorStop(0.7, SPIN_PRIZES[i].color + "90")
      grad.addColorStop(1, SPIN_PRIZES[i].color)
      ctx.fillStyle = grad
      ctx.fill()

      ctx.strokeStyle = "rgba(255,255,255,0.15)"
      ctx.lineWidth = 1.5
      ctx.stroke()

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

    ctx.fillStyle = "#fbbf24"
    ctx.font = "bold 11px system-ui"
    ctx.textAlign = "center"
    ctx.fillText("SPIN", center, center - 2)
    ctx.fillText("& WIN", center, center + 11)
  }

  // LED light chase animation during spin
  useEffect(() => {
    if (spinning) {
      lightIntervalRef.current = setInterval(() => {
        setLightPhase(p => (p + 1) % 16)
      }, 80)
    } else {
      if (lightIntervalRef.current) {
        clearInterval(lightIntervalRef.current)
        lightIntervalRef.current = null
      }
      setLightPhase(0)
    }
    return () => {
      if (lightIntervalRef.current) clearInterval(lightIntervalRef.current)
    }
  }, [spinning])

  // Ticker bounce simulation — the pointer bounces at segment boundaries
  const triggerTickerBounce = useCallback(() => {
    setTickerBounce(true)
    setTimeout(() => setTickerBounce(false), 100)
  }, [])

  const handleSpin = () => {
    if (!canSpin || spinning || !isUnlocked) return

    setSpinning(true)
    setShowPrize(false)
    setShowCoinShower(false)
    setSpinResult(null)

    const prizeIndex = getWeightedPrize()
    const segments = SPIN_PRIZES.length
    const segmentAngle = 360 / segments
    // Offset by 90° because pointer is at top (12 o'clock) but canvas draws from right (3 o'clock)
    const targetAngle = 360 * 7 + (360 - prizeIndex * segmentAngle - segmentAngle / 2 - 90)

    const duration = 5000 // longer for more dramatic effect
    const startTime = Date.now()
    let lastSegment = -1

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Smoother easing: fast start, dramatic slow-down
      const eased = 1 - Math.pow(1 - progress, 4)
      const currentAngle = eased * targetAngle
      const normalizedAngle = currentAngle % 360
      setSpinAngle(normalizedAngle)

      // Ticker bounce when crossing segment boundary
      const currentSegment = Math.floor(normalizedAngle / segmentAngle) % segments
      if (currentSegment !== lastSegment) {
        lastSegment = currentSegment
        triggerTickerBounce()
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setSpinResult(prizeIndex)
        setShowPrize(true)
        setShowCoinShower(true)
        creditSpinReward(prizeIndex)
        // Auto-hide coin shower after 4s
        setTimeout(() => setShowCoinShower(false), 4000)
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
            <div className="absolute top-3 left-6 text-2xl animate-bounce">🎰</div>
            <div className="absolute top-3 right-6 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎁</div>

            <div className="relative z-10">
              <h1 className="text-3xl font-black mb-2">
                <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  Daily Rewards
                </span>
              </h1>
              <p className="text-gray-400 text-sm mb-4">Check in daily + Spin the Wheel to earn BRS!</p>

              {/* UNLOCK PROGRESS */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 mb-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-400">
                  Direct Active: <span className={`font-bold ${isUnlocked ? 'text-green-400' : 'text-yellow-400'}`}>
                    {directActiveCount}/{REQUIRED_DIRECT_ACTIVE}
                  </span>
                </span>
                {isUnlocked ? (
                  <span className="text-[10px] text-green-400 font-bold">✅ Unlocked!</span>
                ) : (
                  <span className="text-[10px] text-orange-400 font-bold">🔒 Locked</span>
                )}
              </div>

              {totalEarnedToday > 0 && (
                <div className="flex justify-center mt-2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                    <Trophy className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-bold text-sm">Today: +{totalEarnedToday} BRS</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ LOCKED OVERLAY WRAPPER ═══════ */}
        <div className="relative">

          {/* LOCK OVERLAY — when not unlocked */}
          {!isUnlocked && (
            <div
              className="absolute inset-0 z-30 rounded-2xl cursor-pointer"
              onClick={() => setShowLockPopup(true)}
              style={{
                backgroundColor: 'rgba(5, 8, 22, 0.75)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            >
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="relative mb-4">
                  <div className="absolute -inset-4 bg-orange-500/10 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/10 border-2 border-orange-500/30 flex items-center justify-center">
                    <Lock className="w-10 h-10 text-orange-400" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-orange-400 mb-2">Daily Rewards Locked</h3>
                <p className="text-gray-500 text-sm mb-1 text-center px-8">
                  Need <span className="text-yellow-400 font-bold">{REQUIRED_DIRECT_ACTIVE} Direct Active Members</span> to unlock
                </p>
                <div className="mt-3 px-5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <span className="text-orange-400 font-bold text-sm">
                    Progress: {directActiveCount}/{REQUIRED_DIRECT_ACTIVE} members
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-48 mt-3 bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all"
                    style={{ width: `${Math.min((directActiveCount / REQUIRED_DIRECT_ACTIVE) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-2">Tap for details</p>
              </div>
            </div>
          )}

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
                  {/* Pointer Arrow with ticker bounce */}
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 transition-transform duration-100 ${
                    tickerBounce ? 'translate-y-1 scale-y-90' : ''
                  }`}>
                    <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                  </div>

                  {/* Glowing aura during spin */}
                  <div className={`absolute -inset-4 rounded-full transition-all duration-300 ${
                    spinning
                      ? "bg-gradient-conic from-yellow-500/40 via-purple-500/30 via-cyan-500/40 to-yellow-500/40 blur-xl animate-spin-glow"
                      : showPrize
                      ? "bg-gradient-to-r from-yellow-500/30 to-green-500/30 blur-xl animate-pulse"
                      : "bg-transparent"
                  }`} />

                  {/* Speed lines during fast spin */}
                  {spinning && (
                    <div className="absolute -inset-6 z-10 pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={`speed-${i}`}
                          className="absolute w-[2px] bg-gradient-to-b from-yellow-400/60 to-transparent animate-speed-line"
                          style={{
                            height: '20px',
                            top: `${50 + 52 * Math.sin((i * 45 * Math.PI) / 180)}%`,
                            left: `${50 + 52 * Math.cos((i * 45 * Math.PI) / 180)}%`,
                            transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div className={`relative p-2 rounded-full transition-all duration-300 ${
                    spinning
                      ? 'bg-gradient-to-r from-yellow-500/50 via-purple-500/40 to-cyan-500/50 shadow-[0_0_30px_rgba(250,204,21,0.3)]'
                      : 'bg-gradient-to-r from-yellow-500/30 via-purple-500/20 to-cyan-500/30'
                  }`}>
                    <div className={`rounded-full p-1 bg-[#0d1117] border transition-all duration-300 ${
                      spinning ? 'border-yellow-400/40' : 'border-white/10'
                    }`}>
                      <canvas
                        ref={canvasRef}
                        width={280}
                        height={280}
                        className="rounded-full"
                        style={{ display: 'block' }}
                      />
                    </div>
                  </div>

                  {/* LED Chase Lights */}
                  {[...Array(16)].map((_, i) => {
                    const isActive = spinning
                      ? (i === lightPhase || i === (lightPhase + 1) % 16 || i === (lightPhase + 2) % 16)
                      : false
                    const isWinGlow = showPrize
                    return (
                      <div
                        key={i}
                        className="absolute rounded-full transition-all duration-100"
                        style={{
                          width: isActive ? '10px' : '7px',
                          height: isActive ? '10px' : '7px',
                          top: `${50 + 48 * Math.sin((i * 22.5 * Math.PI) / 180)}%`,
                          left: `${50 + 48 * Math.cos((i * 22.5 * Math.PI) / 180)}%`,
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: isActive
                            ? i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#a855f7' : '#06b6d4'
                            : isWinGlow
                            ? '#fbbf24'
                            : 'rgba(255,255,255,0.08)',
                          boxShadow: isActive
                            ? `0 0 12px 4px ${i % 3 === 0 ? '#fbbf2480' : i % 3 === 1 ? '#a855f780' : '#06b6d480'}`
                            : isWinGlow
                            ? '0 0 8px 2px #fbbf2460'
                            : 'none',
                        }}
                      />
                    )
                  })}
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

              {/* Prize Pop-up with Coin Celebration */}
              {showPrize && spinResult !== null && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500/50 to-green-500/50 rounded-2xl blur-lg animate-pulse" />
                    <div className="relative bg-[#0d1117]/95 border border-yellow-500/30 rounded-2xl p-6 text-center overflow-hidden">
                      {/* Mini coins floating inside the card */}
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={`mini-coin-${i}`}
                          className="absolute text-lg animate-coin-float pointer-events-none"
                          style={{
                            left: `${5 + Math.random() * 90}%`,
                            top: `-20px`,
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: `${1.5 + Math.random() * 1}s`,
                          }}
                        >
                          🪙
                        </div>
                      ))}

                      <div className="relative z-10">
                        <div className="text-5xl mb-3 animate-prize-pop">🎉</div>
                        <h3 className="text-2xl font-black mb-1 animate-prize-text">
                          <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-green-400 bg-clip-text text-transparent">
                            You Won!
                          </span>
                        </h3>

                        {/* Big coin icon */}
                        <div className="flex justify-center mb-2">
                          <div className="relative">
                            <div className="absolute -inset-3 bg-yellow-400/20 rounded-full blur-lg animate-pulse" />
                            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30 animate-coin-spin-slow border-2 border-yellow-300/50">
                              <span className="text-2xl font-black text-yellow-900">B</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-4xl font-black text-yellow-400 mb-1 animate-prize-value">
                          +{SPIN_PRIZES[spinResult].value} BRS
                        </div>
                        <p className="text-gray-400 text-xs">Coins added to your wallet instantly!</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Full-screen Coin Shower Celebration */}
              {showCoinShower && (
                <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
                  {/* Confetti pieces */}
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={`confetti-${i}`}
                      className="absolute animate-confetti-fall"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: '-20px',
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${2 + Math.random() * 2}s`,
                      }}
                    >
                      <div
                        className="w-2 h-3 rounded-sm animate-confetti-spin"
                        style={{
                          backgroundColor: ['#fbbf24', '#10b981', '#a855f7', '#ef4444', '#06b6d4', '#ec4899'][i % 6],
                        }}
                      />
                    </div>
                  ))}

                  {/* Big bouncing BRS coins */}
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={`shower-coin-${i}`}
                      className="absolute animate-coin-shower"
                      style={{
                        left: `${5 + Math.random() * 90}%`,
                        top: '-60px',
                        animationDelay: `${Math.random() * 1.5}s`,
                        animationDuration: `${2 + Math.random() * 1.5}s`,
                      }}
                    >
                      <div className={`rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30 border border-yellow-300/40 animate-coin-tumble ${
                        i % 3 === 0 ? 'w-10 h-10' : i % 3 === 1 ? 'w-8 h-8' : 'w-6 h-6'
                      }`}>
                        <span className={`font-black text-yellow-900 ${
                          i % 3 === 0 ? 'text-base' : i % 3 === 1 ? 'text-sm' : 'text-[10px]'
                        }`}>B</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
        {/* END locked wrapper */}

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
              <li>• Requires <span className="text-yellow-400">{REQUIRED_DIRECT_ACTIVE} direct active members</span> to unlock</li>
              <li>• Check in every day to maintain your streak</li>
              <li>• Missing a day resets your streak to Day 1</li>
              <li>• Day 7 gives the biggest reward: <span className="text-yellow-400">25 BRS!</span></li>
              <li>• 1 free spin per day after checking in</li>
              <li>• All rewards are instantly credited to your wallet</li>
            </ul>
          </div>
        </div>

      </div>

      {/* ═══════ LOCK POPUP ═══════ */}
      {showLockPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="relative w-full max-w-sm">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-orange-500/40 to-yellow-500/40 rounded-2xl blur-md animate-pulse" />
            <div className="relative bg-[#0d1117] border border-orange-500/30 rounded-2xl p-6 text-center">

              {/* Close */}
              <button
                onClick={() => setShowLockPopup(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/10 border-2 border-orange-500/30 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-orange-400" />
              </div>

              <h3 className="text-xl font-black text-white mb-2">Daily Rewards Locked</h3>

              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Invite friends and get <span className="text-yellow-400 font-bold">{REQUIRED_DIRECT_ACTIVE} direct active members</span> to unlock 
                <span className="text-green-400 font-bold"> Daily Check-in</span> and 
                <span className="text-purple-400 font-bold"> Spin the Wheel!</span>
              </p>

              {/* Progress */}
              <div className="mb-5">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Progress</span>
                  <span className="text-yellow-400 font-bold">{directActiveCount}/{REQUIRED_DIRECT_ACTIVE}</span>
                </div>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all relative"
                    style={{ width: `${Math.min((directActiveCount / REQUIRED_DIRECT_ACTIVE) * 100, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 mt-1">
                  Need {Math.max(0, REQUIRED_DIRECT_ACTIVE - directActiveCount)} more active members
                </p>
              </div>

              {/* Rewards Preview */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 mb-4">
                <p className="text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-wider">What You'll Unlock:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-2 text-center">
                    <div className="text-lg">📅</div>
                    <p className="text-[10px] text-cyan-400 font-bold">Daily Check-in</p>
                    <p className="text-[9px] text-gray-500">up to 25 BRS/day</p>
                  </div>
                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-2 text-center">
                    <div className="text-lg">🎰</div>
                    <p className="text-[10px] text-purple-400 font-bold">Spin Wheel</p>
                    <p className="text-[9px] text-gray-500">up to 25 BRS/spin</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setShowLockPopup(false); navigate("/dashboard") }}
                className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:scale-[1.02] transition-all shadow-lg shadow-yellow-500/20 text-sm"
              >
                📢 Invite Friends & Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer { animation: shimmer 3s infinite; }

        /* Spin Glow */
        @keyframes spin-glow {
          0% { opacity: 0.4; transform: rotate(0deg); }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; transform: rotate(360deg); }
        }
        .animate-spin-glow { animation: spin-glow 2s linear infinite; }

        /* Speed lines */
        @keyframes speed-line {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          50% { opacity: 0.8; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }
        .animate-speed-line { animation: speed-line 0.4s ease-out infinite; }

        /* Coin float inside prize card */
        @keyframes coin-float {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          60% { opacity: 1; }
          100% { transform: translateY(250px) rotate(720deg); opacity: 0; }
        }
        .animate-coin-float { animation: coin-float 2s ease-in forwards; }

        /* Prize popup animations */
        @keyframes prize-pop {
          0% { transform: scale(0) rotate(-30deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(10deg); }
          70% { transform: scale(0.9) rotate(-5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-prize-pop { animation: prize-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }

        @keyframes prize-text {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-prize-text { animation: prize-text 0.4s ease-out 0.3s both; }

        @keyframes prize-value {
          0% { transform: scale(0) translateY(20px); opacity: 0; }
          60% { transform: scale(1.2) translateY(-5px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-prize-value { animation: prize-value 0.5s ease-out 0.5s both; }

        /* Slow coin spin for prize display */
        @keyframes coin-spin-slow {
          0% { transform: perspective(200px) rotateY(0deg); }
          100% { transform: perspective(200px) rotateY(360deg); }
        }
        .animate-coin-spin-slow { animation: coin-spin-slow 2s linear infinite; }

        /* Full-screen coin shower */
        @keyframes coin-shower {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          85% {
            transform: translateY(calc(100vh - 60px)) rotate(540deg);
            opacity: 0.8;
          }
          90% {
            transform: translateY(calc(100vh - 120px)) rotate(580deg);
            opacity: 0.6;
          }
          95% {
            transform: translateY(calc(100vh - 80px)) rotate(620deg);
            opacity: 0.3;
          }
          100% {
            transform: translateY(calc(100vh - 60px)) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-coin-shower { animation: coin-shower ease-in forwards; }

        /* Coin tumble rotation */
        @keyframes coin-tumble {
          0% { transform: perspective(150px) rotateY(0deg) rotateX(0deg); }
          25% { transform: perspective(150px) rotateY(90deg) rotateX(15deg); }
          50% { transform: perspective(150px) rotateY(180deg) rotateX(0deg); }
          75% { transform: perspective(150px) rotateY(270deg) rotateX(-15deg); }
          100% { transform: perspective(150px) rotateY(360deg) rotateX(0deg); }
        }
        .animate-coin-tumble { animation: coin-tumble 0.8s linear infinite; }

        /* Confetti fall */
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(${Math.random() > 0.5 ? '' : '-'}40px);
            opacity: 0;
          }
        }
        .animate-confetti-fall { animation: confetti-fall ease-in forwards; }

        @keyframes confetti-spin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(0.5); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .animate-confetti-spin { animation: confetti-spin 0.6s linear infinite; }
      `}</style>
    </div>
  )
}
