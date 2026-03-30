import { useState, useEffect } from 'react'
import { X, Rocket, Gift, Sparkles } from 'lucide-react'

// Slides for NEW / INACTIVE users only
const newUserSlides = [
  {
    icon: Sparkles,
    iconColor: "text-cyan-400",
    glowColor: "cyan",
    title: "Welcome to Bharos Exchange!",
    message: "Activate your account today and earn referral commissions on 12 levels + special rewards!",
  }
]

// Slides for ALL users (active + inactive)
const commonSlides = [
  {
    icon: Rocket,
    iconColor: "text-yellow-400",
    glowColor: "yellow",
    title: "BRS Token Update",
    message: "BRS token listing coming soon! Early members get exclusive benefits. Stay tuned for official announcements.",
  },
  {
    icon: Gift,
    iconColor: "text-green-400",
    glowColor: "green",
    title: "Referral Rewards Active!",
    message: "Earn commissions on 12 levels! Direct Reward $20, Matrix Reward $30, and International Trip for top achievers!",
  }
]

export default function LoginPopup({ userStatus = "inactive" }: { userStatus?: string }) {
  const [show, setShow] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  const popupSlides = userStatus === "active" 
    ? commonSlides 
    : [...newUserSlides, ...commonSlides]

  useEffect(() => {
    const seen = sessionStorage.getItem("bharos_popup_seen")
    if (!seen) {
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
  const Icon = slide.icon

  const glowMap: Record<string, string> = {
    cyan: "from-cyan-500/20 to-blue-500/20",
    yellow: "from-yellow-500/20 to-amber-500/20",
    green: "from-green-500/20 to-emerald-500/20"
  }
  const borderGlowMap: Record<string, string> = {
    cyan: "from-cyan-500/30 to-blue-500/30",
    yellow: "from-yellow-500/30 to-amber-500/30",
    green: "from-green-500/30 to-emerald-500/30"
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-5"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow border */}
        <div className={`absolute -inset-[1px] bg-gradient-to-br ${borderGlowMap[slide.glowColor]} rounded-2xl blur-md`} />

        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute -top-2 -right-2 z-20 w-7 h-7 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <X className="w-3.5 h-3.5 text-gray-300" />
        </button>

        {/* Glass Card */}
        <div className="relative bg-[#0d1117]/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden">
          
          {/* Top ambient glow */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-gradient-to-b ${glowMap[slide.glowColor]} blur-[60px] rounded-full`} />

          {/* Content */}
          <div className="relative p-7 text-center">
            
            {/* Icon */}
            <div className="mb-4">
              <div className={`w-12 h-12 mx-auto rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center backdrop-blur-sm`}>
                <Icon className={`w-6 h-6 ${slide.iconColor}`} />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-3">
              {slide.title}
            </h3>

            {/* Message */}
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {slide.message}
            </p>

            {/* Slide dots */}
            {popupSlides.length > 1 && (
              <div className="flex justify-center gap-2 mb-5">
                {popupSlides.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlide 
                        ? 'w-6 bg-gradient-to-r from-cyan-400 to-blue-400' 
                        : 'w-1.5 bg-white/10'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Button */}
            <button
              onClick={nextSlide}
              className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20"
            >
              {currentSlide < popupSlides.length - 1 ? "Next →" : "Got it!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
