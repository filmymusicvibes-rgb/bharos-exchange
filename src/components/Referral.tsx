import { useEffect, useState, useRef } from 'react'
import { Network, TrendingUp, Users } from 'lucide-react'

function Referral() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const commissions = [
    { level: 1, amount: 2.00 },
    { level: 2, amount: 0.80 },
    { level: 3, amount: 0.75 },
    { level: 4, amount: 0.65 },
    { level: 5, amount: 0.55 },
    { level: 6, amount: 0.50 },
    { level: 7, amount: 0.45 },
    { level: 8, amount: 0.40 },
    { level: 9, amount: 0.35 },
    { level: 10, amount: 0.30 },
    { level: 11, amount: 0.25 },
    { level: 12, amount: 1.00 },
  ]

  return (
    <section id="referral" ref={sectionRef} className="relative py-20 px-4">
      <div className="max-w-6xl mx-auto">

        {/* TITLE */}
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              12-Level Referral System
            </span>
          </h2>

          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Earn commissions from your network across 12 levels. Every $12 USDT activation generates rewards for your upline.
          </p>

          {/* INFO CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <InfoCard icon={<Network className="w-8 h-8" />} title="12 Levels Deep" subtitle="Earn from 12 generations" delay="0ms" isVisible={isVisible} />
            <InfoCard icon={<TrendingUp className="w-8 h-8" />} title="$8 Total Rewards" subtitle="Per activation distributed" delay="150ms" isVisible={isVisible} />
            <InfoCard icon={<Users className="w-8 h-8" />} title="Instant Payouts" subtitle="Auto-credited to USDT wallet" delay="300ms" isVisible={isVisible} />
          </div>
        </div>

        {/* COMMISSION BOX */}
        <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">

            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Commission Distribution (from $12 activation)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">

              {commissions.map((item, index) => (
                <CommissionCard
                  key={item.level}
                  level={item.level}
                  amount={item.amount}
                  delay={`${index * 50}ms`}
                  isVisible={isVisible}
                />
              ))}

            </div>

            {/* TOTAL */}
            <div className="mt-8 p-5 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-xl">
              <p className="text-center text-gray-300">
                <span className="text-yellow-400 font-semibold">
                  Total commission distributed: $8.00
                </span>{" "}
                • Remaining $4.00 covers platform operations and development
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}

function InfoCard({ icon, title, subtitle, delay, isVisible }) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:scale-105 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: delay }}
    >
      <div className="text-cyan-400 mb-3 flex justify-center">{icon}</div>
      <p className="text-white font-bold text-lg mb-1">{title}</p>
      <p className="text-gray-400 text-sm">{subtitle}</p>
    </div>
  )
}

function CommissionCard({ level, amount, delay, isVisible }) {
  const isHighlighted = level === 1 || level === 12

  return (
    <div
      className={`relative bg-gradient-to-br from-[#16213e] to-[#1a1a2e] border rounded-lg p-4 hover:scale-105 transition-all duration-300 ${isHighlighted
        ? 'border-yellow-500/60 shadow-[0_0_20px_rgba(255,215,0,0.5)]'
        : 'border-cyan-500/20 hover:border-cyan-400/50'
        } ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
      style={{ transitionDelay: delay }}
    >
      <p className="text-gray-400 text-xs mb-1">Level {level}</p>
      <p className={`text-xl font-bold ${isHighlighted ? 'text-yellow-400' : 'text-cyan-400'}`}>
        ${amount.toFixed(2)}
      </p>
    </div>
  )
}

export default Referral