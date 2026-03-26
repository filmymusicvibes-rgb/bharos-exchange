import { useEffect, useState, useRef } from 'react'
import {CreditCard, Zap, Landmark, Globe, Shield, RefreshCw} from 'lucide-react'

function BharosATMCard() {
  const [isVisible, setIsVisible] = useState(false)
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
    {
      icon: Zap,
      text: 'Convert BRS tokens to fiat instantly',
      color: 'text-cyan-400'
    },
    {
      icon: Landmark,
      text: 'Withdraw cash from supported ATMs',
      color: 'text-yellow-400'
    },
    {
      icon: Globe,
      text: 'Global payments using crypto balance',
      color: 'text-green-400'
    },
    {
      icon: Shield,
      text: 'Secure blockchain wallet integration',
      color: 'text-blue-400'
    },
    {
      icon: RefreshCw,
      text: 'Real-time balance updates',
      color: 'text-purple-400'
    }
  ]

  return (
    <section id="atm-card" ref={sectionRef} className="relative py-8 lg:py-16 px-4 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
      <div className="max-w-7xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-yellow-400 bg-clip-text text-transparent">
              Bharos Crypto ATM Card
            </span>
          </h2>
          <p className="text-2xl text-yellow-400 font-semibold mb-4">
            Use your BRS tokens in the real world with the Bharos Crypto ATM Card.
          </p>
        </div>

        {/* Two-column layout */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {/* Left side - Text content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-lg text-gray-300 leading-relaxed">
                The Bharos Crypto ATM Card bridges the gap between digital assets and real-world spending.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                Users can connect their Bharos wallet and spend their BRS tokens through a secure crypto-powered card system.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                With this card, users can withdraw fiat cash from supported ATMs and make global payments while keeping their assets connected to the Bharos blockchain ecosystem.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-4 mt-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 bg-gradient-to-r from-[#1a1a2e]/80 to-transparent border border-cyan-500/20 rounded-lg p-4 hover:border-cyan-400/40 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <p className="text-gray-200 font-medium">{feature.text}</p>
                </div>
              ))}
            </div>

            {/* Apply button */}
            <div className="mt-8 flex justify-center lg:justify-start">
              <button className="w-full sm:w-auto px-6 sm:px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base sm:text-lg rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] flex justify-center items-center space-x-2">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                <span className="whitespace-nowrap">Apply for Bharos ATM Card</span>
              </button>
            </div>
          </div>

          {/* Right side - ATM Card image */}
          <div className={`relative transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            <div className="relative group">
              {/* Glowing border container */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-yellow-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse" />
              
              {/* Card image container with floating animation */}
              <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-cyan-400/50 rounded-2xl p-2 overflow-hidden animate-float">
                <img
                  src="https://static.lumi.new/54/54eacecc5ecdb942c70cd9e9b04987cf.png"
                  alt="Bharos Crypto ATM Card"
                  className="w-full h-auto rounded-xl object-cover"
                />
                
                {/* Shine effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000 pointer-events-none" />
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-green-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Custom keyframes for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}

export default BharosATMCard
