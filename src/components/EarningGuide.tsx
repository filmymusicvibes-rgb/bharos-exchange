import { useState, useEffect, useRef } from 'react'

const EARNING_SOURCES = [
  { icon: '🎯', title: 'Activation Reward', amount: '150 BRS', type: 'brs', desc: 'Instant on activation' },
  { icon: '📅', title: '30-Day Bonus', amount: '150 BRS', type: 'brs', desc: 'Auto after 30 days' },
  { icon: '📱', title: 'Social Media Earn', amount: '50 BRS', type: 'brs', desc: '10 BRS × 5 platforms' },
  { icon: '📅', title: 'Daily Check-in', amount: '2–25 BRS', type: 'brs', desc: '7-day streak cycle' },
  { icon: '🎡', title: 'Spin the Wheel', amount: '1–25 BRS', type: 'brs', desc: '1 free spin daily' },
  { icon: '📊', title: 'BRS Staking', amount: '8–40% APY', type: 'brs', desc: 'Lock & earn interest' },
  { icon: '🎁', title: 'Airdrops', amount: 'Variable', type: 'brs', desc: 'Special events' },
  { icon: '💵', title: 'Level 1 Commission', amount: '$2.00', type: 'usdt', desc: 'Per direct referral' },
  { icon: '💵', title: 'Levels 2–12', amount: '$0.25–$1', type: 'usdt', desc: 'Passive network income' },
  { icon: '🏆', title: 'Direct 10 Reward', amount: '$20 USDT', type: 'usdt', desc: '10 active referrals' },
  { icon: '🔷', title: 'Matrix Reward', amount: '$30 USDT', type: 'usdt', desc: '3+9+27 team structure' },
  { icon: '✈️', title: 'Trip Achievement', amount: 'FREE TRIP', type: 'usdt', desc: '100+ team members' },
  { icon: '🏢', title: 'Company Bonus', amount: '50 BRS', type: 'brs', desc: 'Company referral' },
]

const ROI_DATA = [
  { members: '5', usdt: '$10', inr: '₹835', roi: '83%', color: 'text-gray-400' },
  { members: '10', usdt: '$40', inr: '₹3,340', roi: '3.3x', color: 'text-green-400' },
  { members: '25', usdt: '$74', inr: '₹6,179', roi: '6.2x', color: 'text-emerald-400' },
  { members: '50', usdt: '$131', inr: '₹10,939', roi: '10.9x', color: 'text-cyan-400' },
  { members: '100+', usdt: '$212', inr: '₹17,702', roi: '17.7x', color: 'text-yellow-400' },
]

export default function EarningGuide() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'brs' | 'usdt'>('all')
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
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

  const filtered = EARNING_SOURCES.filter(s =>
    activeTab === 'all' ? true : s.type === activeTab
  )

  return (
    <section
      id="earning-guide"
      ref={sectionRef}
      className="relative py-12 lg:py-20 px-4"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-yellow-500/8 to-transparent rounded-full blur-3xl" />
      </div>

      <div className={`max-w-5xl mx-auto relative transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-yellow-500/15 to-amber-500/15 border border-yellow-500/25 rounded-full mb-4">
            <span className="text-sm">💰</span>
            <span className="text-xs font-bold text-yellow-400 tracking-wider uppercase">Complete Earning Guide</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              13 Ways to Earn
            </span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto">
            Just ₹1,000 invest చేయి — BRS Coins + USDT Dollars రెండూ earn చేయి!
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { key: 'all' as const, label: 'All Sources', count: 13 },
            { key: 'brs' as const, label: '🪙 BRS Coins', count: 8 },
            { key: 'usdt' as const, label: '💵 USDT Cash', count: 5 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 text-yellow-400 shadow-lg shadow-yellow-500/10'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Earning Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
          {filtered.map((source, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 cursor-default ${
                hoveredCard === i
                  ? 'bg-gradient-to-br from-yellow-500/15 to-amber-500/10 border-yellow-500/40 scale-[1.03] shadow-lg shadow-yellow-500/10'
                  : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]'
              } border`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Top glow on hover */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r transition-opacity duration-300 ${
                source.type === 'usdt'
                  ? 'from-green-500 to-emerald-500'
                  : 'from-yellow-500 to-amber-500'
              } ${hoveredCard === i ? 'opacity-100' : 'opacity-0'}`} />

              <div className="text-2xl mb-2">{source.icon}</div>
              <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">{source.title}</h4>
              <div className={`text-sm font-black mb-1 ${
                source.type === 'usdt' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {source.amount}
              </div>
              <p className="text-[10px] text-gray-500 line-clamp-1">{source.desc}</p>

              {/* Type Badge */}
              <div className={`absolute top-3 right-3 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider ${
                source.type === 'usdt'
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-yellow-500/15 text-yellow-400'
              }`}>
                {source.type.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* ROI Quick View */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-xs">📊</span>
            Team Size vs USDT Income
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {ROI_DATA.map((r, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition group">
                <div className="text-lg font-black text-white group-hover:scale-110 transition">{r.members}</div>
                <div className="text-[10px] text-gray-500 mb-1">members</div>
                <div className={`text-xs font-bold ${r.color}`}>{r.usdt}</div>
                <div className="text-[10px] text-gray-500">{r.inr}</div>
                <div className={`text-xs font-black mt-1 ${r.color}`}>{r.roi}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              ⏱️ <span className="text-green-400 font-bold">Breakeven:</span> Just 6 members = ₹1,000 back! 7వ member → PURE PROFIT 💰
            </p>
          </div>
        </div>

        {/* CTA — View Full Guide */}
        <div className="relative text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <a
              href="/bharos-earning-guide.html"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl font-bold text-black text-sm hover:shadow-xl hover:shadow-yellow-500/25 hover:scale-105 transition-all duration-300"
            >
              <span className="text-lg">📄</span>
              View Full Earning Guide
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>

              {/* Shine effect */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </div>
            </a>
            <p className="text-[11px] text-gray-500">
              📄 Editable • 🖨️ Printable • 📱 10 Languages • 📸 Save as Image
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
