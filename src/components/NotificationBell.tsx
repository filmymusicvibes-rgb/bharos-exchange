import { useState, useEffect } from 'react'
import { Bell, X, Gift, Coins, TrendingUp, Shield, Sparkles, Users } from 'lucide-react'

interface Notification {
  id: string
  icon: any
  title: string
  message: string
  time: string
  type: 'reward' | 'system' | 'promo' | 'team'
  read: boolean
}

const defaultNotifications: Notification[] = [
  {
    id: '1', icon: Gift, title: 'Welcome to Bharos! 🎉',
    message: 'Your account is ready. Activate membership to get 150 FREE BRS Coins!',
    time: 'Just now', type: 'reward', read: false
  },
  {
    id: '2', icon: Coins, title: 'BRS Coin Live on BSC',
    message: 'BRS Token is now live on Binance Smart Chain. View your balance on Dashboard.',
    time: '1h ago', type: 'system', read: false
  },
  {
    id: '3', icon: TrendingUp, title: 'Phase 2 Coming Soon',
    message: 'BRS price target: $0.05 at 5,000 users. Invite friends to accelerate growth!',
    time: '2h ago', type: 'promo', read: true
  },
  {
    id: '4', icon: Shield, title: 'Security Update',
    message: 'Password reset and change features are now available. Keep your account secure!',
    time: '5h ago', type: 'system', read: true
  },
  {
    id: '5', icon: Users, title: 'Referral Rewards Active',
    message: 'Earn USDT commissions through our 12-level referral system. Share and earn!',
    time: '1d ago', type: 'team', read: true
  },
  {
    id: '6', icon: Sparkles, title: 'Staking Coming in Phase 4',
    message: 'Earn 8-40% APY by staking BRS. Available when we reach 20,000 users!',
    time: '2d ago', type: 'promo', read: true
  },
]

const typeColors: Record<string, { bg: string, border: string, text: string }> = {
  reward: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
  system: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
  promo: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  team: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('bharos_notifs_read')
    const readIds: string[] = saved ? JSON.parse(saved) : []
    const notifs = defaultNotifications.map(n => ({
      ...n,
      read: readIds.includes(n.id) || n.read
    }))
    setNotifications(notifs)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    localStorage.setItem('bharos_notifs_read', JSON.stringify(updated.map(n => n.id)))
  }

  const markRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    setNotifications(updated)
    const readIds = updated.filter(n => n.read).map(n => n.id)
    localStorage.setItem('bharos_notifs_read', JSON.stringify(readIds))
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead() }}
        className="relative p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all"
      >
        <Bell className="w-4 h-4 text-gray-400" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[9px] text-white font-bold">{unreadCount}</span>
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#0d1117]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-white/5">
              <p className="text-sm font-semibold text-white">Notifications</p>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-cyan-400 hover:text-cyan-300 transition">
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)}>
                  <X className="w-4 h-4 text-gray-500 hover:text-white transition" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.map(notif => {
                const Icon = notif.icon
                const colors = typeColors[notif.type] || typeColors.system
                return (
                  <div
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={`flex gap-3 p-3.5 border-b border-white/5 cursor-pointer transition-all hover:bg-white/[0.03] ${
                      !notif.read ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <div className={`shrink-0 w-9 h-9 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-semibold ${!notif.read ? 'text-white' : 'text-gray-400'}`}>{notif.title}</p>
                        {!notif.read && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shrink-0" />}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[9px] text-gray-600 mt-1">{notif.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t border-white/5 text-center">
              <p className="text-[10px] text-gray-600">All notifications shown</p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
