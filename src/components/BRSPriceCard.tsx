import { Coins, TrendingUp, ArrowUpRight } from 'lucide-react'

// BRS Price simulation data for chart display
const priceHistory = [
  { phase: 'Launch', price: 0.005, label: 'Current' },
  { phase: 'Phase 2', price: 0.05, label: '5K Users' },
  { phase: 'Phase 3', price: 0.25, label: 'DEX Listed' },
  { phase: 'Phase 4', price: 0.75, label: 'Staking' },
  { phase: 'Phase 5', price: 1.50, label: 'CEX Listed' },
]

const currentPrice = 0.005

export default function BRSPriceCard() {
  const maxPrice = Math.max(...priceHistory.map(p => p.price))

  return (
    <div className="relative mb-6">
      <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/10 via-green-500/10 to-cyan-500/10 rounded-xl blur-sm" />
      <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center">
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">BRS / USD</p>
              <p className="text-[10px] text-gray-500">Bharos Coin</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-400">${currentPrice.toFixed(3)}</p>
            <div className="flex items-center gap-1 justify-end">
              <ArrowUpRight className="w-3 h-3 text-green-400" />
              <span className="text-[10px] text-green-400 font-medium">Phase 1</span>
            </div>
          </div>
        </div>

        {/* Price Growth Roadmap Chart */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Price Growth Roadmap</p>
          </div>

          {/* Bars */}
          <div className="flex items-end gap-3 h-28">
            {priceHistory.map((item, i) => {
              const height = Math.max((item.price / maxPrice) * 100, 8)
              const isActive = i === 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-bold ${isActive ? 'text-green-400' : 'text-gray-500'}`}>
                    ${item.price}
                  </span>
                  <div className="w-full relative">
                    <div
                      className={`w-full rounded-t-md transition-all duration-700 ${
                        isActive
                          ? 'bg-gradient-to-t from-green-500 to-green-400 shadow-lg shadow-green-500/20'
                          : 'bg-gradient-to-t from-white/10 to-white/5'
                      }`}
                      style={{ height: `${height}px` }}
                    />
                    {isActive && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-[9px] font-medium ${isActive ? 'text-green-400' : 'text-gray-600'}`}>
                      {item.phase}
                    </p>
                    <p className="text-[8px] text-gray-600">{item.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Info */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-gray-500">BSC Mainnet</span>
          </div>
          <span className="text-[10px] text-gray-500">Target: $1.50</span>
        </div>

      </div>
    </div>
  )
}
