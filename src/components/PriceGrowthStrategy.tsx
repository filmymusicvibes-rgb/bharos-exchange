import { useEffect, useState, useRef } from 'react'
import {TrendingUp, Activity, Users, Repeat} from 'lucide-react'

function PriceGrowthStrategy() {
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

  const growthFactors = [
    {
      icon: Activity,
      title: 'Trading Activity',
      description: 'Increasing trading volume and liquidity within the Bharos Exchange ecosystem.',
      color: 'from-cyan-400 to-blue-500'
    },
    {
      icon: Users,
      title: 'Platform Usage',
      description: 'As more users join the platform and activate their accounts, the demand for BRS tokens increases.',
      color: 'from-yellow-400 to-yellow-600'
    },
    {
      icon: Repeat,
      title: 'Community Expansion',
      description: 'The 12-level referral network and global community growth drive token adoption and market activity.',
      color: 'from-green-400 to-emerald-500'
    }
  ]

  return (
    <section id="price-growth" ref={sectionRef} className="relative py-24 px-4 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent">
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
              BRS Price Growth Strategy
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Bharos Coin (BRS) follows a long-term price growth strategy driven by community expansion, platform adoption, and ecosystem development.
          </p>
        </div>

        {/* Price Chart Visualization */}
        <div className={`mb-16 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-cyan-500/30 rounded-2xl p-8 overflow-hidden">
            {/* Glowing background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-yellow-500/10 to-green-500/10 blur-3xl" />
            
            {/* Chart container */}
            <div className="relative">
              {/* Price points */}
              <div className="flex justify-between items-end mb-8">
                <div className="text-center">
                  <div className="inline-block px-6 py-4 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/50 rounded-xl mb-4">
                    <p className="text-sm text-cyan-300 mb-1">Launch Price</p>
                    <p className="text-3xl font-bold text-white">$0.0055</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-cyan-400 mx-auto animate-bounce" />
                </div>

                <div className="text-center">
                  <div className="inline-block px-6 py-4 bg-gradient-to-br from-yellow-500/20 to-green-600/20 border border-yellow-400/50 rounded-xl mb-4 glow-box">
                    <p className="text-sm text-yellow-300 mb-1">Target Projection</p>
                    <p className="text-3xl font-bold text-white">$1.50</p>
                    <p className="text-xs text-gray-400 mt-1">Month 12 Target</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-400 mx-auto animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>

              {/* Growth arrow path */}
              <div className="relative h-32 mb-6">
                <svg className="w-full h-full" viewBox="0 0 800 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="growthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00d4ff" />
                      <stop offset="50%" stopColor="#ffd700" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 100 Q 200 80, 400 40 T 800 10"
                    fill="none"
                    stroke="url(#growthGradient)"
                    strokeWidth="3"
                    className="animate-draw-path"
                  />
                  {/* Glow effect */}
                  <path
                    d="M 0 100 Q 200 80, 400 40 T 800 10"
                    fill="none"
                    stroke="url(#growthGradient)"
                    strokeWidth="8"
                    opacity="0.3"
                    className="blur-sm animate-pulse"
                  />
                  {/* Arrow markers */}
                  <polygon points="790,10 800,10 795,0" fill="#10b981" className="animate-pulse" />
                </svg>

                {/* Growth percentage indicator */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-500/90 to-green-500/90 px-4 py-2 rounded-full border border-yellow-300/50">
                  <p className="text-sm font-bold text-white">+27,172% Growth</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Factors */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-400 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {growthFactors.map((factor, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 hover:scale-105 transition-all duration-300 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${factor.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <factor.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{factor.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{factor.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom disclaimer */}
        <div className={`text-center transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-block bg-gradient-to-r from-cyan-500/10 to-yellow-500/10 border border-cyan-400/30 rounded-xl px-8 py-4">
            <p className="text-gray-300 text-sm leading-relaxed max-w-3xl">
              "BRS price growth is planned gradually based on community growth, trading activity, and real ecosystem adoption."
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PriceGrowthStrategy
