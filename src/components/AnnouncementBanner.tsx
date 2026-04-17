import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { X, Info, AlertTriangle, Gift, Zap, Bell, ChevronDown, ChevronUp } from "lucide-react"

interface Announcement {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "promo" | "update"
  active: boolean
  createdAt: any
  imageUrl?: string
}

const TYPE_CONFIG = {
  info: {
    icon: Info,
    accent: "#38bdf8",
    bg: "rgba(56,189,248,0.06)",
    border: "rgba(56,189,248,0.15)",
    badge: "ℹ️",
  },
  warning: {
    icon: AlertTriangle,
    accent: "#fb923c",
    bg: "rgba(251,146,60,0.06)",
    border: "rgba(251,146,60,0.15)",
    badge: "⚠️",
  },
  promo: {
    icon: Gift,
    accent: "#c084fc",
    bg: "rgba(192,132,252,0.06)",
    border: "rgba(192,132,252,0.15)",
    badge: "🎁",
  },
  update: {
    icon: Zap,
    accent: "#4ade80",
    bg: "rgba(74,222,128,0.06)",
    border: "rgba(74,222,128,0.15)",
    badge: "⚡",
  },
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    const saved = sessionStorage.getItem("bharos_ann_dismissed")
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      const snap = await getDocs(collection(db, "announcements"))
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Announcement))
        .filter(a => a.active === true)
        .sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0
          const timeB = b.createdAt?.seconds || 0
          return timeB - timeA
        })
        .slice(0, 10)

      setAnnouncements(items)
    } catch (err) {
      console.log("Announcements load error:", err)
    }
  }

  const dismiss = (id: string) => {
    setDismissed(prev => {
      const next = new Set(prev).add(id)
      sessionStorage.setItem("bharos_ann_dismissed", JSON.stringify([...next]))
      return next
    })
  }

  const visible = announcements.filter(a => !dismissed.has(a.id))
  if (visible.length === 0) return null

  // Show first 2, rest behind expand
  const shown = expanded ? visible : visible.slice(0, 2)
  const hasMore = visible.length > 2

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        {/* Notification header bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}>
          <Bell style={{ width: '13px', height: '13px', color: '#22d3ee' }} />
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            color: '#22d3ee',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
          }}>
            Notifications
          </span>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(to right, rgba(34,211,238,0.15), transparent)',
          }} />
          <span style={{
            padding: '2px 8px',
            borderRadius: '9999px',
            background: 'rgba(34,211,238,0.08)',
            border: '1px solid rgba(34,211,238,0.15)',
            fontSize: '9px',
            color: '#22d3ee',
            fontWeight: 700,
          }}>
            {visible.length}
          </span>
        </div>

        {/* Notification items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {shown.map((ann, index) => {
            const config = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info
            const Icon = config.icon

            const timeStr = ann.createdAt?.seconds
              ? (() => {
                  const diff = Math.floor((Date.now() - ann.createdAt.seconds * 1000) / 1000)
                  if (diff < 60) return 'Just now'
                  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
                  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
                  return `${Math.floor(diff / 86400)}d ago`
                })()
              : ''

            return (
              <div
                key={ann.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  background: config.bg,
                  border: `1px solid ${config.border}`,
                  borderRadius: '10px',
                  position: 'relative',
                  animation: `notifSlideIn 0.3s ease-out ${index * 0.05}s both`,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = config.bg.replace('0.06', '0.1')
                  e.currentTarget.style.borderColor = config.border.replace('0.15', '0.3')
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = config.bg
                  e.currentTarget.style.borderColor = config.border
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: config.bg,
                  border: `1px solid ${config.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px',
                }}>
                  <Icon style={{ width: '13px', height: '13px', color: config.accent }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap' as const,
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: config.accent,
                      lineHeight: '1.3',
                    }}>
                      {config.badge} {ann.title}
                    </span>
                    {timeStr && (
                      <span style={{
                        fontSize: '9px',
                        color: 'rgba(156,163,175,0.6)',
                        marginLeft: 'auto',
                        flexShrink: 0,
                      }}>
                        {timeStr}
                      </span>
                    )}
                  </div>

                  {ann.message && (
                    <p style={{
                      fontSize: '11px',
                      color: 'rgba(156,163,175,0.8)',
                      marginTop: '2px',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                    }}>
                      {ann.message}
                    </p>
                  )}

                  {/* Poster image — small thumbnail if exists */}
                  {ann.imageUrl && (
                    <div
                      style={{
                        marginTop: '6px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer',
                        maxWidth: '200px',
                      }}
                      onClick={() => window.open(ann.imageUrl, '_blank')}
                    >
                      <img
                        src={ann.imageUrl}
                        alt={ann.title}
                        style={{
                          width: '100%',
                          height: '80px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Dismiss */}
                <button
                  onClick={() => dismiss(ann.id)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    marginTop: '1px',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.2)'
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  <X style={{ width: '10px', height: '10px', color: '#9ca3af' }} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Show more / Show less */}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              width: '100%',
              marginTop: '6px',
              padding: '6px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer',
              fontSize: '10px',
              color: '#6b7280',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = '#22d3ee'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              e.currentTarget.style.color = '#6b7280'
            }}
          >
            {expanded ? (
              <>
                <ChevronUp style={{ width: '12px', height: '12px' }} />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown style={{ width: '12px', height: '12px' }} />
                {visible.length - 2} more notification{visible.length - 2 > 1 ? 's' : ''}
              </>
            )}
          </button>
        )}
      </div>

      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
