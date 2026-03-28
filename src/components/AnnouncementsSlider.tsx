import { useState, useEffect } from 'react'

import update1Img from '../assets/Update1.gif'
import update2Img from '../assets/Update2.jpeg'
import update3Img from '../assets/Update3.jpeg'

const announcements = [
  {
    id: 1,
    title: 'Bharos Exchange Beta Launch',
    description: 'Explore the preview of our upcoming trading platform.',
    image: update1Img
  },
  {
    id: 2,
    title: 'BRS Ecosystem Expansion',
    description: 'Community growth and ecosystem development underway.',
    image: update2Img
  },
  {
    id: 3,
    title: 'Bharos Mobile App Coming Soon',
    description: 'Our mobile trading app will be available soon.',
    image: update3Img
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
                    
                    {/* Actual Image */}
                    <img 
                      src={announcement.image} 
                      alt={announcement.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

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
