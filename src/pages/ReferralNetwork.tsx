import { useEffect, useState } from "react"
import { navigate } from "@/lib/router"
import { db } from "../lib/firebase"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { Users, DollarSign } from "lucide-react"
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

    const email = localStorage.getItem("bharos_user")
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

    <div className="min-h-screen bg-[#0B0919] text-white animate-scale-in">

      <Navbar />

      {loading && (
        <div className="fixed top-20 right-5 bg-black/70 px-4 py-2 rounded-lg text-cyan-400 text-sm animate-pulse">
          Updating...
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 md:p-10">

        <h1 className="text-4xl text-cyan-400 mb-10 font-bold">
          Referral Network 🚀
        </h1>

        {/* CARDS */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">

          <div className="p-6 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 animate-pulse hover:scale-105 transition">
            <p>Direct</p>
            <h2 className="text-3xl text-cyan-400">{directCount}/10</h2>
            <div className="mt-3 h-3 bg-black/30 rounded-full overflow-hidden">
              <div style={{ width: `${directProgress}%` }}
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500" />
            </div>
            <p className="text-yellow-400 mt-2">
              {directAchieved ? "🎉 Completed! +20 USDT Credited" : "🎁 Complete 10 → Earn 20 USDT"}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 shadow-lg shadow-yellow-500/20 animate-pulse hover:scale-105 transition">
            <p>Matrix</p>
            <h2 className="text-3xl text-yellow-400">{matrixCount}/39</h2>
            <div className="mt-3 h-3 bg-black/30 rounded-full overflow-hidden">
              <div style={{ width: `${matrixProgress}%` }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500" />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              L1: {directCount}/3 | L2: {level2Count}/9 | L3: {level3Count}/27
            </p>
            <p className="text-yellow-400 mt-2">
              {matrixAchieved ? "🎉 Completed! +30 USDT Credited" : "🎁 Complete Matrix → 30 USDT"}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-green-400/30 bg-green-500/10 shadow-lg shadow-green-500/20 animate-pulse hover:scale-105 transition">
            <p>Trip</p>
            <h2 className="text-3xl text-green-400">{tripCount}/100</h2>
            <div className="mt-3 h-3 bg-black/30 rounded-full overflow-hidden">
              <div style={{ width: `${tripProgress}%` }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-600" />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              L4: {level4Count}/81 | Team: {tripCount}/100
            </p>
            <p className="text-yellow-400 mt-2">
              {tripAchieved ? "✈️ Trip Unlocked!" : "🎁 Build Team → Win International Trip"}
            </p>
          </div>

        </div>

        {/* SUMMARY */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="p-6 bg-[#1a1a2e] rounded-xl border border-cyan-500/20">
            <Users className="text-cyan-400 mb-2" />
            <p>Total Members</p>
            <h2 className="text-xl font-bold">{totalMembers}</h2>
          </div>

          <div className="p-6 bg-[#1a1a2e] rounded-xl border border-yellow-500/20">
            <DollarSign className="text-yellow-400 mb-2" />
            <p>Total Earnings</p>
            <h2 className="text-xl font-bold text-yellow-400">
              ${totalEarnings.toFixed(2)}
            </h2>
          </div>
        </div>

        {/* LEVEL TABLE */}
        <div className="bg-[#1a1a2e] rounded-xl overflow-hidden mb-10">
          <table className="w-full">
            <thead className="bg-[#16213e]">
              <tr>
                <th className="p-4 text-left">Level</th>
                <th className="p-4">Members</th>
                <th className="p-4">Commission</th>
                <th className="p-4">Total</th>
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
                    className={`bg-gradient-to-r ${colors[i]}/10 border-t border-white/10 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:scale-[1.01] transition`}>
                    <td className="p-4 font-semibold">Level {l.level}</td>
                    <td className="p-4 text-center">{l.members}</td>
                    <td className="p-4 text-yellow-400 text-center">${l.commission}</td>
                    <td className="p-4 text-green-400 text-center">
                      ${(l.members * l.commission).toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* DIRECT REFERRALS FINAL */}
        <div>
          <h2 className="text-xl text-cyan-400 mb-4">Direct Referrals 👇</h2>

          <div className={`grid gap-4 ${directList.length === 1
            ? "grid-cols-1"
            : "md:grid-cols-2 lg:grid-cols-3"
            }`}>

            {directList.length === 0 ? (
              <p className="text-gray-400">No referrals yet</p>
            ) : (
              directList.map((u, i) => (
                <div key={i}
                  className={`p-5 rounded-2xl border backdrop-blur-md shadow-lg flex justify-between items-center
                  ${u.status === "active"
                      ? "border-green-400/30 bg-green-500/10"
                      : "border-red-400/30 bg-red-500/10"
                    }`}>

                  <div>
                    <p>👤 {u.userName || "User"}</p>
                    <p>📧 {u.email}</p>
                    <p>🆔 {u.referralCode}</p>
                    <p>📅 {u.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</p>
                  </div>

                  <div className={`px-4 py-1 rounded-full text-sm font-bold
                    ${u.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                    }`}>
                    {u.status}
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