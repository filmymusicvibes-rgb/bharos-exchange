import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { X, AlertTriangle, Info, Gift, Zap, Megaphone } from "lucide-react"

interface Announcement {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "promo" | "update"
  active: boolean
  createdAt: any
}

const TYPE_CONFIG = {
  info: {
    icon: Info,
    gradient: "from-blue-500/20 via-cyan-500/15 to-blue-500/20",
    border: "border-blue-500/25",
    glow: "from-blue-500/30 to-cyan-500/30",
    textColor: "text-blue-400",
    badge: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    iconBg: "from-blue-500/20 to-cyan-500/15",
    label: "ℹ️ Info",
    emoji: "📢",
  },
  warning: {
    icon: AlertTriangle,
    gradient: "from-orange-500/20 via-red-500/15 to-orange-500/20",
    border: "border-orange-500/25",
    glow: "from-orange-500/30 to-red-500/30",
    textColor: "text-orange-400",
    badge: "bg-orange-500/15 border-orange-500/30 text-orange-400",
    iconBg: "from-orange-500/20 to-red-500/15",
    label: "⚠️ Alert",
    emoji: "🚨",
  },
  promo: {
    icon: Gift,
    gradient: "from-purple-500/20 via-pink-500/15 to-purple-500/20",
    border: "border-purple-500/25",
    glow: "from-purple-500/30 to-pink-500/30",
    textColor: "text-purple-400",
    badge: "bg-purple-500/15 border-purple-500/30 text-purple-400",
    iconBg: "from-purple-500/20 to-pink-500/15",
    label: "🎁 Promo",
    emoji: "🎉",
  },
  update: {
    icon: Zap,
    gradient: "from-green-500/20 via-emerald-500/15 to-green-500/20",
    border: "border-green-500/25",
    glow: "from-green-500/30 to-emerald-500/30",
    textColor: "text-green-400",
    badge: "bg-green-500/15 border-green-500/30 text-green-400",
    iconBg: "from-green-500/20 to-emerald-500/15",
    label: "🚀 Update",
    emoji: "⚡",
  },
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      // Simple query — no composite index needed
      const snap = await getDocs(collection(db, "announcements"))
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Announcement))
        .filter(a => a.active === true)
        .sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0
          const timeB = b.createdAt?.seconds || 0
          return timeB - timeA
        })
        .slice(0, 5)

      setAnnouncements(items)
    } catch (err) {
      console.log("Announcements load error:", err)
    }
  }

  const dismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id))
  }

  const visible = announcements.filter(a => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <>
      <div className="space-y-3 mb-6">
        {/* Section header */}
        {visible.length > 0 && (
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Latest Updates</span>
            <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] text-cyan-400 font-bold animate-pulse">
              NEW
            </span>
          </div>
        )}

        {visible.map((ann, index) => {
          const config = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info
          const Icon = config.icon

          return (
            <div
              key={ann.id}
              className="relative group"
              style={{
                animation: `annSlideIn 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              {/* Animated glow border */}
              <div className={`absolute -inset-[1px] bg-gradient-to-r ${config.glow} rounded-2xl blur-sm opacity-60 group-hover:opacity-100 group-hover:blur-md transition-all duration-500`} />

              <div className={`relative bg-[#0d1117]/92 backdrop-blur-xl border ${config.border} rounded-2xl p-4 overflow-hidden`}>

                {/* Background shimmer */}
                <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-30`} />
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                {/* Floating decoration */}
                <div className="absolute top-2 right-4 text-lg opacity-10 animate-bounce" style={{ animationDelay: `${index * 0.3}s` }}>
                  {config.emoji}
                </div>

                <div className="flex items-start gap-3 relative z-10">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.iconBg} border ${config.badge.split(' ').find(c => c.startsWith('border-'))} flex items-center justify-center shrink-0 shadow-lg`}>
                    <Icon className={`w-4.5 h-4.5 ${config.textColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className={`text-sm font-bold ${config.textColor}`}>{ann.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${config.badge} backdrop-blur-sm`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{ann.message}</p>
                    {ann.createdAt?.seconds && (
                      <p className="text-[10px] text-gray-600 mt-1.5">
                        {new Date(ann.createdAt.seconds * 1000).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => dismiss(ann.id)}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-red-500/30 border border-white/15 hover:border-red-500/40 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes annSlideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
