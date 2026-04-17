import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { X } from 'lucide-react'

/**
 * 🎯 PromoPopup — Full-screen poster popup on Home page
 * 
 * Reads from Firestore "announcements" collection.
 * Shows announcements that have an imageUrl field.
 * Appears 2 seconds after page load, once per session.
 * Close (X) or click outside to dismiss.
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
          // Show after 2 seconds
          setTimeout(() => setShow(true), 2000)
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Popup Card */}
      <div
        className="relative w-full max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow border */}
        <div className="absolute -inset-[2px] bg-gradient-to-br from-cyan-500/40 via-yellow-500/30 to-purple-500/40 rounded-2xl blur-md animate-pulse" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-20 w-8 h-8 bg-black/80 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:bg-red-500/50 hover:border-red-400/50 transition-all shadow-lg"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Image Card */}
        <div className="relative bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={imageUrl}
            alt={title}
            className="w-full object-contain max-h-[75vh]"
            onError={() => setShow(false)}
          />

          {/* Skip button at bottom */}
          <button
            onClick={handleClose}
            className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-t border-white/10 text-gray-400 text-xs font-semibold hover:text-white hover:bg-white/5 transition-all"
          >
            ✕ Skip / Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out both;
        }
      `}</style>
    </div>
  )
}
