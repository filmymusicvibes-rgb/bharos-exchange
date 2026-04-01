import { getUser } from "../lib/session"
import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { navigate } from "../lib/router"
import { Clock, CheckCircle, XCircle, Wallet, ArrowLeft } from "lucide-react"
import Navbar from "@/components/Navbar"

export default function WithdrawHistory() {

    const [withdraws, setWithdraws] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {

        const email = getUser()
        if (!email) {
            navigate("/auth", true)
            return
        }

        try {
            const snap = await getDocs(query(collection(db, "withdrawals"), where("userId", "==", email)))

            const list: any[] = []

            snap.forEach((doc) => {
                list.push(doc.data())
            })

            setWithdraws(list.reverse())
        } catch (err) {
            console.error("Error loading withdrawals:", err)
        }

        setLoading(false)
    }

    const getStatusIcon = (status: string) => {
        const s = (status || "").toLowerCase()
        if (s === "approved") return <CheckCircle className="w-3.5 h-3.5" />
        if (s === "rejected") return <XCircle className="w-3.5 h-3.5" />
        return <Clock className="w-3.5 h-3.5" />
    }

    const getStatusStyle = (status: string) => {
        const s = (status || "").toLowerCase()
        if (s === "approved") return "text-green-400 bg-green-500/10 border-green-500/30"
        if (s === "rejected") return "text-red-400 bg-red-500/10 border-red-500/30"
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
    }

    return (

        <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">

            {/* AMBIENT */}
            <div className="absolute top-[-15%] right-[-10%] w-[400px] h-[400px] bg-green-500/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full" />

            <Navbar />

            <div className="max-w-4xl mx-auto p-6 relative z-10">

                {/* HEADER */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                        <Wallet className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            Withdraw History
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">Track all your withdrawal requests</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center mt-20">
                        <div className="w-8 h-8 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Loading history...</p>
                    </div>
                ) : withdraws.length === 0 ? (
                    <div className="text-center mt-20">
                        <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-4">
                            <Wallet className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-500">No withdrawals yet</p>
                        <button
                            onClick={() => navigate("/withdraw")}
                            className="mt-4 px-5 py-2 rounded-xl text-sm font-medium text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:scale-105 transition-all"
                        >
                            Make Your First Withdrawal
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {withdraws.map((w, i) => (
                            <div key={i}
                                className="p-4 rounded-xl border border-white/8 bg-white/[0.03] backdrop-blur-xl
                                flex flex-col sm:flex-row justify-between sm:items-center gap-3
                                hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300">

                                <div className="flex items-center gap-3.5">
                                    <div className="p-2.5 rounded-xl border bg-green-500/10 border-green-500/20">
                                        <Wallet className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-sm">
                                            USDT Withdrawal
                                        </p>
                                        <p className="text-white/80 font-bold text-lg">
                                            ${Number(w.amount || 0).toFixed(2)}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-0.5 font-mono">
                                            {w.address ? `${w.address.substring(0, 10)}...${w.address.substring(w.address.length - 6)}` : "N/A"}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-0.5">
                                            {w.createdAt?.toDate?.().toLocaleString() || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(w.status)} w-fit`}>
                                    {getStatusIcon(w.status)}
                                    {(w.status || "pending").toUpperCase()}
                                </span>

                            </div>
                        ))}
                    </div>
                )}

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