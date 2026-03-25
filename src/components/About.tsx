import { useEffect, useState, useRef } from 'react'
import {Shield, Zap, Users} from 'lucide-react'

function About() {
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

  return (
    <section id="about" ref={sectionRef} className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              About Bharos Coin
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Bharos Coin (BRS) is a blockchain-powered cryptocurrency ecosystem designed to simplify digital finance.
            The platform integrates a secure crypto exchange, staking rewards, referral earnings and a community-driven financial model.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <IconCard
            icon={<Shield className="w-12 h-12" />}
            title="Secure & Transparent"
            description="Built on blockchain technology with full transaction transparency and smart contract security"
            delay="0ms"
            isVisible={isVisible}
          />
          <IconCard
            icon={<Zap className="w-12 h-12" />}
            title="Lightning Fast"
            description="Instant transactions and real-time processing powered by advanced blockchain infrastructure"
            delay="150ms"
            isVisible={isVisible}
          />
          <IconCard
            icon={<Users className="w-12 h-12" />}
            title="Community-Driven"
            description="Governed by the community with a 12-level referral system rewarding ecosystem growth"
            delay="300ms"
            isVisible={isVisible}
          />
        </div>
      </div>
    </section>
  )
}

function IconCard({ 
  icon, 
  title, 
  description, 
  delay, 
  isVisible 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  delay: string
  isVisible: boolean
}) {
  return (
    <div
      className={`group relative bg-gradient-to-br from-cyan-500/5 to-blue-600/5 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-8 hover:border-cyan-400/50 transition-all duration-700 hover:scale-105 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: delay }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-600/0 group-hover:from-cyan-500/10 group-hover:to-blue-600/10 rounded-2xl transition-all duration-500" />
      
      <div className="relative z-10">
        <div className="text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default About
