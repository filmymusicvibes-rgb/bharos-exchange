import { getUser, setUser, removeUser } from "../lib/session"
import { useState, useEffect } from 'react'
import { db } from "../lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { navigate } from "../lib/router"
import { Users, DollarSign, TrendingUp, Award } from 'lucide-react'
import Navbar from "@/components/Navbar"

const COMMISSION_STRUCTURE = [
  { level: 1, commission: 2 },
  { level: 2, commission: 0.8 },
  { level: 3, commission: 0.75 },
  { level: 4, commission: 0.65 },
  { level: 5, commission: 0.55 },
  { level: 6, commission: 0.5 },
  { level: 7, commission: 0.45 },
  { level: 8, commission: 0.4 },
  { level: 9, commission: 0.35 },
  { level: 10, commission: 0.3 },
  { level: 11, commission: 0.25 },
  { level: 12, commission: 1 },
]

export default function ReferralEarnings() {

  const [loading, setLoading] = useState(true)
  const [levelData, setLevelData] = useState<{ level: number; members: number; commission: number; total: number }[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [totalMembers, setTotalMembers] = useState(0)

  useEffect(() => {
    const load = async () => {
      const email = getUser()
      if (!email) return navigate("/auth", true)

      try {
        const snap = await getDocs(collection(db, "users"))
        const allUsers: any[] = []
        snap.forEach(d => allUsers.push(d.data()))

        const myUser = allUsers.find(u => u.email === email)
        if (!myUser) return

        // Walk down the referral tree level by level
        let currentLevelCodes = [myUser.referralCode]
        const results: { level: number; members: number; commission: number; total: number }[] = []
        let grandTotal = 0
        let grandMembers = 0

        for (let i = 0; i < 12; i++) {
          const levelUsers = allUsers.filter(
            u => currentLevelCodes.includes(u.referredBy) && u.status === "active"
          )

          const commission = COMMISSION_STRUCTURE[i].commission
          const total = levelUsers.length * commission

          results.push({
            level: i + 1,
            members: levelUsers.length,
            commission,
            total
          })

          grandTotal += total
          grandMembers += levelUsers.length
          currentLevelCodes = levelUsers.map(u => u.referralCode)

          if (currentLevelCodes.length === 0) break
        }

        setLevelData(results)
        setTotalEarnings(grandTotal)
        setTotalMembers(grandMembers)
      } catch (err) {
        console.error("Error loading earnings:", err)
      }

      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading Earnings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">

      <div className="absolute top-[-15%] right-[-10%] w-[400px] h-[400px] bg-green-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full" />

      <Navbar />

      <div className="relative z-10 p-6 max-w-3xl mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            Referral Earnings
          </h1>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-green-500/15 to-cyan-500/15 rounded-xl blur-sm" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
              <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Earnings</p>
              <p className="text-xl font-bold text-green-400">${totalEarnings.toFixed(2)}</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/15 to-blue-500/15 rounded-xl blur-sm" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
              <Users className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Team</p>
              <p className="text-xl font-bold text-cyan-400">{totalMembers}</p>
            </div>
          </div>
        </div>

        {/* LEVEL TABLE */}
        <div className="relative">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-xl blur-sm" />
          <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">

            <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-white/[0.03] border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              <span>Level</span>
              <span className="text-center">Members</span>
              <span className="text-center">Rate</span>
              <span className="text-right">Earnings</span>
            </div>

            {levelData.map(row => (
              <div key={row.level} className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-all">
                <span className="text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                    {row.level}
                  </span>
                  <span className="text-gray-300 text-xs">Level {row.level}</span>
                </span>
                <span className="text-center text-sm text-white">{row.members}</span>
                <span className="text-center text-sm text-yellow-400">${row.commission}</span>
                <span className={`text-right text-sm font-semibold ${row.total > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                  ${row.total.toFixed(2)}
                </span>
              </div>
            ))}

            {/* TOTAL ROW */}
            <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-white/[0.03] border-t border-white/10">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-yellow-400" /> Total
              </span>
              <span className="text-center text-sm font-bold text-white">{totalMembers}</span>
              <span className="text-center text-sm text-gray-500">—</span>
              <span className="text-right text-sm font-bold text-green-400">${totalEarnings.toFixed(2)}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
