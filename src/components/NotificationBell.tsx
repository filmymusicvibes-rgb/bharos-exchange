import { useState, useEffect } from 'react'
import { Bell, X, Gift, Coins, TrendingUp, Shield, Sparkles, Users, Megaphone, AlertTriangle, Zap } from 'lucide-react'
import { db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { getUser } from '../lib/session'

interface Notification {
  id: string
  icon: any
  title: string
  message: string
  time: string
  type: 'reward' | 'system' | 'promo' | 'team' | 'admin'
  read: boolean
}

// Fallback static notifications (shown if no Firestore data)
const defaultNotifications: Notification[] = [
  {
    id: 'default-1', icon: Gift, title: 'Welcome to Bharos! 🎉',
    message: 'Your account is ready. Activate membership to get 150 FREE BRS Coins!',
    time: 'Just now', type: 'reward', read: false
  },
  {
    id: 'default-2', icon: Coins, title: 'BRS Coin Live on BSC',
    message: 'BRS Token is now live on Binance Smart Chain. View your balance on Dashboard.',
    time: '1h ago', type: 'system', read: false
  },
  {
    id: 'default-3', icon: TrendingUp, title: 'Phase 2 Coming Soon',
    message: 'BRS price target: $0.01 at 30,000 users. Invite friends to accelerate growth!',
    time: '2h ago', type: 'promo', read: true
  },
  {
    id: 'default-4', icon: Shield, title: 'Security Update',
    message: 'Password reset and change features are now available. Keep your account secure!',
    time: '5h ago', type: 'system', read: true
  },
  {
    id: 'default-5', icon: Users, title: 'Referral Rewards Active',
    message: 'Earn USDT commissions through our 12-level referral system. Share and earn!',
    time: '1d ago', type: 'team', read: true
  },
  {
    id: 'default-6', icon: Sparkles, title: 'Staking Coming in Phase 4',
    message: 'Earn 8-40% APY by staking BRS. Available when we reach 50,000 users!',
    time: '2d ago', type: 'promo', read: true
  },
]

const typeColors: Record<string, { bg: string, border: string, text: string }> = {
  reward: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
  system: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
  promo: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  team: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  admin: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
}

const iconMap: Record<string, any> = {
  gift: Gift,
  coins: Coins,
  trending: TrendingUp,
  shield: Shield,
  sparkles: Sparkles,
  users: Users,
  megaphone: Megaphone,
  alert: AlertTriangle,
  zap: Zap,
}

function timeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    const email = getUser()
    if (!email) {
      // Still show default notifications even without email
      const saved = localStorage.getItem('bharos_notifs_read')
      const readIds: string[] = saved ? JSON.parse(saved) : []
      setNotifications(defaultNotifications.map(n => ({
        ...n,
        read: readIds.includes(n.id) || n.read
      })))
      setLoading(false)
      return
    }

    const saved = localStorage.getItem('bharos_notifs_read')
    const readIds: string[] = saved ? JSON.parse(saved) : []

    try {
      // Simple fetch — no orderBy (avoids index requirement)
      const notifSnap = await getDocs(collection(db, "notifications"))

      if (notifSnap.docs.length > 0) {
        // Sort client-side by createdAt descending
        const sorted = notifSnap.docs
          .map(d => ({ id: d.id, ...(d.data() as any) }))
          .sort((a, b) => {
            const tA = a.createdAt?.seconds || 0
            const tB = b.createdAt?.seconds || 0
            return tB - tA
          })
          .slice(0, 20)

        const firestoreNotifs: Notification[] = sorted.map(data => {
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
          const IconComponent = iconMap[data.icon] || Megaphone

          return {
            id: data.id,
            icon: IconComponent,
            title: data.title || 'Notification',
            message: data.message || '',
            time: timeAgo(createdAt),
            type: data.type || 'admin',
            read: readIds.includes(data.id),
          }
        })

        // Merge: admin notifs first, then defaults
        const defaultWithRead = defaultNotifications.map(n => ({
          ...n,
          read: readIds.includes(n.id) || n.read
        }))

        setNotifications([...firestoreNotifs, ...defaultWithRead])
      } else {
        // No admin notifs — use defaults only
        setNotifications(defaultNotifications.map(n => ({
          ...n,
          read: readIds.includes(n.id) || n.read
        })))
      }
    } catch (err) {
      console.log("Notification load fallback:", err)
      // Fallback to defaults on any error
      setNotifications(defaultNotifications.map(n => ({
        ...n,
        read: readIds.includes(n.id) || n.read
      })))
    }

    setLoading(false)
  }

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
    <div style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead() }}
        className="relative p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all"
      >
        <Bell className="w-4 h-4 text-gray-400" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[9px] text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop — covers entire screen */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          />

          {/* Notification Panel */}
          <div style={{
            position: 'fixed',
            top: '60px',
            right: '8px',
            left: '8px',
            maxWidth: '384px',
            marginLeft: 'auto',
            zIndex: 9999,
            backgroundColor: 'rgba(13,17,23,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Notifications</p>
                {unreadCount > 0 && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(239,68,68,0.2)',
                    color: '#f87171',
                    fontSize: '9px',
                    fontWeight: 700,
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{ fontSize: '10px', color: '#22d3ee', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-2" />
                  <p style={{ color: '#6b7280', fontSize: '12px' }}>Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <Bell style={{ width: '32px', height: '32px', color: '#4b5563', margin: '0 auto 8px' }} />
                  <p style={{ color: '#6b7280', fontSize: '12px' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const Icon = notif.icon
                  const colors = typeColors[notif.type] || typeColors.system
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markRead(notif.id)}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '14px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        backgroundColor: !notif.read ? 'rgba(255,255,255,0.02)' : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = !notif.read ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                    >
                      <div className={`shrink-0 w-9 h-9 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <p style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: !notif.read ? '#fff' : '#9ca3af',
                          }}>{notif.title}</p>
                          {!notif.read && <div style={{ width: '6px', height: '6px', backgroundColor: '#22d3ee', borderRadius: '50%', flexShrink: 0 }} />}
                        </div>
                        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{notif.message}</p>
                        <p style={{ fontSize: '9px', color: '#4b5563', marginTop: '4px' }}>{notif.time}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '10px', color: '#4b5563' }}>
                {notifications.length > 0 ? 'All notifications shown' : 'No notifications'}
              </p>
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
