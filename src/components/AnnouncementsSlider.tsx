import { useState, useEffect } from 'react'

// Note: This slider is designed to support future admin uploads
// Administrators can upload announcement banners in 16:9 format
// Images should be high-resolution banners (recommended: 1920x1080)
const announcements = [
  {
    id: 1,
    title: 'Bharos Exchange Beta Launch',
    description: 'Explore the preview of our upcoming trading platform.',
    gradient: 'from-cyan-500/20 to-blue-600/20'
  },
  {
    id: 2,
    title: 'BRS Ecosystem Expansion',
    description: 'Community growth and ecosystem development underway.',
    gradient: 'from-yellow-500/20 to-orange-600/20'
  },
  {
    id: 3,
    title: 'Bharos Mobile App Coming Soon',
    description: 'Our mobile trading app will be available soon.',
    gradient: 'from-purple-500/20 to-pink-600/20'
  }
]

function AnnouncementsSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % announcements.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [isHovered])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % announcements.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + announcements.length) % announcements.length)
  }

  return (
    <section id="announcements" className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#00d4ff] to-[#ffd700] bg-clip-text text-transparent">
            Bharos Announcements & Updates
          </h2>
          <p className="text-gray-400 text-lg">Stay informed about the latest platform developments</p>
        </div>

        {/* Slider Container */}
        <div 
          className="relative overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Slides */}
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {announcements.map((announcement) => (
              <div key={announcement.id} className="min-w-full px-2">
                {/* 16:9 Aspect Ratio Banner */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <div className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-[#00d4ff]/30 hover:border-[#00d4ff]/60 transition-all duration-300 group">
                    {/* Glowing Border Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br opacity-40 blur-xl group-hover:opacity-60 transition-opacity duration-300" 
                         style={{ background: `linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(255, 215, 0, 0.3))` }} />
                    
                    {/* Banner Content */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${announcement.gradient} backdrop-blur-sm flex flex-col justify-center items-center p-8 md:p-12`}>
                      {/* Crypto Grid Background */}
                      <div className="absolute inset-0 opacity-10" 
                           style={{ 
                             backgroundImage: 'linear-gradient(#00d4ff 1px, transparent 1px), linear-gradient(90deg, #00d4ff 1px, transparent 1px)',
                             backgroundSize: '50px 50px'
                           }} />
                      
                      {/* Content */}
                      <div className="relative z-10 text-center max-w-3xl">
                        <div className="mb-4 inline-block">
                          <div className="w-16 h-16 rounded-full bg-[#00d4ff]/20 flex items-center justify-center border-2 border-[#00d4ff] animate-pulse">
                            <svg className="w-8 h-8 text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        
                        <h3 className="text-3xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">
                          {announcement.title}
                        </h3>
                        <p className="text-lg md:text-xl text-gray-200 drop-shadow-md">
                          {announcement.description}
                        </p>

                        {/* Decorative Elements */}
                        <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-[#00d4ff]/30 rounded-tl-2xl" />
                        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-[#ffd700]/30 rounded-br-2xl" />
                      </div>
                    </div>

                    {/* Glow Effect */}
                    <div className="absolute inset-0 shadow-[0_0_50px_rgba(0,212,255,0.3)] group-hover:shadow-[0_0_80px_rgba(0,212,255,0.5)] transition-shadow duration-300 rounded-2xl pointer-events-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#1a1a2e]/80 border border-[#00d4ff]/50 flex items-center justify-center hover:bg-[#00d4ff]/20 transition-all duration-300 group z-10"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6 text-[#00d4ff] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#1a1a2e]/80 border border-[#00d4ff]/50 flex items-center justify-center hover:bg-[#00d4ff]/20 transition-all duration-300 group z-10"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6 text-[#00d4ff] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Indicator Dots */}
        <div className="flex justify-center mt-8 gap-3">
          {announcements.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 rounded-full transition-all duration-300 ${
                currentSlide === index 
                  ? 'w-12 bg-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.8)]' 
                  : 'w-3 bg-gray-600 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default AnnouncementsSlider
