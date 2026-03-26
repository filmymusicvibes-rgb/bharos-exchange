import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { navigate } from "../lib/router"
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
        if (i === 0) return "🥇"
        if (i === 1) return "🥈"
        if (i === 2) return "🥉"
        return ""
    }

    return (

        <div className="min-h-screen bg-[#0B0919] text-white">

            <Navbar />

            <div className="max-w-6xl mx-auto p-6 md:p-10">

                <h1 className="text-4xl font-bold mb-10 text-yellow-400">
                    🏆 Bharos Leaderboard
                </h1>

                {/* SECTIONS */}
                {[
                    { title: "Top Referrers", data: referrers, color: "yellow", type: "ref" },
                    { title: "Top Earners", data: earners, color: "green", type: "earn" }
                ].map((section, sIndex) => (

                    <div key={sIndex} className="mb-12">

                        <h2 className={`text-2xl mb-6 font-semibold text-${section.color}-400`}>
                            {section.title}
                        </h2>

                        {section.data.map((item: any, i: number) => (

                            <div
                                key={i}
                                className={`p-4 mb-3 rounded-xl flex justify-between 
                                bg-gradient-to-r from-${section.color}-500/10 to-${section.color}-700/10
                                border border-${section.color}-400/20
                                hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]
                                transition cursor-pointer`}
                            >

                                <span className="font-medium">
                                    {getMedal(i)} {i + 1}. {item.userName || item.name}
                                </span>

                                <span className={`font-bold text-${section.color}-400`}>
                                    {section.type === "ref" && `${item.count} referrals`}
                                    {section.type === "earn" && `$${item.usdtBalance || 0}`}
                                    {section.type === "brs" && `${item.brsBalance || 0} BRS`}
                                </span>

                            </div>

                        ))}

                    </div>

                ))}

                {/* LEADER PROGRAM */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-8 rounded-2xl border border-cyan-400/20 shadow-lg">

                    <h2 className="text-2xl text-cyan-400 mb-3 font-bold">
                        🚀 Bharos Leader Program
                    </h2>

                    <p className="mb-4 text-gray-300">
                        Achieve <b>500 Direct Referrals</b> and become a Bharos Leader.
                    </p>

                    <div className="w-full bg-black/30 rounded-full h-4 overflow-hidden mb-3">

                        <div
                            className="bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 h-4 animate-pulse transition-all duration-700"
                            style={{ width: `${progress}%` }}
                        />

                    </div>

                    <p className="text-sm text-gray-400 mb-4">
                        Progress: {myReferrals} / 500 referrals
                    </p>

                    <div className="bg-black/30 p-4 rounded-lg border border-yellow-400/20">

                        <p className="text-yellow-400 font-bold">
                            🎁 Special Leader Reward
                        </p>

                        <p className="text-gray-300 text-sm mt-1">
                            Reach <b>500 referrals</b> to unlock a
                            <span className="text-green-400 font-semibold"> BIG exclusive reward</span>
                        </p>

                    </div>

                </div>

                <button
                    onClick={() => navigate("/dashboard")}
                    className="mt-10 bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 rounded-lg hover:scale-105 transition"
                >
                    Back to Dashboard
                </button>

            </div>

        </div>

    )

}