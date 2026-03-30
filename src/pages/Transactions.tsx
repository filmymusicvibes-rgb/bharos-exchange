import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import { ArrowUpRight, ArrowDownLeft, CreditCard, Wallet, Clock, CheckCircle, XCircle } from "lucide-react"
import Navbar from "@/components/Navbar"

export default function Transactions() {

    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadTransactions()
    }, [])

    const loadTransactions = async () => {
        const email = localStorage.getItem("bharos_user")
        if (!email) {
            setLoading(false)
            return
        }

        const list: any[] = []

        try {
            // Fetch Transactions (BRS transfers)
            const snapTx = await getDocs(collection(db, "transactions"))
            snapTx.forEach((doc) => {
                const data: any = doc.data()
                if (data.userId === email) {
                    const isSend = data.type === "send" || data.type === "BRS_SEND"
                    const isReceive = data.type === "receive" || data.type === "BRS_RECEIVE"

                    if (isSend || isReceive) {
                        list.push({
                            ...data,
                            displayType: isSend ? "BRS Sent" : "BRS Received",
                            displayAmount: `${data.amount} BRS`,
                            displayStatus: "success",
                            txCategory: isSend ? "send" : "receive"
                        })
                    }
                }
            })

            // Fetch Withdrawals (USDT)
            const snapW = await getDocs(collection(db, "withdrawals"))
            snapW.forEach((doc) => {
                const data: any = doc.data()
                if (data.userId === email) {
                    list.push({
                        ...data,
                        displayType: "USDT Withdraw",
                        displayAmount: `$${Number(data.amount || 0).toFixed(2)}`,
                        displayStatus: data.status,
                        txCategory: "withdraw"
                    })
                }
            })

            // Fetch Deposits (USDT)
            const snapD = await getDocs(collection(db, "deposits"))
            snapD.forEach((doc) => {
                const data: any = doc.data()
                if (data.userId === email) {
                    list.push({
                        ...data,
                        displayType: "USDT Deposit",
                        displayAmount: `$${Number(data.amount || 0).toFixed(2)}`,
                        displayStatus: data.status,
                        txCategory: "deposit"
                    })
                }
            })

            // Sort by createdAt descending
            list.sort((a, b) => {
                const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime()
                const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime()
                return dateB - dateA
            })

            setTransactions(list)
        } catch (err) {
            console.error("Error fetching transactions:", err)
        }

        setLoading(false)
    }

    const getIcon = (category: string) => {
        switch (category) {
            case "send": return <ArrowUpRight className="w-5 h-5 text-red-400" />
            case "receive": return <ArrowDownLeft className="w-5 h-5 text-green-400" />
            case "withdraw": return <Wallet className="w-5 h-5 text-yellow-400" />
            case "deposit": return <CreditCard className="w-5 h-5 text-cyan-400" />
            default: return <CreditCard className="w-5 h-5 text-gray-400" />
        }
    }

    const getIconBg = (category: string) => {
        switch (category) {
            case "send": return "bg-red-500/10 border-red-500/20"
            case "receive": return "bg-green-500/10 border-green-500/20"
            case "withdraw": return "bg-yellow-500/10 border-yellow-500/20"
            case "deposit": return "bg-cyan-500/10 border-cyan-500/20"
            default: return "bg-gray-500/10 border-gray-500/20"
        }
    }

    const getStatusIcon = (status: string) => {
        const s = (status || "").toLowerCase()
        if (s === "approved" || s === "success" || s === "verified") return <CheckCircle className="w-3.5 h-3.5" />
        if (s === "rejected") return <XCircle className="w-3.5 h-3.5" />
        return <Clock className="w-3.5 h-3.5" />
    }

    const getStatusStyle = (status: string) => {
        const s = (status || "").toLowerCase()
        if (s === "approved" || s === "success" || s === "verified") return "text-green-400 bg-green-500/10 border-green-500/30"
        if (s === "rejected") return "text-red-400 bg-red-500/10 border-red-500/30"
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
    }

    return (
        <div className="min-h-screen bg-[#050816] text-white">

            <Navbar />

            <div className="max-w-4xl mx-auto p-6">

                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Transactions
                </h1>

                {loading ? (
                    <div className="text-center mt-20">
                        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Loading transactions...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center mt-20">
                        <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-4">
                            <CreditCard className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-500">No transactions yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((t, i) => (
                            <div key={i}
                                className="p-4 rounded-xl border border-white/8 bg-white/[0.03] backdrop-blur-xl
                                flex flex-col sm:flex-row justify-between sm:items-center gap-3
                                hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300">

                                <div className="flex items-center gap-3.5">
                                    <div className={`p-2.5 rounded-xl border ${getIconBg(t.txCategory)}`}>
                                        {getIcon(t.txCategory)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-sm">
                                            {t.displayType}
                                        </p>
                                        <p className="text-white/80 font-bold text-lg">
                                            {t.displayAmount}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-0.5">
                                            {t.createdAt?.toDate?.().toLocaleString() || new Date(t.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:items-end gap-1.5">
                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(t.displayStatus)} w-fit`}>
                                        {getStatusIcon(t.displayStatus)}
                                        {(t.displayStatus || "success").toUpperCase()}
                                    </span>
                                    {t.address && (
                                        <p className="text-xs text-gray-500 font-mono">
                                            To: {t.address.substring(0, 8)}...{t.address.substring(t.address.length - 6)}
                                        </p>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                )}

            </div>

        </div>
    )
}
