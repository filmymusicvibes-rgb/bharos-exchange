import { useEffect, useState, useRef } from 'react'
import {Lock, Eye, FileCheck, Vote, Globe} from 'lucide-react'

function Features() {
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
      icon: <Lock className="w-10 h-10" />,
      title: 'Secure Blockchain Infrastructure',
      description: 'Military-grade encryption and decentralized architecture ensure your assets are protected 24/7',
    },
    {
      icon: <Eye className="w-10 h-10" />,
      title: 'Transparent Transactions',
      description: 'Every transaction is recorded on the blockchain, providing complete transparency and traceability',
    },
    {
      icon: <FileCheck className="w-10 h-10" />,
      title: 'Smart Contract Security',
      description: 'Audited smart contracts eliminate intermediaries and ensure automated, trustless execution',
    },
    {
      icon: <Vote className="w-10 h-10" />,
      title: 'Community Governance',
      description: 'Token holders participate in platform decisions through decentralized voting mechanisms',
    },
    {
      icon: <Globe className="w-10 h-10" />,
      title: 'Global Crypto Access',
      description: 'Trade BRS and other cryptocurrencies 24/7 from anywhere in the world with instant settlement',
    },
  ]

  return (
    <section id="features" ref={sectionRef} className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Platform Features
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Built with cutting-edge blockchain technology to deliver a secure, transparent, and efficient trading experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={`${index * 100}ms`}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
  isVisible,
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay: string
  isVisible: boolean
}) {
  return (
    <div
      className={`group relative bg-[#1a1a2e] border border-cyan-500/20 rounded-2xl p-8 hover:border-cyan-400/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: delay }}
    >
      <div className="text-cyan-400 mb-4 group-hover:text-cyan-300 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-600/0 group-hover:from-cyan-500/5 group-hover:to-blue-600/5 rounded-2xl transition-all duration-500 pointer-events-none" />
    </div>
  )
}

export default Features
