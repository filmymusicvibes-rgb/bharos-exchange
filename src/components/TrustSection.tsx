import { useEffect, useState, useRef } from 'react'
import { Shield, Users, Coins, Globe, CheckCircle, Lock, TrendingUp, Zap } from 'lucide-react'

export default function TrustSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const stats = [
    { icon: Users, value: '2,500+', label: 'Active Users', color: 'cyan' },
    { icon: Globe, value: '10+', label: 'Countries', color: 'green' },
    { icon: Coins, value: '1.5B', label: 'Total BRS Supply', color: 'amber' },
    { icon: TrendingUp, value: '$0.005', label: 'Current Price', color: 'purple' },
  ]

  const trustPoints = [
    { icon: Shield, title: 'BSC Smart Contract', desc: 'Verified & transparent on-chain' },
    { icon: Lock, title: '3% Auto-Burn', desc: 'Deflationary tokenomics built-in' },
    { icon: CheckCircle, title: '12-Level Referral', desc: 'USDT commissions paid instantly' },
    { icon: Zap, title: 'Auto-Verification', desc: 'Blockchain payment detection' },
  ]

  return (
    <section ref={ref} className="py-12 px-4 max-w-6xl mx-auto">

      {/* STATS COUNTER */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {stats.map((stat, i) => {
          const Icon = stat.icon
          const colorMap: Record<string, string> = {
            cyan: 'from-cyan-500/10 border-cyan-500/20 text-cyan-400',
            green: 'from-green-500/10 border-green-500/20 text-green-400',
            amber: 'from-amber-500/10 border-amber-500/20 text-amber-400',
            purple: 'from-purple-500/10 border-purple-500/20 text-purple-400',
          }
          const colors = colorMap[stat.color]
          return (
            <div
              key={i}
              className={`bg-gradient-to-br ${colors.split(' ')[0]} to-transparent border ${colors.split(' ')[1]} rounded-xl p-5 text-center transition-all duration-700`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <Icon className={`w-6 h-6 ${colors.split(' ')[2]} mx-auto mb-2`} />
              <p className={`text-2xl font-bold ${colors.split(' ')[2]}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* WHY TRUST BHAROS */}
      <div className={`transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
          Why Trust <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Bharos Exchange?</span>
        </h2>
        <p className="text-gray-500 text-center text-sm mb-8 max-w-lg mx-auto">
          Built with transparency, security, and community at its core
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {trustPoints.map((point, i) => {
            const Icon = point.icon
            return (
              <div
                key={i}
                className="flex items-start gap-4 bg-[#0d1117]/80 border border-white/8 rounded-xl p-5 hover:border-cyan-500/20 transition-all group"
                style={{ transitionDelay: `${400 + i * 100}ms` }}
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">{point.title}</p>
                  <p className="text-gray-500 text-xs">{point.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </section>
  )
}
