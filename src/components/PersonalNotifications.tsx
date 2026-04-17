import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore"
import { getUser } from "../lib/session"
import { Trophy, PartyPopper, Info, AlertTriangle, Plane, X, Bell } from "lucide-react"

interface UserNotification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: any
}

const TYPE_CONFIG: any = {
  reward: { icon: Trophy, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", glow: "from-green-500/20 to-emerald-500/20" },
  congrats: { icon: PartyPopper, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", glow: "from-purple-500/20 to-pink-500/20" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "from-blue-500/20 to-cyan-500/20" },
  warning: { icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", glow: "from-orange-500/20 to-red-500/20" },
  trip: { icon: Plane, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", glow: "from-cyan-500/20 to-blue-500/20" },
}

export default function PersonalNotifications() {
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPersonal()
  }, [])

  const loadPersonal = async () => {
    try {
      const email = getUser()
      if (!email) return
      const q = query(
        collection(db, "userNotifications"),
        where("targetUserId", "==", email.toLowerCase())
      )
      const snap = await getDocs(q)
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as UserNotification))
        .sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0
          const timeB = b.createdAt?.seconds || 0
          return timeB - timeA
        })
        .slice(0, 10)

      setNotifications(items)

      // Mark unread as read
      items.filter(n => !n.read).forEach(async (n) => {
        try {
          await updateDoc(doc(db, "userNotifications", n.id), { read: true })
        } catch (_) {}
      })
    } catch (err) {
      console.log("Personal notifications error:", err)
    }
  }

  const dismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id))
  }

  const visible = notifications.filter(n => !dismissed.has(n.id))
  if (visible.length === 0) return null

  return (
    <>
      <div className="mb-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Personal Messages</span>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9px] text-amber-400 font-bold animate-pulse">
              NEW
            </span>
          )}
        </div>

        <div className="space-y-2">
          {visible.map((notif, index) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info
            const Icon = config.icon

            const timeStr = notif.createdAt?.seconds
              ? (() => {
                  const diff = Math.floor((Date.now() - notif.createdAt.seconds * 1000) / 1000)
                  if (diff < 60) return 'Just now'
                  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
                  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
                  return `${Math.floor(diff / 86400)}d ago`
                })()
              : ''

            return (
              <div
                key={notif.id}
                className="relative group"
                style={{ animation: `personalSlide 0.4s ease-out ${index * 0.08}s both` }}
              >
                <div className={`absolute -inset-[1px] bg-gradient-to-r ${config.glow} rounded-xl blur-sm opacity-50 group-hover:opacity-80 transition-all`} />
                <div className={`relative bg-[#0d1117]/90 backdrop-blur-xl ${config.border} border rounded-xl p-3.5 overflow-hidden`}>
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg ${config.bg} ${config.border} border flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-bold ${config.color}`}>{notif.title}</h4>
                        {timeStr && <span className="text-[9px] text-gray-600 ml-auto">{timeStr}</span>}
                      </div>
                      {notif.message && (
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{notif.message}</p>
                      )}
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={() => dismiss(notif.id)}
                      className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes personalSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
