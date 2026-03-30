import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { navigate } from "../lib/router"
import { Trophy, TrendingUp, Target, Award } from "lucide-react"
import Navbar from "@/components/Navbar"

export default function Leaderboard() {

    const [referrers, setReferrers] = useState<any[]>([])
    const [earners, setEarners] = useState<any[]>([])
    const [myReferrals, setMyReferrals] = useState(0)

    useEffect(() => {
        loadLeaderboard()
    }, [])

    const loadLeaderboard = async () => {

        const email = localStorage.getItem("bharos_user")

        const snap = await getDocs(collection(db, "users"))

        const users: any[] = []

        snap.forEach((doc) => {
            users.push(doc.data())
        })

        const topEarners =
            [...users]
                .sort((a, b) => (b.usdtBalance || 0) - (a.usdtBalance || 0))
                .slice(0, 5)

        setEarners(topEarners)

        const counts: any = {}

        users.forEach((u) => {
            if (u.referredBy && u.status === "active") {
                counts[u.referredBy] =
                    (counts[u.referredBy] || 0) + 1
            }
        })

        const refList = users.map((u) => ({
            name: u.userName,
            count: counts[u.referralCode] || 0
        }))

        const topRef =
            refList
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)

        setReferrers(topRef)

        const myUser = users.find((u) => u.email === email)

        if (myUser) {
            const myCount = counts[myUser.referralCode] || 0
            setMyReferrals(myCount)
        }

    }

    const progress =
        Math.min((myReferrals / 500) * 100, 100)

    const getMedal = (i: number) => {
        if (i === 0) return <span className="text-yellow-400">1st</span>
        if (i === 1) return <span className="text-gray-300">2nd</span>
        if (i === 2) return <span className="text-amber-600">3rd</span>
        return <span className="text-gray-500">{i + 1}th</span>
    }

    const getRankBg = (i: number) => {
        if (i === 0) return "from-yellow-500/15 to-amber-500/5 border-yellow-500/25 hover:border-yellow-400/40"
        if (i === 1) return "from-gray-400/10 to-gray-500/5 border-gray-400/20 hover:border-gray-300/30"
        if (i === 2) return "from-amber-700/10 to-orange-500/5 border-amber-600/20 hover:border-amber-500/30"
        return "from-white/5 to-white/[0.02] border-white/8 hover:border-white/15"
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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                        Bharos Leaderboard
                    </h1>
                </div>

                {/* TOP REFERRERS */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-5">
                        <TrendingUp className="w-5 h-5 text-yellow-400" />
                        <h2 className="text-xl font-semibold text-yellow-400">Top Referrers</h2>
                    </div>

                    <div className="space-y-2.5">
                        {referrers.map((item: any, i: number) => (
                            <div
                                key={i}
                                className={`p-4 rounded-xl flex justify-between items-center
                                bg-gradient-to-r ${getRankBg(i)} border
                                backdrop-blur-xl transition-all duration-300 hover:scale-[1.01]`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold">
                                        {getMedal(i)}
                                    </div>
                                    <span className="font-medium text-white">{item.name}</span>
                                </div>

                                <span className="font-bold text-yellow-400 text-sm">
                                    {item.count} referrals
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TOP EARNERS */}
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-5">
                        <Award className="w-5 h-5 text-green-400" />
                        <h2 className="text-xl font-semibold text-green-400">Top Earners</h2>
                    </div>

                    <div className="space-y-2.5">
                        {earners.map((item: any, i: number) => (
                            <div
                                key={i}
                                className={`p-4 rounded-xl flex justify-between items-center
                                bg-gradient-to-r ${getRankBg(i)} border
                                backdrop-blur-xl transition-all duration-300 hover:scale-[1.01]`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold">
                                        {getMedal(i)}
                                    </div>
                                    <span className="font-medium text-white">{item.userName}</span>
                                </div>

                                <span className="font-bold text-green-400 text-sm">
                                    ${Number(item.usdtBalance || 0).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
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
                    className="mt-8 px-6 py-2.5 rounded-xl font-medium text-sm text-gray-400 border border-white/10 bg-white/5 hover:bg-white/8 hover:text-white hover:border-cyan-500/30 transition-all"
                >
                    ← Back to Dashboard
                </button>

            </div>

        </div>

    )

}