import { navigate } from "../lib/router"
import Navbar from "../components/Navbar"
import { Lock, TrendingUp, Coins, Timer, Sparkles, ArrowLeft, Shield } from "lucide-react"

export default function Staking() {

  const stakingFeatures = [
    { icon: Coins, title: "8% - 40% APY", desc: "Earn rewards based on your lock duration", color: "cyan" },
    { icon: Timer, title: "Flexible Plans", desc: "30, 60, 90, or 180-day staking periods", color: "amber" },
    { icon: TrendingUp, title: "Daily Rewards", desc: "Proportional rewards distributed every day", color: "green" },
    { icon: Shield, title: "Secure & Safe", desc: "Smart contract governed on BSC network", color: "purple" },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">

      {/* AMBIENT BACKGROUND */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-amber-500/5 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 blur-[150px] rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/3 blur-[100px] rounded-full" />

      <Navbar />

      <div className="relative z-10 px-4 max-w-2xl mx-auto py-12">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* MAIN CARD */}
        <div className="relative">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-purple-500/20 rounded-2xl blur-sm" />

          <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10 text-center">

            {/* LOCK ICON */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-amber-500/15 to-orange-500/15 rounded-full flex items-center justify-center border-2 border-amber-500/30">
                <Lock className="w-10 h-10 text-amber-400" />
              </div>
            </div>

            {/* TITLE */}
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-3">
              Staking — Coming Soon
            </h1>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-2">
              BRS Staking will be available in <span className="text-amber-400 font-semibold">Phase 4</span> when we reach 20,000 users.
            </p>

            {/* PHASE BADGE */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Phase 4 • 20,000 Users Target</span>
            </div>

            {/* FEATURES GRID */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {stakingFeatures.map((feat, i) => {
                const Icon = feat.icon
                const colorMap: Record<string, string> = {
                  cyan: "from-cyan-500/15 to-cyan-500/5 border-cyan-500/20 text-cyan-400",
                  amber: "from-amber-500/15 to-amber-500/5 border-amber-500/20 text-amber-400",
                  green: "from-green-500/15 to-green-500/5 border-green-500/20 text-green-400",
                  purple: "from-purple-500/15 to-purple-500/5 border-purple-500/20 text-purple-400",
                }
                const colors = colorMap[feat.color] || colorMap.cyan

                return (
                  <div key={i} className={`bg-gradient-to-br ${colors.split(' ').slice(0, 2).join(' ')} border ${colors.split(' ')[2]} rounded-xl p-4 text-left`}>
                    <Icon className={`w-5 h-5 ${colors.split(' ').pop()} mb-2`} />
                    <p className="text-white text-sm font-semibold mb-1">{feat.title}</p>
                    <p className="text-gray-500 text-[11px]">{feat.desc}</p>
                  </div>
                )
              })}
            </div>

            {/* PROGRESS BAR */}
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5 mb-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-400">Progress to Phase 4</p>
                <p className="text-xs text-amber-400 font-medium">Phase 1 Active</p>
              </div>
              <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/8">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 transition-all duration-1000"
                  style={{ width: '5%' }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-[10px] text-gray-500">Phase 1: 0-1K</p>
                <p className="text-[10px] text-gray-500">Phase 4: 20K Users</p>
              </div>
            </div>

            {/* CTA — Go Dashboard */}
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/20"
            >
              ← Back to Dashboard
            </button>

          </div>
        </div>

      </div>

      {/* Animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
