import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

// ✅ ADD YOUR POPUP IMAGES HERE
// Import images from assets folder:
// import popupImg from '../assets/popup.jpg'

// Slides for NEW / INACTIVE users only
const newUserSlides = [
  {
    title: "🎉 Welcome to Bharos Exchange!",
    message: "Activate your account today and earn referral commissions on 12 levels + special rewards!",
    bgGradient: "from-cyan-500/20 to-blue-600/20"
  }
]

// Slides for ALL users (active + inactive)
const commonSlides = [
  {
    title: "🚀 BRS Token Update",
    message: "BRS token listing coming soon! Early members get exclusive benefits. Stay tuned for official announcements.",
    bgGradient: "from-yellow-500/20 to-orange-600/20"
  },
  {
    title: "💰 Referral Rewards Active!",
    message: "Earn commissions on 12 levels! Direct Reward $20, Matrix Reward $30, and International Trip for top achievers!",
    bgGradient: "from-green-500/20 to-emerald-600/20"
  }
]

export default function LoginPopup({ userStatus = "inactive" }: { userStatus?: string }) {
  const [show, setShow] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Build slides based on user status
  const popupSlides = userStatus === "active" 
    ? commonSlides 
    : [...newUserSlides, ...commonSlides]

  useEffect(() => {
    // Show popup once per session (per browser tab)
    const seen = sessionStorage.getItem("bharos_popup_seen")
    if (!seen) {
      // Small delay so dashboard loads first
      const timer = setTimeout(() => setShow(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setShow(false)
    sessionStorage.setItem("bharos_popup_seen", "true")
  }

  const nextSlide = () => {
    if (currentSlide < popupSlides.length - 1) {
      setCurrentSlide(prev => prev + 1)
    } else {
      handleClose()
    }
  }

  if (!show) return null

  const slide = popupSlides[currentSlide]

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition shadow-lg"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Card */}
        <div className={`bg-gradient-to-br ${slide.bgGradient} bg-[#1a1a2e] border-2 border-yellow-500/50 rounded-2xl overflow-hidden shadow-2xl shadow-yellow-500/20`}>
          
          {/* Image area (if image exists) */}
          {(slide as any).image && (
            <div className="w-full">
              <img 
                src={(slide as any).image} 
                alt={slide.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Text content */}
          <div className="p-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              {slide.title}
            </h3>
            <p className="text-gray-300 text-base leading-relaxed mb-6">
              {slide.message}
            </p>

            {/* Slide dots */}
            {popupSlides.length > 1 && (
              <div className="flex justify-center gap-2 mb-4">
                {popupSlides.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentSlide 
                        ? 'w-8 bg-cyan-400' 
                        : 'w-2 bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Next / Got it button */}
            <button
              onClick={nextSlide}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-white hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/50 transition-all duration-300"
            >
              {currentSlide < popupSlides.length - 1 ? "Next →" : "Got it! ✅"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
