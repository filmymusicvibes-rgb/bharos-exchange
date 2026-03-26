import { useEffect, useState, useRef } from 'react'
import {Vote, FileText, CheckCircle} from 'lucide-react'

function CommunityGovernance() {
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

  const governanceElements = [
    {
      icon: Vote,
      title: 'Voting System',
      description: 'Token holders can participate in governance voting.',
      color: 'from-yellow-400 to-orange-500',
      glowColor: 'yellow'
    },
    {
      icon: FileText,
      title: 'Community Proposals',
      description: 'Users can submit proposals for ecosystem improvements.',
      color: 'from-cyan-400 to-blue-500',
      glowColor: 'cyan'
    },
    {
      icon: CheckCircle,
      title: 'Decision Consensus',
      description: 'Important platform updates and changes are decided through community consensus.',
      color: 'from-green-400 to-emerald-500',
      glowColor: 'green'
    }
  ]

  return (
    <section id="governance" ref={sectionRef} className="relative py-8 lg:py-16 px-4 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent">
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Community Governance Model
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Bharos Exchange follows a community-driven governance system where BRS token holders participate in ecosystem decisions.
          </p>
        </div>


        {/* Governance Elements */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-400 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {governanceElements.map((element, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-yellow-500/20 rounded-xl p-6 hover:border-yellow-400/40 hover:scale-105 transition-all duration-300 group relative overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Hover glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-br from-${element.glowColor}-500/0 to-${element.glowColor}-500/0 group-hover:from-${element.glowColor}-500/10 group-hover:to-${element.glowColor}-500/10 transition-all duration-300`} />
              
              <div className="relative">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${element.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <element.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{element.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{element.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Supporting Text */}
        <div className={`text-center transition-all duration-1000 delay-600 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-block bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/30 rounded-xl px-8 py-4">
            <p className="text-gray-300 text-sm leading-relaxed max-w-3xl">
              "The Bharos governance model ensures transparency and community participation in shaping the future of the ecosystem."
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CommunityGovernance
