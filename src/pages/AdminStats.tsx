import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { Users, UserCheck, DollarSign, TrendingDown, TrendingUp, Coins, BarChart3, Calendar, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react"

interface DayData {
  date: string
  count: number
  label: string
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

  useEffect(() => {
    loadStats()
    const interval = setInterval(() => loadStats(), 15000)
    return () => clearInterval(interval)
  }, [])

  async function loadStats() {
    const [usersSnap, depSnap, withSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "deposits")),
      getDocs(collection(db, "withdrawals"))
    ])

    let totalUsers = 0
    let activeUsers = 0
    let totalBRS = 0
    let totalUSDT = 0
    let todayCount = 0

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
          createdAt: createdAt,
        })
      }
    })

    setUsers(totalUsers)
    setActive(activeUsers)
    setBrsSupply(totalBRS)
    setTodaySignups(todayCount)
    setTotalUSDTInSystem(totalUSDT)

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
  }

  const maxSignup = Math.max(...dailySignups.map(d => d.count), 1)

  const statCards = [
    { label: "Total Users", value: users, icon: Users, color: "cyan", sub: `+${todaySignups} today` },
    { label: "Active Members", value: active, icon: UserCheck, color: "green", sub: `${users > 0 ? ((active / users) * 100).toFixed(0) : 0}% activated` },
    { label: "Total Revenue", value: `$${deposits}`, icon: DollarSign, color: "amber", sub: `+$${todayDeposits} today` },
    { label: "Total Withdraw", value: `$${withdraws}`, icon: TrendingDown, color: "red", sub: `${pendingWithdraws} pending` },
    { label: "Net Profit", value: `$${profit}`, icon: TrendingUp, color: "emerald", sub: profit > 0 ? "Profitable ✓" : "Breakeven" },
    { label: "BRS Distributed", value: brsSupply.toLocaleString(), icon: Coins, color: "purple", sub: `${(brsSupply / 1500000000 * 100).toFixed(4)}% of supply` },
  ]

  const colorMap: Record<string, { bg: string, border: string, text: string, glow: string }> = {
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", glow: "from-cyan-500/10" },
    green: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400", glow: "from-green-500/10" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", glow: "from-amber-500/10" },
    red: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", glow: "from-red-500/10" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", glow: "from-emerald-500/10" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", glow: "from-purple-500/10" },
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
                      <p className="text-white text-xs font-medium">{u.name}</p>
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
              <span className="text-green-400 font-bold text-lg">${deposits}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-1">Payouts (Withdraws)</p>
            <div className="flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-red-400" />
              <span className="text-red-400 font-bold text-lg">${withdraws}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-1">USDT in User Wallets</p>
            <span className="text-amber-400 font-bold text-lg">${totalUSDTInSystem.toFixed(2)}</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-1">Net Profit</p>
            <span className={`font-bold text-lg ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${profit}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}