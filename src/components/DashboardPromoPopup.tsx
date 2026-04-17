import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { getUser } from '../lib/session'

/**
 * 📊 DashboardPromoPopup — Full-screen popup for dashboard images
 * 
 * Same style as Home PromoPopup but shows images with showOn='dashboard'
 * Appears when user opens Dashboard, once per session.
 */
export default function DashboardPromoPopup() {
  const [show, setShow] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => {
    const seen = sessionStorage.getItem('bharos_dash_promo_seen')
    if (seen) return

    const fetchPromo = async () => {
      try {
        let isCompanyDirect = false
        const email = getUser()
        if (email) {
          try {
            const userSnap = await getDoc(doc(db, 'users', email))
            if (userSnap.exists()) {
              const userData: any = userSnap.data()
              isCompanyDirect = userData.referredBy === 'COMPANY_DIRECT' || userData.isCompanyDirect === true
            }
          } catch {}
        }

        const snap = await getDocs(collection(db, 'announcements'))
        const promos = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(a => a.active === true && a.imageUrl && a.showOn === 'dashboard')
          .filter(a => {
            const audience = a.targetAudience || 'all'
            if (audience === 'all') return true
            if (audience === 'direct' && isCompanyDirect) return true
            return false
          })
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))

        if (promos.length > 0) {
          setImageUrl(promos[0].imageUrl)
          setTitle(promos[0].title || 'Bharos Exchange')
          setShow(true)
        }
      } catch (err) {
        console.log('DashboardPromoPopup error:', err)
      }
    }

    fetchPromo()
  }, [])

  const handleClose = () => {
    setShow(false)
    sessionStorage.setItem('bharos_dash_promo_seen', 'true')
  }

  if (!show || !imageUrl) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleClose}
      style={{ padding: '0' }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        className="relative animate-dashPopIn"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '420px', margin: '0 auto', padding: '8px' }}
      >
        <div className="absolute -inset-[2px] bg-gradient-to-br from-purple-500/40 via-pink-500/30 to-cyan-500/40 rounded-2xl blur-md animate-pulse" />

        <div className="relative bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={imageUrl}
            alt={title}
            style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain', display: 'block' }}
            onError={() => setShow(false)}
          />
          <button
            onClick={handleClose}
            className="w-full py-3.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-t border-white/10 text-gray-300 text-sm font-bold hover:text-white hover:bg-red-500/30 transition-all"
          >
            ✕ Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dashPopIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-dashPopIn {
          animation: dashPopIn 0.3s ease-out both;
        }
      `}</style>
    </div>
  )
}
