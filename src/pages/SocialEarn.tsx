import { useEffect, useState, useRef } from "react"
import { getUser } from "../lib/session"
import { navigate } from "@/lib/router"
import { db } from "../lib/firebase"
import { doc, getDoc, updateDoc, addDoc, collection, increment } from "firebase/firestore"
import { ArrowLeft, ExternalLink, Check, Lock, Sparkles, Star, ChevronRight, Shield } from "lucide-react"
import Navbar from "../components/Navbar"

// ═══════════════════════════════════════════
// SOCIAL MEDIA PLATFORMS CONFIG
// ═══════════════════════════════════════════
const REWARD_PER_PLATFORM = 10 // BRS
const VERIFY_SECONDS = 30 // anti-cheat timer

interface SocialPlatform {
  id: string
  name: string
  description: string
  icon: string
  url: string
  gradient: string
  borderColor: string
  glowColor: string
  textColor: string
  bgColor: string
  available: boolean
}

const platforms: SocialPlatform[] = [
  {
    id: "telegram",
    name: "Telegram",
    description: "Join our Telegram community",
    icon: "📱",
    url: "https://t.me/Bharos_exchange",
    gradient: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/20",
    glowColor: "from-blue-500/20 to-cyan-500/15",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    available: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Subscribe to our YouTube channel",
    icon: "🎬",
    url: "https://www.youtube.com/@BRSExchange",
    gradient: "from-red-500 to-rose-500",
    borderColor: "border-red-500/20",
    glowColor: "from-red-500/20 to-rose-500/15",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    available: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Follow our WhatsApp channel",
    icon: "💬",
    url: "https://whatsapp.com/channel/bharos-exchange",
    gradient: "from-green-500 to-emerald-500",
    borderColor: "border-green-500/20",
    glowColor: "from-green-500/20 to-emerald-500/15",
    textColor: "text-green-400",
    bgColor: "bg-green-500/10",
    available: true,
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    description: "Follow us on X",
    icon: "🐦",
    url: "https://x.com/BharosExchange",
    gradient: "from-gray-400 to-gray-600",
    borderColor: "border-gray-500/20",
    glowColor: "from-gray-500/20 to-gray-400/15",
    textColor: "text-gray-300",
    bgColor: "bg-gray-500/10",
    available: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Follow us on Instagram",
    icon: "📸",
    url: "https://instagram.com/bharosexchange",
    gradient: "from-pink-500 to-purple-500",
    borderColor: "border-pink-500/20",
    glowColor: "from-pink-500/20 to-purple-500/15",
    textColor: "text-pink-400",
    bgColor: "bg-pink-500/10",
    available: true,
  },
]

export default function SocialEarn() {
  const email = getUser()
  const [loading, setLoading] = useState(true)
  const [userStatus, setUserStatus] = useState("")
  const [claimed, setClaimed] = useState<Record<string, boolean>>({})
  const [totalEarned, setTotalEarned] = useState(0)
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({})
  const [linkOpened, setLinkOpened] = useState<Record<string, boolean>>({})
  const [claiming, setClaiming] = useState<Record<string, boolean>>({})
  const [justClaimed, setJustClaimed] = useState<string | null>(null)
  const timerRefs = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    if (!email) return navigate("/", true)
    loadUserData()
    return () => {
      Object.values(timerRefs.current).forEach(clearInterval)
    }
  }, [])

  const loadUserData = async () => {
    if (!email) return
    try {
      const snap = await getDoc(doc(db, "users", email))
      if (snap.exists()) {
        const data: any = snap.data()
        setUserStatus(data.status || "inactive")
        const sc = data.socialEarnClaimed || {}
        setClaimed(sc)
        setTotalEarned(data.socialEarnTotal || 0)
      }
    } catch (err) {
      console.error("Load error:", err)
    }
    setLoading(false)
  }

  const handleFollow = (platform: SocialPlatform) => {
    if (!platform.available || claimed[platform.id] || userStatus !== "active") return

    // Open link in new tab
    window.open(platform.url, "_blank", "noopener,noreferrer")

    // Mark as opened
    setLinkOpened(prev => ({ ...prev, [platform.id]: true }))

    // Start countdown timer
    if (activeTimers[platform.id] !== undefined) return // already timing

    setActiveTimers(prev => ({ ...prev, [platform.id]: VERIFY_SECONDS }))

    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const current = prev[platform.id]
        if (current <= 1) {
          clearInterval(interval)
          const updated = { ...prev }
          delete updated[platform.id]
          return updated
        }
        return { ...prev, [platform.id]: current - 1 }
      })
    }, 1000)

    timerRefs.current[platform.id] = interval
  }

  const handleClaim = async (platform: SocialPlatform) => {
    if (!email || claimed[platform.id] || activeTimers[platform.id] !== undefined) return

    setClaiming(prev => ({ ...prev, [platform.id]: true }))

    try {
      // Update Firestore
      await updateDoc(doc(db, "users", email), {
        [`socialEarnClaimed.${platform.id}`]: true,
        socialEarnTotal: increment(REWARD_PER_PLATFORM),
        brsBalance: increment(REWARD_PER_PLATFORM),
      })

      // Record transaction
      await addDoc(collection(db, "transactions"), {
        userId: email,
        amount: REWARD_PER_PLATFORM,
        currency: "BRS",
        type: "SOCIAL_EARN",
        description: `Followed ${platform.name}`,
        platform: platform.id,
        createdAt: new Date(),
      })

      // Update local state
      setClaimed(prev => ({ ...prev, [platform.id]: true }))
      setTotalEarned(prev => prev + REWARD_PER_PLATFORM)
      setJustClaimed(platform.id)
      setTimeout(() => setJustClaimed(null), 3000)
    } catch (err) {
      console.error("Claim error:", err)
      alert("Failed to claim reward. Please try again.")
    }

    setClaiming(prev => ({ ...prev, [platform.id]: false }))
  }

  const totalPossible = platforms.filter(p => p.available).length * REWARD_PER_PLATFORM
  const completedCount = platforms.filter(p => claimed[p.id]).length
  const availableCount = platforms.filter(p => p.available).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050816]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading Social Rewards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">
      {/* AMBIENT BACKGROUND */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-purple-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full" />
      <div className="absolute top-1/3 right-[-10%] w-[300px] h-[300px] bg-yellow-500/3 blur-[100px] rounded-full" />

      <Navbar />

      <div className="relative z-10 px-4 max-w-3xl mx-auto pb-20">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mt-4 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Dashboard</span>
        </button>

        {/* ═══════ HERO BANNER ═══════ */}
        <div className="relative mb-8">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500/30 via-purple-500/20 to-cyan-500/30 rounded-2xl blur-md animate-pulse" />
          <div className="relative bg-[#0d1117]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center overflow-hidden">
            
            {/* Floating particles */}
            <div className="absolute top-4 left-8 w-2 h-2 bg-yellow-400/30 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="absolute top-12 right-12 w-1.5 h-1.5 bg-cyan-400/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-8 left-16 w-1 h-1 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-4 right-8 w-2 h-2 bg-green-400/30 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-semibold tracking-wider uppercase">Limited Offer</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black mb-3">
                <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Earn {totalPossible} BRS
                </span>
              </h1>
              <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                Follow Bharos Exchange on social media and earn <span className="text-yellow-400 font-semibold">{REWARD_PER_PLATFORM} BRS</span> per platform!
              </p>

              {/* PROGRESS */}
              <div className="max-w-sm mx-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs font-bold text-yellow-400">{totalEarned}/{totalPossible} BRS</span>
                </div>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 transition-all duration-1000 relative"
                    style={{ width: `${totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 mt-1.5">
                  {completedCount}/{availableCount} platforms completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ INACTIVE USER WARNING ═══════ */}
        {userStatus !== "active" && (
          <div className="relative mb-6">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl blur-sm" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-orange-500/20 rounded-xl p-5 text-center">
              <Shield className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <h3 className="text-orange-400 font-bold mb-1">Account Not Active</h3>
              <p className="text-xs text-gray-500 mb-3">
                Social Earn rewards are only available for active members.
              </p>
              <button
                onClick={() => navigate("/activate")}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:scale-105 transition-all shadow-lg shadow-yellow-500/20"
              >
                Activate Now (12 USDT)
              </button>
            </div>
          </div>
        )}

        {/* ═══════ SOCIAL PLATFORM CARDS ═══════ */}
        <div className="space-y-4">
          {platforms.map((platform, index) => {
            const isClaimed = claimed[platform.id]
            const isTimerActive = activeTimers[platform.id] !== undefined
            const isLinkOpened = linkOpened[platform.id]
            const isClaiming = claiming[platform.id]
            const isJustClaimed = justClaimed === platform.id
            const isLocked = !platform.available
            const isInactive = userStatus !== "active"
            const canClaim = isLinkOpened && !isTimerActive && !isClaimed && !isLocked && !isInactive

            return (
              <div
                key={platform.id}
                className={`relative group transition-all duration-500 ${isJustClaimed ? 'scale-[1.02]' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow */}
                <div className={`absolute -inset-[1px] bg-gradient-to-r ${platform.glowColor} rounded-2xl blur-sm ${
                  isClaimed ? 'opacity-50' : 'group-hover:blur-md'
                } transition-all`} />

                <div className={`relative bg-[#0d1117]/90 backdrop-blur-xl border ${platform.borderColor} rounded-2xl p-5 ${
                  isLocked ? 'opacity-50' : ''
                } ${isClaimed ? 'border-green-500/30' : ''} transition-all`}>

                  <div className="flex items-center gap-4">
                    {/* Platform Icon */}
                    <div className={`w-14 h-14 rounded-2xl ${platform.bgColor} border ${platform.borderColor} flex items-center justify-center text-2xl shrink-0 relative`}>
                      {isLocked ? (
                        <Lock className="w-5 h-5 text-gray-500" />
                      ) : isClaimed ? (
                        <div className="relative">
                          <span>{platform.icon}</span>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#0d1117]">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      ) : (
                        <span>{platform.icon}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`font-bold text-base ${isClaimed ? 'text-green-400' : 'text-white'}`}>
                          {platform.name}
                        </h3>
                        {isClaimed && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-semibold">
                            ✅ Earned
                          </span>
                        )}
                        {isLocked && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/20 text-[10px] text-gray-500 font-semibold">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{platform.description}</p>

                      {/* Reward badge */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className={`text-xs font-bold ${isClaimed ? 'text-green-400' : 'text-yellow-400'}`}>
                          {isClaimed ? `+${REWARD_PER_PLATFORM} BRS Claimed!` : `+${REWARD_PER_PLATFORM} BRS Reward`}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0">
                      {isLocked ? (
                        <div className="px-4 py-2.5 rounded-xl bg-gray-500/10 border border-gray-500/15 text-xs text-gray-600 font-medium">
                          🔒 Soon
                        </div>
                      ) : isClaimed ? (
                        <div className="px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-bold">
                          ✅ Done
                        </div>
                      ) : isTimerActive ? (
                        <div className="flex flex-col items-center">
                          <div className="relative w-14 h-14">
                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                              <circle
                                cx="28" cy="28" r="24" fill="none"
                                stroke="url(#timerGrad)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={150.8}
                                strokeDashoffset={150.8 - (150.8 * (activeTimers[platform.id] || 0)) / VERIFY_SECONDS}
                                className="transition-all duration-1000"
                              />
                              <defs>
                                <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                                  <stop offset="0%" stopColor="#22d3ee" />
                                  <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold text-cyan-400">{activeTimers[platform.id]}s</span>
                            </div>
                          </div>
                          <span className="text-[9px] text-gray-500 mt-1">Verifying...</span>
                        </div>
                      ) : canClaim ? (
                        <button
                          onClick={() => handleClaim(platform)}
                          disabled={isClaiming}
                          className={`px-5 py-2.5 rounded-xl font-bold text-sm text-black bg-gradient-to-r ${platform.gradient} hover:scale-105 active:scale-95 transition-all shadow-lg ${
                            isClaiming ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isClaiming ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                              <span>Claiming...</span>
                            </div>
                          ) : (
                            <span>🎁 Claim {REWARD_PER_PLATFORM} BRS</span>
                          )}
                        </button>
                      ) : isInactive ? (
                        <div className="px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/15 text-xs text-orange-400 font-medium">
                          🔒 Activate
                        </div>
                      ) : (
                        <button
                          onClick={() => handleFollow(platform)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black bg-gradient-to-r ${platform.gradient} hover:scale-105 active:scale-95 transition-all shadow-lg`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timer progress bar when active */}
                  {isTimerActive && (
                    <div className="mt-3 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div
                        className="h-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
                        style={{ width: `${((VERIFY_SECONDS - (activeTimers[platform.id] || 0)) / VERIFY_SECONDS) * 100}%` }}
                      />
                    </div>
                  )}

                  {/* Just claimed animation */}
                  {isJustClaimed && (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ═══════ SECURITY NOTE ═══════ */}
        <div className="mt-8 mb-6">
          <div className="relative">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl blur-sm" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Secure & Fair Rewards</h4>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Each reward can only be claimed <span className="text-cyan-400 font-medium">once per account</span></li>
                    <li>• 30-second verification ensures genuine follows</li>
                    <li>• Only <span className="text-green-400 font-medium">active members</span> are eligible</li>
                    <li>• BRS coins are instantly credited to your wallet</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ ALL CLAIMED CELEBRATION ═══════ */}
        {completedCount === availableCount && availableCount > 0 && (
          <div className="relative mb-8">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500/30 to-green-500/30 rounded-2xl blur-md animate-pulse" />
            <div className="relative bg-[#0d1117]/95 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent mb-2">
                All Rewards Claimed!
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                You've earned <span className="text-yellow-400 font-bold">{totalEarned} BRS</span> from social media rewards!
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-yellow-400 to-amber-500 hover:scale-105 transition-all shadow-lg shadow-yellow-500/20"
              >
                <span>Go to Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Shimmer animation style */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
