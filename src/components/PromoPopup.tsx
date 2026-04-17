import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

/**
 * 🎯 PromoPopup — Full-screen poster popup on Home page
 * 
 * Reads from Firestore "announcements" collection.
 * Shows announcements that have an imageUrl field.
 * Appears instantly after data loads, once per session.
 * Full-screen on mobile (9:16 support), close button at bottom only.
 */
export default function PromoPopup() {
  const [show, setShow] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => {
    // Only show once per session
    const seen = sessionStorage.getItem('bharos_promo_seen')
    if (seen) return

    // Fetch promo announcements with images from Firebase
    const fetchPromo = async () => {
      try {
        const snap = await getDocs(collection(db, 'announcements'))
        const promos = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(a => a.active === true && a.imageUrl) // Only with images
          .sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0
            const timeB = b.createdAt?.seconds || 0
            return timeB - timeA // Latest first
          })

        if (promos.length > 0) {
          setImageUrl(promos[0].imageUrl)
          setTitle(promos[0].title || 'Bharos Exchange')
          // Show instantly — no delay
          setShow(true)
        }
      } catch (err) {
        console.log('PromoPopup load error:', err)
      }
    }

    fetchPromo()
  }, [])

  const handleClose = () => {
    setShow(false)
    sessionStorage.setItem('bharos_promo_seen', 'true')
  }

  if (!show || !imageUrl) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleClose}
      style={{ padding: '0' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Popup Card — Full width on mobile, bigger on desktop */}
      <div
        className="relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          margin: '0 auto',
          padding: '8px',
        }}
      >
        {/* Glow border */}
        <div className="absolute -inset-[2px] bg-gradient-to-br from-cyan-500/40 via-yellow-500/30 to-purple-500/40 rounded-2xl blur-md animate-pulse" />

        {/* Image Card — No X button on top, only close at bottom */}
        <div className="relative bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={imageUrl}
            alt={title}
            style={{
              width: '100%',
              maxHeight: '85vh',
              objectFit: 'contain',
              display: 'block',
            }}
            onError={() => setShow(false)}
          />

          {/* Close button at bottom only */}
          <button
            onClick={handleClose}
            className="w-full py-3.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-t border-white/10 text-gray-300 text-sm font-bold hover:text-white hover:bg-red-500/30 transition-all"
          >
            ✕ Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out both;
        }
      `}</style>
    </div>
  )
}
