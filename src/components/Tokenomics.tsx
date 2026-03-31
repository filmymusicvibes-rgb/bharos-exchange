import { useEffect, useState, useRef } from 'react'
import { PieChart, Coins, Flame, TrendingDown, Calendar, Lock, ArrowRight, Zap } from 'lucide-react'

const DISTRIBUTION = [
  { label: 'Membership Rewards', pct: 40, amount: '600,000,000 BRS', color: '#00d4ff', desc: 'Activation bonuses — 150 BRS per member' },
  { label: 'Staking Rewards', pct: 20, amount: '300,000,000 BRS', color: '#34d399', desc: 'Proportional staking pool distributions' },
  { label: 'Liquidity Pool', pct: 15, amount: '225,000,000 BRS', color: '#a78bfa', desc: 'DEX & CEX exchange listing liquidity' },
  { label: 'Trading Incentives', pct: 10, amount: '150,000,000 BRS', color: '#facc15', desc: 'Trading volume rewards & rebates' },
  { label: 'Marketing & Airdrops', pct: 8, amount: '120,000,000 BRS', color: '#f97316', desc: 'Ecosystem growth & partnerships' },
  { label: 'Team & Development', pct: 7, amount: '105,000,000 BRS', color: '#f43f5e', desc: 'Core development & security audits' },
]

const BURN_MECHANISMS = [
  {
    icon: Zap,
    title: '3% Transaction Burn',
    description: 'Every BRS transaction automatically burns 3% of the amount, permanently reducing circulating supply.',
    highlight: '3%',
    gradient: 'from-orange-500/20 to-red-500/20',
    border: 'border-orange-500/30',
    iconColor: 'text-orange-400',
  },
  {
    icon: TrendingDown,
    title: 'Withdrawal Burn',
    description: 'Early staking withdrawals incur a 50% burn penalty. Standard withdrawals carry a deflationary fee.',
    highlight: '50%',
    gradient: 'from-red-500/20 to-pink-500/20',
    border: 'border-red-500/30',
    iconColor: 'text-red-400',
  },
  {
    icon: Calendar,
    title: 'Quarterly Burn',
    description: 'Every quarter, a portion of accumulated platform fees is permanently burned via smart contract.',
    highlight: 'Q1–Q4',
    gradient: 'from-yellow-500/20 to-orange-500/20',
    border: 'border-yellow-500/30',
    iconColor: 'text-yellow-400',
  },
]

/* ── Animated SVG Donut ─────────────────────────────────────────── */
function DonutChart({ visible }: { visible: boolean }) {
  const size = 280
  const strokeWidth = 38
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let cumulativePct = 0

  return (
    <div className="relative w-full max-w-[320px] mx-auto aspect-square flex items-center justify-center">
      {/* Glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/15 to-blue-600/15 blur-3xl animate-pulse" />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-10 -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {DISTRIBUTION.map((seg, i) => {
          const segLen = (seg.pct / 100) * circumference
          const offset = circumference - (cumulativePct / 100) * circumference
          cumulativePct += seg.pct

          return (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segLen} ${circumference - segLen}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              className="transition-all duration-[1500ms] ease-out"
              style={{
                opacity: visible ? 1 : 0,
                transitionDelay: `${i * 150}ms`,
              }}
            />
          )
        })}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="text-center">
          <Coins className="w-10 h-10 text-yellow-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
          <p className="text-3xl font-bold text-white tracking-tight">1.5B</p>
          <p className="text-gray-400 text-xs mt-0.5 uppercase tracking-widest">Total Supply</p>
        </div>
      </div>
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────────────── */
function Tokenomics() {
  const [isVisible, setIsVisible] = useState(false)
  const [burnVisible, setBurnVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const burnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.15 },
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setBurnVisible(true) },
      { threshold: 0.15 },
    )
    if (burnRef.current) observer.observe(burnRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="tokenomics"
      ref={sectionRef}
      className="relative py-8 lg:py-20 px-4 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent"
    >
      <div className="max-w-6xl mx-auto">
        {/* ─── Header ─── */}
        <div className={`text-center mb-14 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Tokenomics
            </span>
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            A deflationary, reward-driven model designed for sustainable long-term ecosystem growth
          </p>
        </div>

        {/* ─── Supply Distribution ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Donut */}
          <div className={`transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            <DonutChart visible={isVisible} />

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-8 max-w-[320px] mx-auto">
              {DISTRIBUTION.map((seg) => (
                <div key={seg.label} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-xs text-gray-400 truncate">{seg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allocation cards */}
          <div className={`space-y-4 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            {DISTRIBUTION.map((seg, i) => (
              <div
                key={seg.label}
                className="bg-[#1a1a2e]/80 backdrop-blur-sm border border-cyan-500/15 rounded-xl p-5 hover:border-cyan-400/40 transition-all duration-300 group"
                style={{
                  transitionDelay: `${i * 80}ms`,
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <h3 className="text-base font-semibold text-white">{seg.label}</h3>
                  </div>
                  <span
                    className="text-xl font-bold"
                    style={{ color: seg.color }}
                  >
                    {seg.pct}%
                  </span>
                </div>
                <p className="text-gray-500 text-xs ml-[22px]">{seg.amount}</p>
                <p className="text-gray-400 text-sm mt-1.5 ml-[22px]">{seg.desc}</p>
                {/* Progress bar */}
                <div className="mt-3 ml-[22px] h-1.5 bg-gray-700/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-[1200ms] ease-out"
                    style={{
                      width: isVisible ? `${seg.pct}%` : '0%',
                      backgroundColor: seg.color,
                      transitionDelay: `${400 + i * 100}ms`,
                      boxShadow: `0 0 8px ${seg.color}66`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Burn Mechanism ─── */}
        <div ref={burnRef} className="mt-20">
          <div className={`text-center mb-12 transition-all duration-1000 ${
            burnVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-5">
              <Flame size={16} className="text-red-400 animate-pulse" />
              <span className="text-red-400 text-sm font-medium">Deflationary by Design</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                Burn Mechanism
              </span>
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Multiple burn vectors ensure the BRS supply continuously decreases, driving long-term value appreciation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BURN_MECHANISMS.map((burn, i) => {
              const Icon = burn.icon
              return (
                <div
                  key={burn.title}
                  className={`relative bg-gradient-to-br ${burn.gradient} backdrop-blur-sm border ${burn.border} rounded-2xl p-6 transition-all duration-700 hover:scale-[1.03] hover:shadow-lg group`}
                  style={{
                    opacity: burnVisible ? 1 : 0,
                    transform: burnVisible ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: `${i * 150}ms`,
                  }}
                >
                  {/* Highlight badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-black/40 ${burn.iconColor}`}>
                      {burn.highlight}
                    </span>
                  </div>

                  <div className={`w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center mb-4 ${burn.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{burn.title}</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{burn.description}</p>
                </div>
              )
            })}
          </div>

          {/* Burn summary card */}
          <div className={`mt-8 p-6 bg-gradient-to-r from-orange-500/5 via-red-500/10 to-orange-500/5 border border-red-500/20 rounded-2xl transition-all duration-1000 ${
            burnVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`} style={{ transitionDelay: '500ms' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                  <Flame size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Continuous Deflation</p>
                  <p className="text-gray-400 text-sm">Supply decreases with every transaction, staking withdrawal, and quarterly event</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Staking CTA (Coming Soon — Phase 4) ─── */}
        <div className={`mt-16 transition-all duration-1000 ${
          burnVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`} style={{ transitionDelay: '700ms' }}>
          <div className="relative overflow-hidden bg-gradient-to-r from-[#0d1b3e] to-[#132044] border border-white/10 rounded-2xl p-8 lg:p-10">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                  <Lock size={14} className="text-amber-400" />
                  <span className="text-amber-400 text-xs font-medium">Coming in Phase 4</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Stake BRS, Earn Rewards
                </h3>
                <p className="text-gray-400 leading-relaxed max-w-xl">
                  Lock your BRS tokens in the Staking Pool and earn proportional daily rewards.
                  20% of total supply is allocated exclusively for staking distributions.
                  The longer you stake, the more you earn.
                </p>
              </div>
              <div className="shrink-0 inline-flex items-center gap-2 px-8 py-3.5 bg-white/5 border border-white/10 text-gray-500 font-semibold rounded-xl cursor-not-allowed select-none">
                <Lock size={16} />
                <span>Phase 4 • 20,000 Users</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Token Info Box ─── */}
        <div className={`mt-10 p-6 bg-gradient-to-br from-yellow-500/5 to-yellow-600/5 border border-yellow-500/20 rounded-xl transition-all duration-1000 ${
          burnVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`} style={{ transitionDelay: '900ms' }}>
          <p className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
            <PieChart size={20} />
            Token Distribution Model
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            BRS tokens are distributed through membership activations (150 BRS per member), staking rewards, 
            and trading incentives. Referral commissions are paid in USDT — not from BRS supply. 
            15% of supply is reserved for exchange liquidity (PancakeSwap & CEX listings). 
            All token movements are governed by the BRS smart contract on BSC network.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Tokenomics
