import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore"
import { X, AlertTriangle, Info, Gift, Zap } from "lucide-react"

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
    gradient: "from-blue-500/15 to-cyan-500/15",
    border: "border-blue-500/20",
    textColor: "text-blue-400",
    badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    label: "ℹ️ Info",
  },
  warning: {
    icon: AlertTriangle,
    gradient: "from-orange-500/15 to-red-500/15",
    border: "border-orange-500/20",
    textColor: "text-orange-400",
    badge: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    label: "⚠️ Alert",
  },
  promo: {
    icon: Gift,
    gradient: "from-purple-500/15 to-pink-500/15",
    border: "border-purple-500/20",
    textColor: "text-purple-400",
    badge: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    label: "🎁 Promo",
  },
  update: {
    icon: Zap,
    gradient: "from-green-500/15 to-emerald-500/15",
    border: "border-green-500/20",
    textColor: "text-green-400",
    badge: "bg-green-500/10 border-green-500/20 text-green-400",
    label: "🚀 Update",
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
      const snap = await getDocs(
        query(
          collection(db, "announcements"),
          where("active", "==", true),
          orderBy("createdAt", "desc"),
          limit(5)
        )
      )
      const items = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Announcement[]
      setAnnouncements(items)
    } catch (err) {
      // Silently fail — no announcements collection yet is OK
      console.log("No announcements yet")
    }
  }

  const dismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id))
  }

  const visible = announcements.filter(a => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-3 mb-5">
      {visible.map(ann => {
        const config = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info
        const Icon = config.icon

        return (
          <div key={ann.id} className="relative">
            <div className={`absolute -inset-[1px] bg-gradient-to-r ${config.gradient} rounded-xl blur-sm`} />
            <div className={`relative bg-[#0d1117]/90 backdrop-blur-xl border ${config.border} rounded-xl p-4`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.badge} border`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={`text-sm font-bold ${config.textColor}`}>{ann.title}</h4>
                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${config.badge}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{ann.message}</p>
                </div>
                <button
                  onClick={() => dismiss(ann.id)}
                  className="text-gray-600 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
