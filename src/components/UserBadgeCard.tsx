import { getUserBadge, getNextBadge, getBadgeProgress, BADGE_LEVELS } from "../lib/badges"
import { Trophy } from "lucide-react"

interface Props {
  brsBalance: number
}

export default function UserBadgeCard({ brsBalance }: Props) {
  const badge = getUserBadge(brsBalance)
  const next = getNextBadge(brsBalance)
  const progress = getBadgeProgress(brsBalance)
  const currentIndex = BADGE_LEVELS.findIndex(b => b.id === badge.id)

  return (
    <div className="relative mb-6 group">
      <div
        className={`absolute -inset-[1px] bg-gradient-to-r ${badge.gradient} opacity-20 rounded-2xl blur-sm group-hover:blur-md transition-all`}
      />
      <div className={`relative bg-[#0d1117]/90 backdrop-blur-xl border ${badge.border} rounded-2xl p-5 overflow-hidden`}>

        {/* Ambient glow */}
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20"
          style={{ backgroundColor: badge.color }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: badge.color }} />
            <span className="text-sm font-medium text-gray-300">Your Level</span>
          </div>
          <span className="text-[10px] text-gray-500">{brsBalance} BRS Total</span>
        </div>

        {/* Badge Display */}
        <div className="flex items-center gap-4 relative z-10 mb-4">
          {/* Badge Icon - Animated */}
          <div className="relative">
            <div
              className="absolute -inset-2 rounded-full blur-md animate-pulse"
              style={{ backgroundColor: badge.color + '30' }}
            />
            <div
              className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center text-3xl shadow-lg ${badge.glow}`}
            >
              {badge.emoji}
            </div>
          </div>

          <div className="flex-1">
            <h3
              className="text-xl font-black"
              style={{ color: badge.color }}
            >
              {badge.name}
            </h3>
            <p className="text-xs text-gray-500">{badge.description}</p>
          </div>
        </div>

        {/* Level Progress */}
        {next && (
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-gray-500">
                Next: <span style={{ color: next.color }}>{next.emoji} {next.name}</span>
              </span>
              <span className="text-[10px] font-bold" style={{ color: badge.color }}>
                {progress}%
              </span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${badge.gradient} transition-all duration-1000 relative`}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
              </div>
            </div>
            <p className="text-[9px] text-gray-600 mt-1">
              Need {next.minBRS - brsBalance} more BRS to reach {next.name}
            </p>
          </div>
        )}

        {/* Max Level */}
        {!next && (
          <div className="relative z-10 text-center py-2 rounded-xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-purple-500/10 border border-orange-500/20">
            <span className="text-xs font-bold bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent">
              👑 Maximum Level Achieved!
            </span>
          </div>
        )}

        {/* Mini Level Dots */}
        <div className="flex items-center justify-center gap-2 mt-4 relative z-10">
          {BADGE_LEVELS.map((level, i) => (
            <div
              key={level.id}
              className={`relative group/dot`}
              title={`${level.name} (${level.minBRS}+ BRS)`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border transition-all cursor-pointer ${
                  i <= currentIndex
                    ? `border-white/20 shadow-sm`
                    : 'border-white/5 opacity-30'
                }`}
                style={{
                  backgroundColor: i <= currentIndex ? level.color + '30' : 'transparent',
                  borderColor: i <= currentIndex ? level.color + '50' : undefined,
                }}
              >
                {level.emoji}
              </div>
              {i === currentIndex && (
                <div
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: level.color }}
                />
              )}
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer { animation: shimmer 3s infinite; }
      `}</style>
    </div>
  )
}
