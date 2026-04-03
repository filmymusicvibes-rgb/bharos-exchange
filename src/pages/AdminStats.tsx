import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { Users, UserCheck, DollarSign, TrendingDown, TrendingUp, Coins, BarChart3, Calendar, Clock, ArrowUpRight, ArrowDownRight, Layers, Gift, Building2 } from "lucide-react"

interface DayData {
  date: string
  count: number
  label: string
}

interface LevelDistribution {
  level: number
  amount: number
  count: number
  ratePerUser: number
}

export default function AdminStats() {

  const [users, setUsers] = useState(0)
  const [active, setActive] = useState(0)
  const [deposits, setDeposits] = useState(0)
  const [withdraws, setWithdraws] = useState(0)
  const [brsSupply, setBrsSupply] = useState(0)
  const [profit, setProfit] = useState(0)

  // New analytics
  const [todaySignups, setTodaySignups] = useState(0)
  const [todayDeposits, setTodayDeposits] = useState(0)
  const [pendingDeposits, setPendingDeposits] = useState(0)
  const [pendingWithdraws, setPendingWithdraws] = useState(0)
  const [dailySignups, setDailySignups] = useState<DayData[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [totalUSDTInSystem, setTotalUSDTInSystem] = useState(0)

  // Revenue Distribution
  const [levelDistributions, setLevelDistributions] = useState<LevelDistribution[]>([])
  const [totalLevelCommissions, setTotalLevelCommissions] = useState(0)
  const [specialRewards, setSpecialRewards] = useState({ direct10: 0, matrix: 0, trip: 0 })
  const [totalDistributed, setTotalDistributed] = useState(0)
  const [companyDirectCount, setCompanyDirectCount] = useState(0)

  useEffect(() => {
    loadStats()
    const interval = setInterval(() => loadStats(), 15000)
    return () => clearInterval(interval)
  }, [])

  async function loadStats() {
    const [usersSnap, depSnap, withSnap, txSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "deposits")),
      getDocs(collection(db, "withdrawals")),
      getDocs(collection(db, "transactions"))
    ])

    let totalUsers = 0
    let activeUsers = 0
    let totalBRS = 0
    let totalUSDT = 0
    let todayCount = 0
    let companyDirect = 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // For daily chart — last 7 days
    const dayMap: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      dayMap[key] = 0
    }

    const recentList: any[] = []

    usersSnap.forEach((doc) => {
      const data: any = doc.data()
      totalUsers++
      if (data.status === "active") activeUsers++
      totalBRS += data.brsBalance || 0
      totalUSDT += data.usdtBalance || 0

      // 👑 Company Direct tracking
      if (data.referredBy === "BRS44447") companyDirect++


      // Created date
      const createdAt = data.createdAt?.toDate?.()
      if (createdAt) {
        if (createdAt >= today) todayCount++
        const dayKey = createdAt.toISOString().split('T')[0]
        if (dayMap[dayKey] !== undefined) dayMap[dayKey]++

        recentList.push({
          email: data.email || doc.id,
          name: data.fullName || data.userName || 'N/A',
          status: data.status,
          referredBy: data.referredBy || '',

          createdAt: createdAt,
        })
      }
    })

    setUsers(totalUsers)
    setActive(activeUsers)
    setBrsSupply(totalBRS)
    setTodaySignups(todayCount)
    setTotalUSDTInSystem(totalUSDT)
    setCompanyDirectCount(companyDirect)


    // Daily signups chart data
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const chartData: DayData[] = Object.entries(dayMap).map(([date, count]) => {
      const d = new Date(date)
      return { date, count, label: dayNames[d.getDay()] }
    })
    setDailySignups(chartData)

    // Recent users (latest 5)
    recentList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    setRecentUsers(recentList.slice(0, 5))

    // Deposits
    let totalDeposits = 0
    let todayDep = 0
    let pendingDep = 0

    depSnap.forEach((doc) => {
      const data: any = doc.data()
      if (data.status === "approved" || data.status === "verified") {
        totalDeposits += Number(data.amount || 0)
      }
      if (data.status === "pending") pendingDep++
      const depDate = data.createdAt?.toDate?.()
      if (depDate && depDate >= today && (data.status === "approved" || data.status === "verified")) {
        todayDep += Number(data.amount || 0)
      }
    })

    setDeposits(totalDeposits)
    setTodayDeposits(todayDep)
    setPendingDeposits(pendingDep)

    // Withdrawals
    let totalWithdraw = 0
    let pendingWith = 0

    withSnap.forEach((doc) => {
      const data: any = doc.data()
      if (data.status === "approved") totalWithdraw += Number(data.amount || 0)
      if (data.status === "pending") pendingWith++
    })

    setWithdraws(totalWithdraw)
    setPendingWithdraws(pendingWith)
    setProfit(totalDeposits - totalWithdraw)

    // === REVENUE DISTRIBUTION — parse transactions for level commissions ===
    const levelRates = [2, 0.8, 0.75, 0.65, 0.55, 0.50, 0.45, 0.40, 0.35, 0.30, 0.25, 1]
    const levelAmounts: number[] = new Array(12).fill(0)
    const levelCounts: number[] = new Array(12).fill(0)
    let direct10Total = 0
    let matrixTotal = 0
    let tripTotal = 0

    txSnap.forEach((doc) => {
      const data: any = doc.data()
      const desc = (data.description || '').toLowerCase()
      const amt = Number(data.amount || 0)

      // Level commissions: "Level X referral commission"
      const levelMatch = desc.match(/level\s+(\d+)\s+referral\s+commission/)
      if (levelMatch) {
        const lvl = parseInt(levelMatch[1])
        if (lvl >= 1 && lvl <= 12) {
          levelAmounts[lvl - 1] += amt
          levelCounts[lvl - 1]++
        }
        return
      }

      // Special rewards
      if (desc.includes('direct 10')) direct10Total += amt
      else if (desc.includes('matrix reward')) matrixTotal += amt
      else if (desc.includes('trip achieved')) tripTotal += amt
    })

    const distributions: LevelDistribution[] = levelRates.map((rate, i) => ({
      level: i + 1,
      amount: levelAmounts[i],
      count: levelCounts[i],
      ratePerUser: rate
    }))

    const totalLvlComm = levelAmounts.reduce((a, b) => a + b, 0)
    const totalSpecial = direct10Total + matrixTotal + tripTotal
    const totalDist = totalLvlComm + totalSpecial

    setLevelDistributions(distributions)
    setTotalLevelCommissions(totalLvlComm)
    setSpecialRewards({ direct10: direct10Total, matrix: matrixTotal, trip: tripTotal })
    setTotalDistributed(totalDist)
  }

  const maxSignup = Math.max(...dailySignups.map(d => d.count), 1)

  const statCards = [
    { label: "Total Users", value: users, icon: Users, color: "cyan", sub: `+${todaySignups} today` },
    { label: "Active Members", value: active, icon: UserCheck, color: "green", sub: `${users > 0 ? ((active / users) * 100).toFixed(0) : 0}% activated` },
    { label: "Total Revenue", value: `$${deposits.toFixed(2)}`, icon: DollarSign, color: "amber", sub: `+$${todayDeposits.toFixed(2)} today` },
    { label: "Total Withdraw", value: `$${withdraws.toFixed(2)}`, icon: TrendingDown, color: "red", sub: `${pendingWithdraws} pending` },
    { label: "Net Profit", value: `$${profit.toFixed(2)}`, icon: TrendingUp, color: "emerald", sub: profit > 0 ? "Profitable ✓" : "Breakeven" },
    { label: "BRS Distributed", value: brsSupply.toLocaleString(), icon: Coins, color: "purple", sub: `${(brsSupply / 1500000000 * 100).toFixed(4)}% of supply` },
    { label: "👑 Company Direct", value: companyDirectCount, icon: Building2, color: "gold", sub: `${users > 0 ? ((companyDirectCount / users) * 100).toFixed(0) : 0}% of total` },
  ]

  const colorMap: Record<string, { bg: string, border: string, text: string, glow: string }> = {
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", glow: "from-cyan-500/10" },
    green: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400", glow: "from-green-500/10" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", glow: "from-amber-500/10" },
    red: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", glow: "from-red-500/10" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", glow: "from-emerald-500/10" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", glow: "from-purple-500/10" },
    gold: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400", glow: "from-yellow-500/10" },
  }

  const timeAgo = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Analytics</h2>
            <p className="text-xs text-gray-500">Real-time platform overview</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Live</span>
        </div>
      </div>

      {/* PENDING ALERTS */}
      {(pendingDeposits > 0 || pendingWithdraws > 0) && (
        <div className="flex gap-3 flex-wrap">
          {pendingDeposits > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 animate-pulse">
              <span className="text-yellow-400 text-sm font-semibold">⚡ {pendingDeposits} pending deposit{pendingDeposits > 1 ? 's' : ''}</span>
            </div>
          )}
          {pendingWithdraws > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 animate-pulse">
              <span className="text-orange-400 text-sm font-semibold">💸 {pendingWithdraws} pending withdrawal{pendingWithdraws > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* STAT CARDS - 3 COLUMN */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          const c = colorMap[card.color] || colorMap.cyan
          return (
            <div key={i} className="relative group">
              <div className={`absolute -inset-[1px] bg-gradient-to-r ${c.glow} to-transparent rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className={`relative ${c.bg} border ${c.border} rounded-xl p-4 hover:bg-opacity-20 transition-all`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-gray-400 font-medium">{card.label}</p>
                  <Icon className={`w-4 h-4 ${c.text} opacity-50`} />
                </div>
                <p className={`text-2xl font-bold ${c.text}`}>{card.value}</p>
                <p className="text-[10px] text-gray-500 mt-1">{card.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* CHART + RECENT USERS — SIDE BY SIDE */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* DAILY SIGNUPS CHART */}
        <div className="bg-[#0d1117]/80 border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <p className="text-sm font-semibold text-white">Signups — Last 7 Days</p>
          </div>

          <div className="flex items-end gap-2 h-32">
            {dailySignups.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-cyan-400 font-medium">
                  {day.count > 0 ? day.count : ''}
                </span>
                <div className="w-full relative">
                  <div
                    className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-md transition-all duration-500 min-h-[4px]"
                    style={{ height: `${Math.max((day.count / maxSignup) * 100, 4)}px` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500">{day.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between">
            <span className="text-[10px] text-gray-500">Total: {dailySignups.reduce((a, b) => a + b.count, 0)}</span>
            <span className="text-[10px] text-gray-500">Avg: {(dailySignups.reduce((a, b) => a + b.count, 0) / 7).toFixed(1)}/day</span>
          </div>
        </div>

        {/* RECENT SIGNUPS */}
        <div className="bg-[#0d1117]/80 border border-white/8 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold text-white">Recent Signups</p>
          </div>

          {recentUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">No users yet</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((u, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      u.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {u.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white text-xs font-medium">
                        {u.name}
                        {u.referredBy === 'BRS44447' && <span className="ml-1.5 text-yellow-400" title="Company Direct">👑</span>}
                      </p>
                      <p className="text-gray-500 text-[10px]">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] px-2 py-0.5 rounded-full ${
                      u.status === 'active'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {u.status || 'inactive'}
                    </div>
                    <p className="text-[9px] text-gray-600 mt-0.5">{timeAgo(u.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FINANCIAL SUMMARY BAR  */}
      <div className="bg-[#0d1117]/80 border border-white/8 rounded-xl p-5">
        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-400" />
          Financial Summary
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-gray-500 mb-1">Revenue (Deposits)</p>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-green-400" />
              <span className="text-green-400 font-bold text-lg">${deposits.toFixed(2)}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-1">Payouts (Withdraws)</p>
            <div className="flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-red-400" />
              <span className="text-red-400 font-bold text-lg">${withdraws.toFixed(2)}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-1">USDT in User Wallets</p>
            <span className="text-amber-400 font-bold text-lg">${totalUSDTInSystem.toFixed(2)}</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-1">Net Profit</p>
            <span className={`font-bold text-lg ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${profit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ===== REVENUE DISTRIBUTION BREAKDOWN ===== */}
      <div className="bg-[#0d1117]/80 border border-white/8 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Revenue Distribution Breakdown
          </p>
          <div className="text-[10px] text-gray-500">
            Per activation: $12 → Levels: $8 max
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 mb-1">Total Distributed</p>
            <p className="text-lg font-bold text-purple-400">${totalDistributed.toFixed(2)}</p>
            <p className="text-[9px] text-gray-600">{deposits > 0 ? ((totalDistributed / deposits) * 100).toFixed(1) : '0'}% of revenue</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 mb-1">Level Commissions</p>
            <p className="text-lg font-bold text-cyan-400">${totalLevelCommissions.toFixed(2)}</p>
            <p className="text-[9px] text-gray-600">12-level MLM payouts</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 mb-1">Special Rewards</p>
            <p className="text-lg font-bold text-amber-400">${(specialRewards.direct10 + specialRewards.matrix + specialRewards.trip).toFixed(2)}</p>
            <p className="text-[9px] text-gray-600">Direct10 + Matrix + Trip</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Company Remaining</p>
            <p className="text-lg font-bold text-emerald-400">${(deposits - totalDistributed - withdraws).toFixed(2)}</p>
            <p className="text-[9px] text-gray-600">{deposits > 0 ? (((deposits - totalDistributed - withdraws) / deposits) * 100).toFixed(1) : '0'}% retained</p>
          </div>
        </div>

        {/* Level-wise Breakdown */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-3 font-medium">Level-wise Commission Breakdown</p>
          <div className="space-y-2">
            {levelDistributions.map((ld) => {
              const maxAmount = Math.max(...levelDistributions.map(d => d.amount), 1)
              const barWidth = (ld.amount / maxAmount) * 100
              return (
                <div key={ld.level} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500 w-8 text-right font-mono">L{ld.level}</span>
                  <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(barWidth, ld.amount > 0 ? 2 : 0)}%`,
                        background: ld.level <= 3
                          ? 'linear-gradient(90deg, #22d3ee, #3b82f6)'
                          : ld.level <= 6
                            ? 'linear-gradient(90deg, #a78bfa, #8b5cf6)'
                            : ld.level <= 9
                              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                              : 'linear-gradient(90deg, #10b981, #059669)',
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-white font-semibold w-20 text-right">${ld.amount.toFixed(2)}</span>
                  <span className="text-[9px] text-gray-600 w-16 text-right">{ld.count} payouts</span>
                  <span className="text-[9px] text-gray-600 w-14 text-right">${ld.ratePerUser}/user</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Special Rewards Detail */}
        {(specialRewards.direct10 > 0 || specialRewards.matrix > 0 || specialRewards.trip > 0) && (
          <div className="border-t border-white/5 pt-4">
            <p className="text-xs text-gray-400 mb-3 font-medium flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              Special Rewards Paid
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-lg p-2.5 text-center">
                <p className="text-[9px] text-gray-500 mb-1">Direct 10 ($20)</p>
                <p className="text-sm font-bold text-cyan-400">${specialRewards.direct10.toFixed(2)}</p>
                <p className="text-[9px] text-gray-600">{specialRewards.direct10 > 0 ? Math.round(specialRewards.direct10 / 20) : 0} users</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2.5 text-center">
                <p className="text-[9px] text-gray-500 mb-1">Matrix 3+9+27 ($30)</p>
                <p className="text-sm font-bold text-purple-400">${specialRewards.matrix.toFixed(2)}</p>
                <p className="text-[9px] text-gray-600">{specialRewards.matrix > 0 ? Math.round(specialRewards.matrix / 30) : 0} users</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2.5 text-center">
                <p className="text-[9px] text-gray-500 mb-1">Trip Achievement</p>
                <p className="text-sm font-bold text-amber-400">${specialRewards.trip.toFixed(2)}</p>
                <p className="text-[9px] text-gray-600">Milestone bonus</p>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Flow Visual */}
        <div className="border-t border-white/5 pt-4 mt-4">
          <p className="text-xs text-gray-400 mb-2 font-medium">Revenue Flow</p>
          <div className="h-4 rounded-full overflow-hidden flex bg-white/5">
            {deposits > 0 && (
              <>
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                  style={{ width: `${(totalLevelCommissions / deposits) * 100}%` }}
                  title={`Level Commissions: $${totalLevelCommissions.toFixed(2)}`}
                />
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                  style={{ width: `${((specialRewards.direct10 + specialRewards.matrix + specialRewards.trip) / deposits) * 100}%` }}
                  title={`Special Rewards: $${(specialRewards.direct10 + specialRewards.matrix + specialRewards.trip).toFixed(2)}`}
                />
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all"
                  style={{ width: `${(withdraws / deposits) * 100}%` }}
                  title={`Withdrawals: $${withdraws.toFixed(2)}`}
                />
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all"
                  style={{ width: `${Math.max(((deposits - totalDistributed - withdraws) / deposits) * 100, 0)}%` }}
                  title={`Company: $${(deposits - totalDistributed - withdraws).toFixed(2)}`}
                />
              </>
            )}
          </div>
          <div className="flex justify-between mt-2 text-[9px] flex-wrap gap-y-1">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" />Level Comm ({deposits > 0 ? ((totalLevelCommissions / deposits) * 100).toFixed(1) : 0}%)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Rewards ({deposits > 0 ? (((specialRewards.direct10 + specialRewards.matrix + specialRewards.trip) / deposits) * 100).toFixed(1) : 0}%)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Withdrawals ({deposits > 0 ? ((withdraws / deposits) * 100).toFixed(1) : 0}%)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Company ({deposits > 0 ? (Math.max(((deposits - totalDistributed - withdraws) / deposits) * 100, 0)).toFixed(1) : 0}%)</span>
          </div>
        </div>
      </div>

    </div>
  )
}