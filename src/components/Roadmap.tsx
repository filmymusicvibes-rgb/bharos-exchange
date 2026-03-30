import { useEffect, useState, useRef } from 'react'
import { Rocket, Users as UsersIcon, TrendingUp, Globe, Shield } from 'lucide-react'

const phases = [
  {
    icon: <Rocket className="w-6 h-6" />,
    num: '1',
    phase: 'Phase 1',
    title: 'Website & Smart Contract Setup',
    description: 'Smart contract development, website & wallet setup',
    timeline: 'Month 1–2',
    status: 'In Progress',
    statusType: 'active' as const,
  },
  {
    icon: <UsersIcon className="w-6 h-6" />,
    num: '2',
    phase: 'Phase 2',
    title: 'Community Growth & Beta Platform',
    description: 'Testnet launch, beta user onboarding',
    timeline: 'Month 3–4',
    status: 'Upcoming',
    statusType: 'upcoming' as const,
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    num: '3',
    phase: 'Phase 3',
    title: 'Exchange Launch & BRS Listing',
    description: 'Mainnet launch, first exchange listing, social media campaigns',
    timeline: 'Month 5–6',
    status: 'Q3 2026',
    statusType: 'future' as const,
  },
  {
    icon: <Globe className="w-6 h-6" />,
    num: '4',
    phase: 'Phase 4',
    title: 'Global Ecosystem Expansion',
    description: 'DApp features, staking & rewards, partnerships, full integration',
    timeline: 'Month 7–12',
    status: 'Q4 2026',
    statusType: 'future' as const,
  },
]

function Roadmap() {
  const [isVisible, setIsVisible] = useState(false)
  const [activePhase, setActivePhase] = useState(-1)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    const timers: ReturnType<typeof setTimeout>[] = []
    phases.forEach((_, i) => {
      timers.push(setTimeout(() => setActivePhase(i), 400 + i * 450))
    })
    return () => timers.forEach(clearTimeout)
  }, [isVisible])

  return (
    <section
      id="roadmap"
      ref={sectionRef}
      className="relative py-10 md:py-16 px-4 overflow-hidden"
    >
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Title - clear and prominent */}
        <div className={`text-center mb-8 md:mb-10 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Roadmap
            </span>
          </h2>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
            Our strategic plan to build a comprehensive crypto ecosystem
          </p>
        </div>

        {/* ═══════════ DESKTOP: Zigzag Horizontal Timeline ═══════════ */}
        <div className="hidden md:block">
          <div className="relative" style={{ minHeight: '380px' }}>

            {/* === TOP ROW: Phase 1 & 3 cards (above the line) === */}
            <div className="flex justify-between items-end px-[2%]" style={{ paddingBottom: '8px' }}>
              {phases.map((phase, i) => {
                const isTop = i % 2 === 0 // Phase 1(0), 3(2) go on top
                if (!isTop) return <div key={i} style={{ width: '23%' }} />

                return (
                  <div
                    key={i}
                    className={`transition-all duration-700 ${
                      activePhase >= i ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'
                    }`}
                    style={{
                      width: '23%',
                      transitionDelay: `${i * 300 + 200}ms`,
                    }}
                  >
                    <PhaseCard phase={phase} index={i} isActive={activePhase >= i} />
                    {/* Connector line down to timeline */}
                    <div className="flex justify-center">
                      <div className={`w-[2px] h-6 transition-all duration-500 ${
                        activePhase >= i
                          ? 'bg-gradient-to-b from-cyan-500/40 to-cyan-500/80'
                          : 'bg-transparent'
                      }`} style={{ transitionDelay: `${i * 300 + 400}ms` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* === HORIZONTAL TIMELINE with orbs === */}
            <div className="relative mx-[2%] h-14 flex items-center">
              {/* Base line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-[#1a1a3e] rounded-full" />

              {/* Animated progress line */}
              <div
                className="absolute top-1/2 -translate-y-1/2 left-0 h-[3px] rounded-full transition-all duration-[2500ms] ease-out"
                style={{
                  width: activePhase >= 0 ? `${((activePhase + 1) / phases.length) * 100}%` : '0%',
                  background: 'linear-gradient(90deg, #06b6d4, #fbbf24, #06b6d4, #3b82f6)',
                  boxShadow: '0 0 15px rgba(6,182,212,0.5), 0 0 30px rgba(251,191,36,0.2)',
                }}
              />

              {/* Phase orbs on the line */}
              <div className="relative w-full flex justify-between">
                {phases.map((phase, i) => (
                  <div key={i} className="flex flex-col items-center" style={{ width: '23%' }}>
                    <div
                      className={`relative transition-all duration-700 ${
                        activePhase >= i ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                      }`}
                      style={{ transitionDelay: `${i * 200}ms` }}
                    >
                      {/* Pulse glow ring */}
                      <div
                        className="absolute -inset-3 rounded-full"
                        style={{
                          background: phase.statusType === 'active'
                            ? 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
                          animation: activePhase >= i ? 'orbPulse 2.5s ease-in-out infinite' : 'none',
                        }}
                      />
                      {/* Orb */}
                      <div className={`relative w-11 h-11 rounded-full flex items-center justify-center border-2 font-bold text-lg transition-all duration-500 ${
                        phase.statusType === 'active'
                          ? 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300 text-white shadow-[0_0_25px_rgba(6,182,212,0.6)]'
                          : activePhase >= i
                          ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                          : 'bg-[#0B0919] border-[#1a1a3e] text-gray-600'
                      }`}>
                        {phase.num}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Golden arrows between orbs */}
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`absolute top-1/2 -translate-y-1/2 transition-all duration-500 ${
                    activePhase >= i + 1 ? 'opacity-70' : 'opacity-0'
                  }`}
                  style={{
                    left: `${13.5 + i * 25}%`,
                    transitionDelay: `${(i + 1) * 300}ms`,
                  }}
                >
                  <svg width="32" height="20" viewBox="0 0 32 20" fill="none" className="drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
                    <path d="M0 10H24M24 10L17 3M24 10L17 17" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
                  </svg>
                </div>
              ))}
            </div>

            {/* === BOTTOM ROW: Phase 2 & 4 cards (below the line) === */}
            <div className="flex justify-between items-start px-[2%]" style={{ paddingTop: '8px' }}>
              {phases.map((phase, i) => {
                const isBottom = i % 2 === 1 // Phase 2(1), 4(3) go on bottom
                if (!isBottom) return <div key={i} style={{ width: '23%' }} />

                return (
                  <div
                    key={i}
                    className={`transition-all duration-700 ${
                      activePhase >= i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                    style={{
                      width: '23%',
                      transitionDelay: `${i * 300 + 200}ms`,
                    }}
                  >
                    {/* Connector line from timeline down to card */}
                    <div className="flex justify-center">
                      <div className={`w-[2px] h-6 transition-all duration-500 ${
                        activePhase >= i
                          ? 'bg-gradient-to-b from-cyan-500/80 to-cyan-500/40'
                          : 'bg-transparent'
                      }`} style={{ transitionDelay: `${i * 300 + 400}ms` }} />
                    </div>
                    <PhaseCard phase={phase} index={i} isActive={activePhase >= i} />
                  </div>
                )
              })}
            </div>

          </div>
        </div>

        {/* ═══════════ MOBILE: Vertical Timeline ═══════════ */}
        <div className="md:hidden">
          <div className="relative">
            {/* Vertical path */}
            <div className="absolute left-6 top-0 bottom-0 w-[3px]">
              <div className="absolute inset-0 bg-[#1a1a3e] rounded-full" />
              <div
                className="absolute top-0 left-0 right-0 rounded-full transition-all duration-[2500ms] ease-out"
                style={{
                  height: activePhase >= 0 ? `${((activePhase + 1) / (phases.length + 0.2)) * 100}%` : '0%',
                  background: 'linear-gradient(180deg, #fbbf24, #06b6d4, #3b82f6)',
                  boxShadow: '0 0 12px rgba(251,191,36,0.4)',
                }}
              />
            </div>

            <div className="space-y-6 pl-14">
              {phases.map((phase, i) => (
                <div key={i} className="relative">
                  {/* Node */}
                  <div
                    className={`absolute -left-14 top-4 transition-all duration-700 ${
                      activePhase >= i ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                    }`}
                    style={{ transitionDelay: `${i * 200}ms` }}
                  >
                    <div className="absolute -inset-2 rounded-full" style={{
                      background: phase.statusType === 'active'
                        ? 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
                      animation: activePhase >= i ? 'orbPulse 2.5s ease-in-out infinite' : 'none',
                    }} />
                    <div className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-base ${
                      phase.statusType === 'active'
                        ? 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                        : activePhase >= i
                        ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-[#0B0919] border-gray-700 text-gray-600'
                    }`}>
                      {phase.num}
                    </div>
                  </div>

                  {/* Card */}
                  <div
                    className={`transition-all duration-700 ${
                      activePhase >= i ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
                    }`}
                    style={{ transitionDelay: `${i * 300 + 200}ms` }}
                  >
                    <div className={`p-4 rounded-xl border backdrop-blur-sm ${
                      phase.statusType === 'active'
                        ? 'bg-gradient-to-br from-cyan-500/12 to-blue-600/8 border-cyan-400/35'
                        : activePhase >= i
                        ? 'bg-gradient-to-br from-blue-500/8 to-cyan-500/4 border-cyan-500/15'
                        : 'bg-[#0d1220]/60 border-gray-800/30'
                    }`}
                    style={phase.statusType === 'active' ? { boxShadow: '0 0 15px rgba(6,182,212,0.12)' } : {}}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold tracking-widest uppercase ${
                          phase.statusType === 'active' ? 'text-cyan-300' : activePhase >= i ? 'text-cyan-500' : 'text-gray-600'
                        }`}>
                          {phase.phase} · {phase.timeline}
                        </span>
                        <div className={`${
                          phase.statusType === 'active' ? 'text-cyan-300' : activePhase >= i ? 'text-cyan-500/70' : 'text-gray-700'
                        }`}>
                          {phase.icon}
                        </div>
                      </div>
                      <h4 className={`text-sm font-bold mb-1.5 ${activePhase >= i ? 'text-white' : 'text-gray-500'}`}>
                        {phase.title}
                      </h4>
                      <p className={`text-xs leading-relaxed mb-3 ${activePhase >= i ? 'text-gray-400' : 'text-gray-600'}`}>
                        {phase.description}
                      </p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        phase.statusType === 'active'
                          ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                          : phase.statusType === 'upcoming'
                          ? 'bg-blue-400/15 text-blue-300 border border-blue-400/20'
                          : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {phase.statusType === 'active' && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
                          </span>
                        )}
                        {phase.status}
                      </span>
                    </div>
                  </div>

                  {/* Arrow down */}
                  {i < phases.length - 1 && (
                    <div className={`flex pl-2 py-1 transition-opacity duration-500 ${
                      activePhase >= i + 1 ? 'opacity-40' : 'opacity-0'
                    }`}>
                      <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                        <path d="M7 0V12M7 12L2 7M7 12L12 7" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile Goal */}
              <div className={`relative transition-all duration-1000 ${
                activePhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`} style={{ transitionDelay: '1800ms' }}>
                <div className="absolute -left-14 top-3">
                  <div className="absolute -inset-2 rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)',
                    animation: 'orbPulse 2s ease-in-out infinite',
                  }} />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-400/25"
                  style={{ boxShadow: '0 0 15px rgba(251,191,36,0.1)' }}
                >
                  <div className="text-amber-400 font-bold text-sm mb-1">🏆 Goal</div>
                  <p className="text-xs text-amber-200/60 leading-relaxed">
                    Provide fully functional ecosystem with secure exchange and rewards for holders
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 1; }
        }
        @keyframes cardGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(6,182,212,0.1); }
          50% { box-shadow: 0 0 22px rgba(6,182,212,0.25); }
        }
      `}</style>
    </section>
  )
}

function PhaseCard({
  phase,
  index,
  isActive,
}: {
  phase: typeof phases[number]
  index: number
  isActive: boolean
}) {
  return (
    <div
      className={`group relative rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.03] ${
        phase.statusType === 'active' && isActive ? 'phase-card-glow' : ''
      }`}
    >
      {/* Shimmer border for active */}
      {phase.statusType === 'active' && isActive && (
        <div
          className="absolute inset-0 rounded-xl z-0"
          style={{
            padding: '1.5px',
            background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.5), rgba(59,130,246,0.5), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s linear infinite',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      <div className={`relative z-10 h-full p-4 rounded-xl border transition-all duration-500 ${
        phase.statusType === 'active'
          ? 'bg-gradient-to-br from-[#0d1b2a] via-[#0f1f35] to-[#0d1b2a] border-cyan-500/40'
          : isActive
          ? 'bg-gradient-to-br from-[#0d1525] to-[#0d1525] border-cyan-500/20 hover:border-cyan-500/40'
          : 'bg-[#0d1220] border-[#1a1a3e]/50'
      }`}
      style={phase.statusType === 'active' ? { animation: 'cardGlow 3s ease-in-out infinite' } : {}}
      >
        {/* Phase label + icon */}
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[9px] font-bold tracking-widest uppercase ${
            phase.statusType === 'active' ? 'text-cyan-300' : isActive ? 'text-cyan-500' : 'text-gray-600'
          }`}>
            {phase.phase}
          </span>
          <div className={`transition-all duration-500 ${
            phase.statusType === 'active' ? 'text-cyan-300' : isActive ? 'text-cyan-500/70' : 'text-gray-700'
          }`}
          style={isActive ? { animation: 'iconPulse 2.5s ease-in-out infinite' } : {}}
          >
            {phase.icon}
          </div>
        </div>

        {/* Timeline */}
        <div className={`text-[9px] font-medium mb-1 ${
          phase.statusType === 'active' ? 'text-blue-300/80' : isActive ? 'text-blue-400/60' : 'text-gray-600'
        }`}>
          {phase.timeline}
        </div>

        {/* Title */}
        <h4 className={`text-xs font-bold mb-1 leading-tight ${isActive ? 'text-white' : 'text-gray-500'}`}>
          {phase.title}
        </h4>

        {/* Description */}
        <p className={`text-[10px] leading-snug mb-2.5 ${isActive ? 'text-gray-400' : 'text-gray-600'}`}>
          {phase.description}
        </p>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold ${
          phase.statusType === 'active'
            ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30'
            : phase.statusType === 'upcoming'
            ? 'bg-blue-400/10 text-blue-300 border border-blue-400/20'
            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
        }`}>
          {phase.statusType === 'active' && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
            </span>
          )}
          {phase.status}
        </span>
      </div>
    </div>
  )
}

export default Roadmap
