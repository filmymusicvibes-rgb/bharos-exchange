import { getUser } from "../lib/session"
import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { navigate } from "../lib/router"
import { Trophy, TrendingUp, Target, Award, ArrowLeft, Users, Crown, Medal } from "lucide-react"
import Navbar from "@/components/Navbar"

export default function Leaderboard() {

    // 🔒 Mask username for privacy: "Ramana2" → "Ra***2"
    const maskName = (name: string) => {
        if (!name) return "***"
        if (name.length <= 3) return name[0] + "**"
        return name.slice(0, 2) + "***" + name.slice(-1)
    }

    const [referrers, setReferrers] = useState<any[]>([])
    const [myReferrals, setMyReferrals] = useState(0)
    const [myRank, setMyRank] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const email = getUser()
        if (!email) {
            navigate("/auth", true)
            return
        }
        loadLeaderboard()
    }, [])

    const loadLeaderboard = async () => {

        const email = getUser()

        const snap = await getDocs(collection(db, "users"))

        const users: any[] = []

        snap.forEach((doc) => {
            users.push(doc.data())
        })

        // Count active referrals per user
        const counts: any = {}

        users.forEach((u) => {
            if (u.referredBy && u.status === "active") {
                counts[u.referredBy] =
                    (counts[u.referredBy] || 0) + 1
            }
        })

        const refList = users
            .filter(u => u.status === "active")
            .map((u) => ({
                name: u.userName || "User",
                count: counts[u.referralCode] || 0,
                email: u.email
            }))
            .filter(u => u.count > 0)

        const topRef =
            refList
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)

        setReferrers(topRef)

        // My rank in referral leaderboard
        const myUser = users.find((u) => u.email === email)

        if (myUser) {
            const myCount = counts[myUser.referralCode] || 0
            setMyReferrals(myCount)

            // Find my rank
            const allSorted = refList.sort((a, b) => b.count - a.count)
            const idx = allSorted.findIndex(u => u.email === email)
            setMyRank(idx >= 0 ? idx + 1 : 0)
        }

        setLoading(false)
    }

    const progress =
        Math.min((myReferrals / 500) * 100, 100)

    const getRankIcon = (i: number) => {
        if (i === 0) return <Crown className="w-4 h-4 text-yellow-400" />
        if (i === 1) return <Medal className="w-4 h-4 text-gray-300" />
        if (i === 2) return <Medal className="w-4 h-4 text-amber-600" />
        return <span className="text-xs text-gray-500 font-bold">{i + 1}</span>
    }

    const getRankBg = (i: number) => {
        if (i === 0) return "from-yellow-500/15 to-amber-500/5 border-yellow-500/25 hover:border-yellow-400/40"
        if (i === 1) return "from-gray-400/10 to-gray-500/5 border-gray-400/20 hover:border-gray-300/30"
        if (i === 2) return "from-amber-700/10 to-orange-500/5 border-amber-600/20 hover:border-amber-500/30"
        return "from-white/5 to-white/[0.02] border-white/8 hover:border-white/15"
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050816] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Loading leaderboard...</p>
                </div>
            </div>
        )
    }

    return (

        <div className="min-h-screen bg-[#050816] text-white">

            <Navbar />

            <div className="max-w-4xl mx-auto p-6">

                {/* HEADER */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                            Bharos Leaderboard
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">Top performers in the Bharos community</p>
                    </div>
                </div>

                {/* MY STATS */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="relative">
                        <div className="absolute -inset-[1px] bg-gradient-to-br from-cyan-500/15 to-blue-500/10 rounded-xl blur-sm" />
                        <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                            <Users className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">{myReferrals}</p>
                            <p className="text-[10px] text-gray-500">My Referrals</p>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-[1px] bg-gradient-to-br from-yellow-500/15 to-amber-500/10 rounded-xl blur-sm" />
                        <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                            <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">#{myRank || '—'}</p>
                            <p className="text-[10px] text-gray-500">My Rank</p>
                        </div>
                    </div>
                </div>

                {/* TOP REFERRERS */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-5">
                        <TrendingUp className="w-5 h-5 text-yellow-400" />
                        <h2 className="text-xl font-semibold text-yellow-400">Top Referrers</h2>
                    </div>

                    {referrers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No referrers yet. Be the first!</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {referrers.map((item: any, i: number) => (
                                <div
                                    key={i}
                                    className={`p-4 rounded-xl flex justify-between items-center
                                    bg-gradient-to-r ${getRankBg(i)} border
                                    backdrop-blur-xl transition-all duration-300 hover:scale-[1.01]`}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                            {getRankIcon(i)}
                                        </div>
                                        <span className="font-medium text-white">{maskName(item.name)}</span>
                                    </div>

                                    <span className="font-bold text-yellow-400 text-sm">
                                        {item.count} referrals
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* LEADER PROGRAM */}
                <div className="relative">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/20 rounded-2xl blur-sm" />
                    
                    <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 p-8 rounded-2xl">

                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-xl text-cyan-400 font-bold">Bharos Leader Program</h2>
                        </div>

                        <p className="mb-5 text-gray-400 text-sm">
                            Achieve <b className="text-white">500 Direct Referrals</b> and become a Bharos Leader.
                        </p>

                        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden mb-2 border border-white/5">
                            <div
                                className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 h-3 transition-all duration-700"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <p className="text-xs text-gray-500 mb-5">
                            Progress: {myReferrals} / 500 referrals
                        </p>

                        <div className="bg-white/[0.03] p-4 rounded-xl border border-white/8">
                            <p className="text-yellow-400 font-bold text-sm flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                Special Leader Reward
                            </p>
                            <p className="text-gray-400 text-xs mt-1.5">
                                Reach <b className="text-white">500 referrals</b> to unlock a
                                <span className="text-green-400 font-semibold"> BIG exclusive reward</span>
                            </p>
                        </div>

                    </div>
                </div>

                <button
                    onClick={() => navigate("/dashboard")}
                    className="mt-8 px-6 py-2.5 rounded-xl font-medium text-sm text-gray-400 border border-white/10 bg-white/5 hover:bg-white/8 hover:text-white hover:border-cyan-500/30 transition-all flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>

            </div>

        </div>

    )

}