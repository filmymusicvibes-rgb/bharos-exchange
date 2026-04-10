import { getUser } from "../lib/session"
import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { navigate } from "../lib/router"
import Navbar from "@/components/Navbar"

export default function Transactions() {

    const [allTx, setAllTx] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"all" | "brs" | "usdt">("all")

    useEffect(() => {
        loadTransactions()
    }, [])

    const loadTransactions = async () => {
        const email = getUser()
        if (!email) {
            navigate("/auth", true)
            setLoading(false)
            return
        }

        const list: any[] = []

        try {
            // Fetch ALL Transactions (BRS + USDT commissions)
            const snapTx = await getDocs(query(collection(db, "transactions"), where("userId", "==", email)))
            snapTx.forEach((doc) => {
                const data: any = doc.data()
                const isSend = data.type === "send" || data.type === "BRS_SEND"
                const isReceive = data.type === "receive" || data.type === "BRS_RECEIVE"
                const isBotEarn = data.type === "bot_earn"
                const isCommission = data.type === "commission" || data.type === "team_reward" || data.type === "matrix_bonus"
                const isActivation = data.type === "activation" || data.description?.includes?.("Activation")
                const isDailyReward = data.type === "daily_reward" || data.type === "social_earn"
                const isCompanyBonus = data.description?.includes?.("Company Direct")

                const currency = data.currency || "BRS"

                let label = data.description || data.type || "Transaction"
                let icon = "💰"
                let color = "text-cyan-400"
                let amountSign = "+"

                if (isSend) {
                    label = data.description || "BRS Sent"
                    icon = "↗️"
                    color = "text-red-400"
                    amountSign = "-"
                } else if (isReceive) {
                    label = data.description || "BRS Received"
                    icon = "↙️"
                    color = "text-green-400"
                } else if (isBotEarn) {
                    label = data.description || "Bot Earn Reward"
                    icon = "🤖"
                    color = "text-purple-400"
                } else if (isCommission && currency === "USDT") {
                    label = data.description || "USDT Commission"
                    icon = "💵"
                    color = "text-green-400"
                } else if (isCommission) {
                    label = data.description || "BRS Commission"
                    icon = "💰"
                    color = "text-yellow-400"
                } else if (isActivation || isCompanyBonus) {
                    label = data.description || "Activation Reward"
                    icon = "🎁"
                    color = "text-amber-400"
                } else if (isDailyReward) {
                    label = data.description || "Daily Reward"
                    icon = "📅"
                    color = "text-blue-400"
                }

                list.push({
                    ...data,
                    label, icon, color, amountSign, currency,
                    sortTime: data.timestamp?.toMillis?.() || data.createdAt?.toMillis?.() || 0,
                    timeStr: data.timestamp?.toDate?.() 
                        ? data.timestamp.toDate().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : data.createdAt?.toDate?.()
                        ? data.createdAt.toDate().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : ''
                })
            })

            // Fetch Withdrawals (USDT)
            const snapW = await getDocs(query(collection(db, "withdrawals"), where("userId", "==", email)))
            snapW.forEach((doc) => {
                const data: any = doc.data()
                list.push({
                    ...data,
                    label: "USDT Withdrawal",
                    icon: "💸",
                    color: "text-red-400",
                    amountSign: "-",
                    currency: "USDT",
                    amount: Number(data.amount || 0),
                    sortTime: data.createdAt?.toMillis?.() || 0,
                    timeStr: data.createdAt?.toDate?.()
                        ? data.createdAt.toDate().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : '',
                    displayStatus: data.status
                })
            })

            // Fetch Deposits (USDT)
            const snapD = await getDocs(query(collection(db, "deposits"), where("userId", "==", email)))
            snapD.forEach((doc) => {
                const data: any = doc.data()
                list.push({
                    ...data,
                    label: "USDT Deposit",
                    icon: "📥",
                    color: "text-cyan-400",
                    amountSign: "+",
                    currency: "USDT",
                    amount: Number(data.amount || 0),
                    sortTime: data.createdAt?.toMillis?.() || 0,
                    timeStr: data.createdAt?.toDate?.()
                        ? data.createdAt.toDate().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : '',
                    displayStatus: data.status
                })
            })

            // Sort newest first
            list.sort((a, b) => b.sortTime - a.sortTime)
            setAllTx(list)
        } catch (err) {
            console.error("Error fetching transactions:", err)
        }

        setLoading(false)
    }

    // Filter by tab
    const filtered = allTx.filter(t => {
        if (activeTab === "all") return true
        if (activeTab === "brs") return t.currency === "BRS"
        if (activeTab === "usdt") return t.currency === "USDT"
        return true
    })

    const brsCount = allTx.filter(t => t.currency === "BRS").length
    const usdtCount = allTx.filter(t => t.currency === "USDT").length

    const getStatusBadge = (status: string) => {
        const s = (status || "success").toLowerCase()
        if (s === "approved" || s === "success" || s === "verified")
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">✓ {s.toUpperCase()}</span>
        if (s === "rejected")
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">✕ REJECTED</span>
        if (s === "pending")
            return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">⏳ PENDING</span>
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">✓ SUCCESS</span>
    }

    return (
        <div className="min-h-screen bg-[#050816] text-white">

            <Navbar />

            <div className="max-w-3xl mx-auto p-4 sm:p-6">

                <h1 className="text-2xl font-bold mb-5 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    💳 Transaction History
                </h1>

                {/* TABS */}
                <div className="flex gap-2 mb-5">
                    {[
                        { key: "all", label: `All (${allTx.length})` },
                        { key: "brs", label: `🪙 BRS (${brsCount})` },
                        { key: "usdt", label: `💵 USDT (${usdtCount})` }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === tab.key
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center mt-16">
                        <div className="w-7 h-7 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Loading...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center mt-16">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-gray-500 text-sm">No {activeTab === "all" ? "" : activeTab.toUpperCase() + " "}transactions yet</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {filtered.map((t, i) => (
                            <div key={i}
                                className="flex items-center justify-between px-4 py-3 rounded-xl
                                bg-white/[0.03] hover:bg-white/[0.06] border border-white/5
                                hover:border-white/10 transition-all duration-200">

                                {/* Left: Icon + Label */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="text-lg flex-shrink-0">{t.icon}</span>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-medium ${t.color} truncate`}>
                                            {t.label}
                                        </p>
                                        <p className="text-[11px] text-gray-500">{t.timeStr}</p>
                                    </div>
                                </div>

                                {/* Right: Amount + Status */}
                                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                                    <p className={`text-sm font-bold ${t.amountSign === '-' ? 'text-red-400' : 'text-green-400'}`}>
                                        {t.amountSign}{t.currency === "USDT" ? "$" : ""}{t.amount} {t.currency === "BRS" ? "BRS" : ""}
                                    </p>
                                    {getStatusBadge(t.displayStatus || "success")}
                                </div>

                            </div>
                        ))}
                    </div>
                )}

                {/* TOTAL SUMMARY */}
                {!loading && filtered.length > 0 && (
                    <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-xs text-gray-500 text-center">
                            Showing {filtered.length} transaction{filtered.length > 1 ? 's' : ''}
                            {activeTab !== "all" && ` • ${activeTab.toUpperCase()} only`}
                        </p>
                    </div>
                )}

            </div>

        </div>
    )
}
