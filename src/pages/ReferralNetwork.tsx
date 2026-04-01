import { getUser } from "../lib/session"
import { useEffect, useState } from "react"
import { navigate } from "@/lib/router"
import { db } from "../lib/firebase"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { Users, DollarSign, User, Mail, Hash, Calendar, Target, Grid3X3, Plane, Gift, CheckCircle } from "lucide-react"
import Navbar from "@/components/Navbar"

interface LevelData {
  level: number
  members: number
  commission: number
}

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

export default function ReferralNetwork() {

  const [loading, setLoading] = useState(true)
  const [levelStats, setLevelStats] = useState<LevelData[]>([])
  const [totalMembers, setTotalMembers] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)

  const [directCount, setDirectCount] = useState(0)
  const [matrixCount, setMatrixCount] = useState(0)
  const [tripCount, setTripCount] = useState(0)

  const [level2Count, setLevel2Count] = useState(0)
  const [level3Count, setLevel3Count] = useState(0)
  const [level4Count, setLevel4Count] = useState(0)

  const [directList, setDirectList] = useState<any[]>([])

  const [matrixAchieved, setMatrixAchieved] = useState(false)
  const [tripAchieved, setTripAchieved] = useState(false)
  const [directAchieved, setDirectAchieved] = useState(false)



  useEffect(() => {
    loadNetwork()
  }, [])

  const loadNetwork = async () => {

    const email = getUser()
    if (!email) return navigate("/")

    const userRef = doc(db, "users", email)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) return

    const userData: any = userSnap.data()
    const myCode = userData.referralCode

    const usersSnap = await getDocs(collection(db, "users"))

    const users = usersSnap.docs.map(doc => doc.data())

    const level1All = users.filter(u => u.referredBy === myCode)
    const level1 = level1All.filter(u => u.status === "active")

    setDirectList(level1All)
    setDirectCount(level1.length)

    const level1Codes = level1.map(u => u.referralCode)

    const level2 = users.filter(u =>
      level1Codes.includes(u.referredBy) && u.status === "active"
    )
    setLevel2Count(level2.length)

    const level2Codes = level2.map(u => u.referralCode)

    const level3 = users.filter(u =>
      level2Codes.includes(u.referredBy) && u.status === "active"
    )
    setLevel3Count(level3.length)

    const level3Codes = level3.map(u => u.referralCode)

    const level4 = users.filter(u =>
      level3Codes.includes(u.referredBy) && u.status === "active"
    )
    setLevel4Count(level4.length)

    const matrixTotal = level1.length + level2.length + level3.length
    setMatrixCount(matrixTotal)

    const totalTeam =
      level1.length +
      level2.length +
      level3.length +
      level4.length

    setTripCount(totalTeam)

    if (level1.length >= 10) setDirectAchieved(true)

    if (level1.length >= 3 && level2.length >= 9 && level3.length >= 27) {
      setMatrixAchieved(true)
    }

    if (level4.length >= 81 || totalTeam >= 100) {
      setTripAchieved(true)
    }

    const levels: any = []
    levels[0] = level1

    for (let i = 1; i < 12; i++) {
      const prev = levels[i - 1] || []
      const codes = prev.map((u: any) => u.referralCode)

      levels[i] = users.filter((u) =>
        codes.includes(u.referredBy) && u.status === "active"
      )
    }

    const levelData = COMMISSION_STRUCTURE.map((l, i) => ({
      level: l.level,
      members: levels[i]?.length || 0,
      commission: l.commission
    }))

    setLevelStats(levelData)

    setTotalMembers(levelData.reduce((s, l) => s + l.members, 0))

    // 🔥 Total Earnings = Level Commissions + Special Rewards
    let earnings = levelData.reduce((s, l) => s + (l.members * l.commission), 0)
    if (userData.directRewardPaid) earnings += 20
    if (userData.matrixRewardPaid) earnings += 30
    setTotalEarnings(earnings)

    setLoading(false)
  }



  const directProgress = (directCount / 10) * 100
  const matrixProgress = (matrixCount / 39) * 100
  const tripProgress = (tripCount / 100) * 100

  return (

    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">

      {/* AMBIENT */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-green-500/5 blur-[120px] rounded-full" />

      <Navbar />

      {loading && (
        <div className="fixed top-20 right-5 bg-[#0d1117]/90 backdrop-blur-xl px-4 py-2 rounded-lg text-cyan-400 text-sm border border-cyan-500/20 z-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            Updating...
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 md:p-10 relative z-10">

        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Referral Network
        </h1>

        {/* MILESTONE CARDS */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">

          {/* DIRECT */}
          <div className="glass-shield rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300" style={{ borderColor: 'rgba(34,211,238,0.15)' }}>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20">
                <Target className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Direct</p>
            </div>
            <h2 className="text-3xl font-bold text-cyan-400 relative z-10">{directCount}/10</h2>
            <div className="mt-3 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative z-10">
              <div style={{ width: `${directProgress}%` }}
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700" />
            </div>
            <p className="text-xs mt-2.5 relative z-10">
              {directAchieved ? (
                <span className="flex items-center gap-1.5 text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Completed! +20 USDT Credited
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <Gift className="w-3.5 h-3.5" /> Complete 10 → Earn 20 USDT
                </span>
              )}
            </p>
          </div>

          {/* MATRIX */}
          <div className="glass-shield rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300" style={{ borderColor: 'rgba(250,204,21,0.15)' }}>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center border border-yellow-500/20">
                <Grid3X3 className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Matrix</p>
            </div>
            <h2 className="text-3xl font-bold text-yellow-400 relative z-10">{matrixCount}/39</h2>
            <div className="mt-3 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative z-10">
              <div style={{ width: `${matrixProgress}%` }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-700" />
            </div>
            <p className="text-[10px] text-gray-500 mt-2 relative z-10">
              L1: {directCount}/3 | L2: {level2Count}/9 | L3: {level3Count}/27
            </p>
            <p className="text-xs mt-1.5 relative z-10">
              {matrixAchieved ? (
                <span className="flex items-center gap-1.5 text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Completed! +30 USDT Credited
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <Gift className="w-3.5 h-3.5" /> Complete Matrix → 30 USDT
                </span>
              )}
            </p>
          </div>

          {/* TRIP */}
          <div className="glass-shield rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300" style={{ borderColor: 'rgba(34,197,94,0.15)' }}>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                <Plane className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-sm text-gray-400 font-medium">Trip</p>
            </div>
            <h2 className="text-3xl font-bold text-green-400 relative z-10">{tripCount}/100</h2>
            <div className="mt-3 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative z-10">
              <div style={{ width: `${tripProgress}%` }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full transition-all duration-700" />
            </div>
            <p className="text-[10px] text-gray-500 mt-2 relative z-10">
              L4: {level4Count}/81 | Team: {tripCount}/100
            </p>
            <p className="text-xs mt-1.5 relative z-10">
              {tripAchieved ? (
                <span className="flex items-center gap-1.5 text-green-400">
                  <Plane className="w-3.5 h-3.5" /> Trip Unlocked!
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-yellow-400">
                  <Gift className="w-3.5 h-3.5" /> Build Team → Win International Trip
                </span>
              )}
            </p>
          </div>

        </div>

        {/* SUMMARY */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <div className="relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/15 to-blue-500/15 rounded-xl blur-sm group-hover:blur-md transition-all" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Members</p>
                  <h2 className="text-xl font-bold text-white">{totalMembers}</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-green-500/15 to-emerald-500/15 rounded-xl blur-sm group-hover:blur-md transition-all" />
            <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Earnings</p>
                  <h2 className="text-xl font-bold text-green-400">${totalEarnings.toFixed(2)}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LEVEL TABLE */}
        <div className="relative mb-8">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur-sm" />
          <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[340px]">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/10">
                  <th className="p-3 md:p-4 text-left text-gray-400 font-medium text-xs">Level</th>
                  <th className="p-3 md:p-4 text-gray-400 font-medium text-xs">Members</th>
                  <th className="p-3 md:p-4 text-gray-400 font-medium text-xs">Commission</th>
                  <th className="p-3 md:p-4 text-gray-400 font-medium text-xs">Total</th>
                </tr>
              </thead>
              <tbody>
                {levelStats.map((l, i) => {
                  const colors = [
                    "from-cyan-500 to-blue-500",
                    "from-blue-500 to-indigo-500",
                    "from-indigo-500 to-purple-500",
                    "from-purple-500 to-pink-500",
                    "from-pink-500 to-red-500",
                    "from-red-500 to-orange-500",
                    "from-orange-500 to-yellow-500",
                    "from-yellow-500 to-green-500",
                    "from-green-500 to-emerald-500",
                    "from-emerald-500 to-teal-500",
                    "from-teal-500 to-cyan-500",
                    "from-cyan-500 to-white"
                  ]

                  return (
                    <tr key={l.level}
                      className={`bg-gradient-to-r ${colors[i]}/5 border-t border-white/5 hover:bg-white/[0.03] transition`}>
                      <td className="p-3 md:p-4 font-medium whitespace-nowrap text-gray-300">Level {l.level}</td>
                      <td className="p-3 md:p-4 text-center text-white">{l.members}</td>
                      <td className="p-3 md:p-4 text-yellow-400 text-center">${l.commission}</td>
                      <td className="p-3 md:p-4 text-green-400 text-center whitespace-nowrap font-medium">
                        ${(l.members * l.commission).toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* DIRECT REFERRALS */}
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Direct Referrals
          </h2>

          <div className={`grid gap-4 ${directList.length === 1
            ? "grid-cols-1"
            : "md:grid-cols-2 lg:grid-cols-3"
            }`}>

            {directList.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-8 text-center">
                <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No referrals yet</p>
              </div>
            ) : (
              directList.map((u, i) => (
                <div key={i}
                  className="relative group">
                  <div className={`absolute -inset-[1px] rounded-xl blur-sm transition-all group-hover:blur-md ${
                    u.status === "active" ? "bg-green-500/10" : "bg-red-500/10"
                  }`} />
                  <div className={`relative bg-[#0d1117]/90 backdrop-blur-xl p-5 rounded-xl border flex justify-between items-center transition-all duration-300 ${
                    u.status === "active"
                      ? "border-green-500/15 hover:border-green-500/30"
                      : "border-red-500/15 hover:border-red-500/30"
                  }`}>

                    <div className="space-y-1.5">
                      <p className="flex items-center gap-2 text-white font-medium">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        {u.userName || "User"}
                      </p>
                      <p className="flex items-center gap-2 text-gray-400 text-sm">
                        <Mail className="w-3.5 h-3.5 text-gray-500" />
                        {u.email}
                      </p>
                      <p className="flex items-center gap-2 text-gray-400 text-sm">
                        <Hash className="w-3.5 h-3.5 text-gray-500" />
                        {u.referralCode}
                      </p>
                      <p className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {u.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                      </p>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                      u.status === "active"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {u.status === "active" ? "active" : "inactive"}
                    </div>

                  </div>
                </div>
              ))
            )}

          </div>
        </div>

      </div>
    </div>
  )
}