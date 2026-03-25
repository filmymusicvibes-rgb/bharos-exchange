import { useEffect, useState, useRef } from 'react'
import {Brain, TrendingUp, Users, Activity} from 'lucide-react'

function AIGrowthModel() {
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

  const aiFeatures = [
    {
      icon: TrendingUp,
      title: 'Trading Activity',
      description: 'AI analyzes real-time trading patterns and market behavior.',
      color: 'from-cyan-400 to-blue-600',
      delay: '200ms'
    },
    {
      icon: Users,
      title: 'Network Growth',
      description: 'AI monitors community expansion and referral network activity.',
      color: 'from-purple-400 to-pink-600',
      delay: '400ms'
    },
    {
      icon: Activity,
      title: 'Platform Usage',
      description: 'AI evaluates user engagement, transaction activity, and system performance.',
      color: 'from-green-400 to-emerald-600',
      delay: '600ms'
    }
  ]

  return (
    <section id="ai-growth" ref={sectionRef} className="relative py-24 px-4 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              AI Growth Model
            </span>
          </h2>
          <p className="text-2xl text-cyan-300 mb-6">Smart Ecosystem Monitoring</p>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            The Bharos ecosystem integrates AI-based analytics to monitor trading patterns, user growth, and platform performance.
          </p>
        </div>


        {/* AI Features Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-400 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {aiFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 hover:scale-105 transition-all duration-300 group relative overflow-hidden"
              style={{ animationDelay: feature.delay }}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-300" />
              
              <div className="relative">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Supporting Text */}
        <div className={`text-center transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-block bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-xl px-8 py-4">
            <p className="text-gray-300 text-sm leading-relaxed max-w-3xl">
              "AI insights help maintain a stable and scalable ecosystem by analyzing growth trends and optimizing platform performance."
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AIGrowthModel
