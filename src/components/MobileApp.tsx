import { useEffect, useState, useRef } from 'react'
import {Smartphone, TrendingUp, Wallet, Users, Shield, BarChart3, Download, Clock} from 'lucide-react'
import mobileAppImg from '../assets/mobileapp.jpg'

function MobileApp() {
  const [isVisible, setIsVisible] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const features = [
    { icon: <BarChart3 className="w-5 h-5" />, text: 'Real-time market charts' },
    { icon: <Wallet className="w-5 h-5" />, text: 'BRS wallet management' },
    { icon: <Users className="w-5 h-5" />, text: 'Referral dashboard tracking' },
    { icon: <Shield className="w-5 h-5" />, text: 'Secure login system' },
    { icon: <TrendingUp className="w-5 h-5" />, text: 'Crypto trading interface preview' },
  ]

  return (
    <>
      <section id="mobile-app" ref={sectionRef} className="relative py-8 lg:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Trade Anywhere. Anytime.
              </span>
            </h2>
            <p className="text-2xl text-yellow-400 font-semibold mb-4">
              Bharos Exchange Mobile App – Preview Available
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className={`transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                The Bharos Exchange mobile app is currently under development. Users will soon be able to manage their BRS tokens, track referral earnings, and access their wallets directly from their smartphones.
              </p>
              
              <p className="text-lg text-gray-300 mb-10 leading-relaxed">
                A preview version of the app interface is available so users can explore the design and features before the official launch.
              </p>

              {/* Features List */}
              <div className="space-y-4 mb-10">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 bg-[#1a1a2e] border border-cyan-500/20 rounded-lg p-4 transition-all duration-500 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'
                    }`}
                    style={{ transitionDelay: `${300 + index * 100}ms` }}
                  >
                    <div className="text-cyan-400">
                      {feature.icon}
                    </div>
                    <p className="text-white font-medium">{feature.text}</p>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  onClick={() => window.open('#demo', '_blank')}
                  className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    View Demo App
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>

                <button
                  onClick={() => setShowModal(true)}
                  className="group relative px-8 py-4 bg-[#1a1a2e] border-2 border-yellow-500/50 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/30"
                >
                  <span className="flex items-center justify-center gap-2 text-yellow-400">
                    <Clock className="w-5 h-5" />
                    Official App Coming Soon
                  </span>
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-sm text-gray-500 italic border-l-2 border-cyan-500/30 pl-4">
                Demo version for preview only. Full trading features will be available after the official app launch.
              </p>
            </div>

            {/* Right Side - Phone Mockup */}
            <div className={`relative transition-all duration-1000 delay-400 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}>
              <div className="relative mx-auto max-w-sm">
                {/* Phone Frame */}
                <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0B0919] rounded-[3rem] p-3 shadow-2xl border-4 border-cyan-500/30">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#0B0919] rounded-b-3xl z-20" />
                  
                  {/* Screen */}
                  <div className="relative bg-[#0B0919] rounded-[2.5rem] overflow-hidden aspect-[9/19] border border-cyan-500/20">
                    <img 
                      src={mobileAppImg} 
                      alt="Bharos Exchange Mobile App"
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Phone Glow */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-2xl -z-10 animate-pulse" />
                </div>

                {/* Floating Icons */}
                <div className="absolute -left-8 top-1/4 animate-bounce">
                  <div className="bg-cyan-500/20 border border-cyan-500 rounded-xl p-3 backdrop-blur-sm">
                    <Smartphone className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <div className="absolute -right-8 bottom-1/4 animate-bounce delay-300">
                  <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-3 backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-yellow-500/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl shadow-yellow-500/20 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Coming Soon!</h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                The official Bharos Exchange mobile app will be released soon on Google Play and Apple App Store after final security testing.
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold hover:shadow-xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MobileApp
