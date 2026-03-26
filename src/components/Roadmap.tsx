import { useEffect, useState, useRef } from 'react'
import {Rocket, Users as UsersIcon, TrendingUp, Globe} from 'lucide-react'

function Roadmap() {
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

  const phases = [
    {
      icon: <Rocket className="w-10 h-10" />,
      phase: 'Phase 1',
      title: 'Website & Smart Contract Setup',
      description: 'Launch official website, deploy smart contracts, and establish core blockchain infrastructure',
      status: 'In Progress',
    },
    {
      icon: <UsersIcon className="w-10 h-10" />,
      phase: 'Phase 2',
      title: 'Community Growth & Beta Platform',
      description: 'Build community, launch beta exchange platform, implement referral system and wallet features',
      status: 'Upcoming',
    },
    {
      icon: <TrendingUp className="w-10 h-10" />,
      phase: 'Phase 3',
      title: 'Exchange Launch & BRS Listing',
      description: 'Official exchange launch, list BRS on external platforms, enable full trading functionality',
      status: 'Q3 2026',
    },
    {
      icon: <Globe className="w-10 h-10" />,
      phase: 'Phase 4',
      title: 'Global Ecosystem Expansion',
      description: 'Partnership integrations, mobile app launch, staking rewards, and DeFi product expansion',
      status: 'Q4 2026',
    },
  ]

  return (
    <section id="roadmap" ref={sectionRef} className="relative py-8 lg:py-16 px-4 bg-gradient-to-b from-transparent via-blue-600/5 to-transparent">
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Roadmap
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our strategic plan to build a comprehensive crypto ecosystem
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-blue-500/50 to-cyan-500/50" />

          <div className="space-y-12">
            {phases.map((phase, index) => (
              <RoadmapPhase
                key={phase.phase}
                icon={phase.icon}
                phase={phase.phase}
                title={phase.title}
                description={phase.description}
                status={phase.status}
                index={index}
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function RoadmapPhase({
  icon,
  phase,
  title,
  description,
  status,
  index,
  isVisible,
}: {
  icon: React.ReactNode
  phase: string
  title: string
  description: string
  status: string
  index: number
  isVisible: boolean
}) {
  const isLeft = index % 2 === 0

  return (
    <div
      className={`relative transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className={`lg:grid lg:grid-cols-2 lg:gap-8 ${isLeft ? '' : 'lg:grid-flow-dense'}`}>
        {/* Content */}
        <div className={`${isLeft ? 'lg:text-right' : 'lg:col-start-2 lg:text-left'}`}>
          <div className="group bg-[#1a1a2e] border border-cyan-500/30 rounded-2xl p-8 hover:border-cyan-400/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div className={`flex items-center gap-3 mb-4 ${isLeft ? 'lg:justify-end' : ''}`}>
              <div className="text-cyan-400">{icon}</div>
              <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">{phase}</span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed mb-4">{description}</p>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              status === 'In Progress'
                ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
            }`}>
              {status}
            </div>
          </div>
        </div>

        {/* Timeline dot (hidden on mobile) */}
        <div className="hidden lg:flex items-center justify-center lg:col-start-1 lg:row-start-1">
          <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full shadow-lg shadow-cyan-500/50 border-4 border-[#0B0919]" />
        </div>
      </div>
    </div>
  )
}

export default Roadmap
