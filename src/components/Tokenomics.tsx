import { useEffect, useState, useRef } from 'react'
import {PieChart, Coins} from 'lucide-react'

function Tokenomics() {
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
    <section id="tokenomics" ref={sectionRef} className="relative py-8 lg:py-16 px-4 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Tokenomics
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Fair distribution model designed for long-term ecosystem growth
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Chart Visualization */}
          <div className={`transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}>
            <div className="relative w-full max-w-md mx-auto aspect-square">
              {/* Donut chart visual */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-2xl animate-pulse" />
              <div className="relative w-full h-full rounded-full border-[40px] border-cyan-500/30 flex items-center justify-center">
                <div className="text-center">
                  <Coins className="w-16 h-16 text-yellow-400 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-white">1.5B</p>
                  <p className="text-gray-400 text-sm">Total Supply</p>
                </div>
              </div>
              {/* Public allocation arc */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, #00d4ff 0%, #00d4ff 324deg, transparent 324deg)',
                  mask: 'radial-gradient(circle, transparent 60%, black 60%)',
                }}
              />
            </div>
          </div>

          {/* Distribution Details */}
          <div className={`space-y-6 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}>
            <TokenAllocation
              label="Public Allocation"
              percentage="90%"
              amount="1,350,000,000 BRS"
              color="from-cyan-400 to-blue-500"
            />
            <TokenAllocation
              label="Development Reserve"
              percentage="10%"
              amount="150,000,000 BRS"
              color="from-yellow-400 to-yellow-600"
            />

            <div className="mt-8 p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-xl">
              <p className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                <PieChart size={20} />
                Token Distribution Model
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">
                90% of tokens are allocated to the public through membership activations, referral rewards, and trading incentives. 
                The remaining 10% supports ongoing development, security audits, and ecosystem expansion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TokenAllocation({
  label,
  percentage,
  amount,
  color,
}: {
  label: string
  percentage: string
  amount: string
  color: string
}) {
  return (
    <div className="bg-[#1a1a2e] border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/40 transition-all duration-300">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-white">{label}</h3>
        <span className={`text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
          {percentage}
        </span>
      </div>
      <p className="text-gray-400 text-sm">{amount}</p>
      <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
          style={{ width: percentage }}
        />
      </div>
    </div>
  )
}

export default Tokenomics
