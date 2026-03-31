import { getUser } from "../lib/session"
import { useEffect, useState } from "react"
import { navigate } from "../lib/router"
import { db } from "../lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import Navbar from "../components/Navbar"
import {
  STAKE_PLANS,
  calculateReward,
  getDaysRemaining,
  getProgress,
  createStake,
  withdrawStake,
  loadUserStakes,
  type StakePlan,
  type StakeRecord,
} from "../lib/staking"
import { Lock, Unlock, TrendingUp, Coins, Timer, Sparkles, AlertTriangle, CheckCircle2, Clock, Flame, X, ShieldAlert } from "lucide-react"

export default function Staking() {
  const email = getUser()

  const [brsBalance, setBrsBalance] = useState(0)
  const [brsStaked, setBrsStaked] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<StakePlan | null>(null)
  const [stakeAmount, setStakeAmount] = useState("")
  const [stakes, setStakes] = useState<StakeRecord[]>([])
  const [staking, setStaking] = useState(false)
  const [withdrawing, setWithdrawing] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState("")
  const [withdrawModal, setWithdrawModal] = useState<{ stakeId: string; stake: StakeRecord; daysServed: number; proportional: number; earlyReward: number; isEarly: boolean } | null>(null)

  useEffect(() => {
    if (!email) { navigate("/auth", true); return }
    loadData()
  }, [])

  const loadData = async () => {
    if (!email) return
    try {
      const userRef = doc(db, "users", email)
      const snap = await getDoc(userRef)
      if (snap.exists()) {
        const data: any = snap.data()
        setBrsBalance(data.brsBalance || 0)
        setBrsStaked(data.brsStaked || 0)
      }
      const userStakes = await loadUserStakes(email)
      setStakes(userStakes)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const handleStake = async () => {
    if (!email || !selectedPlan || staking) return
    const amount = parseFloat(stakeAmount)
    if (isNaN(amount) || amount < selectedPlan.minStake || amount > brsBalance) return
    setStaking(true)
    const ok = await createStake(email, amount, selectedPlan)
    if (ok) {
      setSuccessMsg(`✅ ${amount} BRS staked for ${selectedPlan.lockDays} days!`)
      setStakeAmount(""); setSelectedPlan(null)
      await loadData()
      setTimeout(() => setSuccessMsg(""), 4000)
    }
    setStaking(false)
  }

  const handleWithdraw = (stakeId: string) => {
    if (!email || withdrawing) return
    const stake = stakes.find(s => s.id === stakeId)
    if (!stake) return
    const daysLeft = getDaysRemaining(stake.unlocksAt)
    const isEarly = daysLeft > 0
    const daysServed = stake.lockDays - daysLeft
    const proportional = Math.round((stake.rewardAmount * daysServed) / stake.lockDays * 100) / 100
    const earlyReward = isEarly ? Math.floor(proportional * 0.5) : stake.rewardAmount

    if (isEarly) {
      setWithdrawModal({ stakeId, stake, daysServed, proportional, earlyReward, isEarly })
    } else {
      confirmWithdraw(stakeId)
    }
  }

  const confirmWithdraw = async (stakeId: string) => {
    if (!email) return
    setWithdrawModal(null)
    setWithdrawing(stakeId)
    const ok = await withdrawStake(stakeId, email)
    if (ok) {
      setSuccessMsg("✅ Stake withdrawn successfully!")
      await loadData()
      setTimeout(() => setSuccessMsg(""), 4000)
    }
    setWithdrawing(null)
  }

  const previewReward = selectedPlan && stakeAmount
    ? calculateReward(parseFloat(stakeAmount) || 0, selectedPlan.apy, selectedPlan.lockDays) : 0

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050816]">
      <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  )

  const activeStakes = stakes.filter(s => s.status === "active")
  const completedStakes = stakes.filter(s => s.status !== "active")

  const glassCard = "bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl border border-white/[0.08] rounded-2xl"
  const neonGlow = (color: string) => `0 0 20px ${color}20, 0 0 40px ${color}10, inset 0 1px 0 rgba(255,255,255,0.05)`

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <Navbar />

      {/* Ambient background glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-200px] left-[-100px] w-[400px] h-[400px] rounded-full bg-purple-500/[0.04] blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">

        {/* Success toast */}
        {successMsg && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-2xl text-sm font-semibold text-white animate-[fadeSlide_0.3s_ease-out]"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 8px 32px rgba(16,185,129,0.4)' }}>
            {successMsg}
          </div>
        )}

        {/* ═══ HERO SECTION ═══ */}
        <div className={`${glassCard} p-6 mb-6 relative overflow-hidden`}
          style={{ boxShadow: neonGlow('#06b6d4') }}>

          {/* Animated glow orb */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full animate-pulse"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)' }} />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full animate-pulse"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.08), transparent 70%)', animationDelay: '1s' }} />

          <div className="flex items-center gap-3 mb-5 relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                BRS Staking
              </h1>
              <p className="text-[11px] text-gray-500">Lock tokens • Earn rewards • Build wealth</p>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-3 gap-3 relative">
            {[
              { label: "Available", value: brsBalance, color: "#fbbf24", icon: <Coins className="w-3.5 h-3.5" /> },
              { label: "Staked", value: brsStaked, color: "#22d3ee", icon: <Lock className="w-3.5 h-3.5" /> },
              { label: "Active", value: activeStakes.length, color: "#34d399", icon: <TrendingUp className="w-3.5 h-3.5" />, suffix: "Stakes" },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-4 border border-white/[0.06] relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${item.color}08, ${item.color}03)` }}>
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full"
                  style={{ background: `radial-gradient(circle, ${item.color}10, transparent 70%)` }} />
                <div className="flex items-center gap-1.5 mb-2">
                  <span style={{ color: item.color }}>{item.icon}</span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">{item.label}</span>
                </div>
                <div className="text-xl font-black" style={{ color: item.color }}>{item.value.toLocaleString()}</div>
                <div className="text-[10px] text-gray-600">{item.suffix || "BRS"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ PLANS ═══ */}
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <h2 className="text-lg font-bold">Choose a Plan</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {STAKE_PLANS.map(plan => {
            const isSelected = selectedPlan?.id === plan.id
            return (
              <button key={plan.id} onClick={() => setSelectedPlan(isSelected ? null : plan)}
                className={`${glassCard} p-5 text-left transition-all duration-300 relative overflow-hidden group`}
                style={{
                  borderColor: isSelected ? `${plan.color}60` : 'rgba(255,255,255,0.06)',
                  boxShadow: isSelected ? `0 0 25px ${plan.color}20, 0 0 50px ${plan.color}08` : 'none',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}>

                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${plan.color}08, transparent 70%)` }} />

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}88)` }}>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                  </div>
                )}

                <div className="text-3xl mb-1">{plan.emoji}</div>
                <div className="text-base font-bold mb-0.5" style={{ color: plan.color }}>{plan.name}</div>
                <div className="text-3xl font-black mb-1 relative">
                  {plan.apy}%
                  <span className="text-[10px] font-normal text-gray-500 ml-1">APY</span>
                </div>
                <div className="text-[11px] text-gray-500">{plan.lockDays} days lock</div>
                <div className="text-[10px] text-gray-600 mt-2 pt-2 border-t border-white/[0.05]">
                  Min: {plan.minStake} BRS
                </div>
              </button>
            )
          })}
        </div>

        {/* ═══ STAKE FORM ═══ */}
        {selectedPlan && (
          <div className={`${glassCard} p-6 mb-6 animate-[fadeSlide_0.3s_ease-out]`}
            style={{ boxShadow: neonGlow(selectedPlan.color) }}>

            <h3 className="text-base font-bold mb-5 flex items-center gap-2">
              <span className="text-xl">{selectedPlan.emoji}</span>
              Stake in <span style={{ color: selectedPlan.color }}>{selectedPlan.name}</span> Plan
            </h3>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="text-[11px] text-gray-500 mb-2 block uppercase tracking-wider font-semibold">Amount (BRS)</label>
              <div className="relative">
                <input type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)}
                  placeholder={`Min ${selectedPlan.minStake} BRS`}
                  className="w-full p-4 pr-20 bg-black/40 border border-white/10 rounded-xl text-white text-lg outline-none focus:border-cyan-500/40 transition-colors"
                />
                <button onClick={() => setStakeAmount(brsBalance.toString())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition">
                  MAX
                </button>
              </div>
            </div>

            {/* Reward Preview */}
            {previewReward > 0 && (
              <div className={`${glassCard} p-4 mb-4`}
                style={{ borderColor: `${selectedPlan.color}20` }}>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "🔒 You Stake", value: `${parseFloat(stakeAmount).toLocaleString()} BRS`, color: "#fff" },
                    { label: "🎁 You Earn", value: `+${previewReward} BRS`, color: "#34d399" },
                    { label: "⏰ Lock Period", value: `${selectedPlan.lockDays} days`, color: "#fbbf24" },
                    { label: "💰 Total Return", value: `${(parseFloat(stakeAmount) + previewReward).toLocaleString()} BRS`, color: "#22d3ee" },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="text-[10px] text-gray-500 mb-1">{item.label}</div>
                      <div className="text-base font-bold" style={{ color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-[11px] text-amber-400/80 leading-relaxed">
                Early withdrawal before lock period ends: <strong>50% reward penalty</strong> (proportional to time served). Penalty BRS is burned 🔥
              </span>
            </div>

            {/* Stake Button */}
            <button onClick={handleStake}
              disabled={staking || !stakeAmount || parseFloat(stakeAmount) < selectedPlan.minStake || parseFloat(stakeAmount) > brsBalance}
              className="w-full py-4 rounded-xl text-base font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: `linear-gradient(135deg, ${selectedPlan.color}, ${selectedPlan.color}aa)`,
                color: '#000',
                boxShadow: `0 4px 20px ${selectedPlan.color}30`,
              }}>
              {staking ? "⏳ Staking..." : `🔒 Stake ${stakeAmount || '0'} BRS`}
            </button>
          </div>
        )}

        {/* ═══ ACTIVE STAKES ═══ */}
        {activeStakes.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-cyan-400" />
              <h2 className="text-lg font-bold">Active Stakes ({activeStakes.length})</h2>
            </div>

            {activeStakes.map(stake => {
              const progress = getProgress(stake.stakedAt, stake.unlocksAt)
              const daysLeft = getDaysRemaining(stake.unlocksAt)
              const plan = STAKE_PLANS.find(p => p.id === stake.planId)
              const color = plan?.color || '#22d3ee'
              const isComplete = daysLeft === 0

              return (
                <div key={stake.id} className={`${glassCard} p-5 mb-3 relative overflow-hidden`}
                  style={{ boxShadow: isComplete ? neonGlow('#34d399') : 'none', borderColor: isComplete ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)' }}>

                  {/* Complete glow bar */}
                  {isComplete && (
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: 'linear-gradient(to right, #34d399, #22d3ee, #a78bfa)' }} />
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{plan?.emoji}</span>
                        <span className="text-base font-bold" style={{ color }}>{stake.planName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isComplete ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/15'}`}>
                          {isComplete ? '✅ Ready to Claim' : `${daysLeft}d remaining`}
                        </span>
                      </div>
                      <div className="text-2xl font-black">{stake.amount.toLocaleString()} <span className="text-sm font-medium text-gray-500">BRS</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 mb-0.5">Reward</div>
                      <div className="text-lg font-bold text-emerald-400">+{stake.rewardAmount}</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="h-2 rounded-full bg-white/[0.04] mb-3 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${progress}%`,
                        background: isComplete ? 'linear-gradient(to right, #34d399, #22d3ee)' : `linear-gradient(to right, ${color}, ${color}66)`,
                      }} />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-600">{stake.apy}% APY • {stake.lockDays}d lock</span>
                    <button onClick={() => handleWithdraw(stake.id!)}
                      disabled={withdrawing === stake.id}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${isComplete ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20' : 'bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20'}`}>
                      {withdrawing === stake.id ? '⏳...' : (<><Unlock className="w-3.5 h-3.5" />{isComplete ? 'Claim Rewards' : 'Early Withdraw'}</>)}
                    </button>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ═══ HISTORY ═══ */}
        {completedStakes.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3 mt-8">
              <Clock className="w-4 h-4 text-gray-600" />
              <h2 className="text-base font-semibold text-gray-500">Stake History</h2>
            </div>
            {completedStakes.map(stake => (
              <div key={stake.id} className="bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3 mb-2 flex justify-between items-center opacity-50">
                <div>
                  <span className="text-sm font-semibold">{stake.amount} BRS</span>
                  <span className="text-[11px] text-gray-600 ml-2">{stake.planName} • {stake.lockDays}d</span>
                </div>
                <span className="text-[12px] text-emerald-400 font-medium">+{stake.rewardAmount} BRS</span>
              </div>
            ))}
          </>
        )}

        {/* Empty state */}
        {stakes.length === 0 && !selectedPlan && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-gray-700" />
            </div>
            <p className="text-gray-500 text-sm">No active stakes yet</p>
            <p className="text-gray-700 text-xs mt-1">Select a plan above to start earning!</p>
          </div>
        )}
      </div>

      {/* ═══ EARLY WITHDRAW MODAL ═══ */}
      {withdrawModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setWithdrawModal(null)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <div className="relative w-full max-w-sm animate-[fadeSlide_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className={`${glassCard} p-6 relative overflow-hidden`}
              style={{ boxShadow: '0 0 40px rgba(245,158,11,0.15), 0 0 80px rgba(245,158,11,0.05)' }}>

              {/* Warning glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.1), transparent 70%)' }} />

              {/* Close button */}
              <button onClick={() => setWithdrawModal(null)} className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-400">Early Withdrawal</h3>
                  <p className="text-[11px] text-gray-500">50% penalty on earned rewards</p>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-2 mb-5">
                {[
                  { label: "⏰ Days Served", value: `${withdrawModal.daysServed} / ${withdrawModal.stake.lockDays} days`, color: "#fbbf24" },
                  { label: "📊 Proportional Reward", value: `${withdrawModal.proportional} BRS`, color: "#9ca3af" },
                  { label: "🔥 Penalty (Burned)", value: `-${Math.floor(withdrawModal.proportional * 0.5)} BRS`, color: "#ef4444" },
                  { label: "🎁 You Receive", value: `${withdrawModal.earlyReward} BRS`, color: "#34d399" },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[12px] text-gray-400">{row.label}</span>
                    <span className="text-[13px] font-bold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Total return */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/[0.06] to-blue-500/[0.06] border border-cyan-500/10 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">💰 Total Return</span>
                  <span className="text-xl font-black text-cyan-400">{(withdrawModal.stake.amount + withdrawModal.earlyReward).toLocaleString()} BRS</span>
                </div>
                <div className="text-[10px] text-gray-600 mt-1">Original stake: {withdrawModal.stake.amount} BRS + Reward: {withdrawModal.earlyReward} BRS</div>
              </div>

              {/* Burn notice */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.06] border border-red-500/10 mb-5">
                <Flame className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-[10px] text-red-400/80 leading-relaxed">
                  Penalty of <strong>{Math.floor(withdrawModal.proportional * 0.5)} BRS</strong> will be permanently burned from supply 🔥
                </span>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setWithdrawModal(null)}
                  className="py-3 rounded-xl text-sm font-semibold bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20 transition-all">
                  Cancel
                </button>
                <button onClick={() => confirmWithdraw(withdrawModal.stakeId)}
                  className="py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/20 transition-all active:scale-[0.97]">
                  ⚡ Withdraw Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
