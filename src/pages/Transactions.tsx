import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs } from "firebase/firestore"

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
                    
                    list.push({
                        ...data,
                        displayType: isSend ? "BRS Sent" : isReceive ? "BRS Received" : "BRS Transfer",
                        displayAmount: `${data.amount} BRS`,
                        displayStatus: "success", // Transfers are usually instant/success
                        icon: isSend ? "📤" : "📥"
                    })
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
                        icon: "💸"
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
                        icon: "💳"
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

    const getStatusColor = (status: string) => {
        const s = (status || "").toLowerCase()
        if (s === "approved" || s === "success") return "text-green-400 bg-green-500/10"
        if (s === "rejected") return "text-red-400 bg-red-500/10"
        return "text-yellow-400 bg-yellow-500/10"
    }

    return (
        <div className="min-h-screen bg-[#0B0919] text-white p-6">

            <h1 className="text-3xl text-cyan-400 mb-8 font-bold">
                Transactions
            </h1>

            {loading ? (
                <div className="text-center text-cyan-400 animate-pulse mt-20">Loading transactions...</div>
            ) : transactions.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">No transactions found.</div>
            ) : (
                <div className="space-y-4">
                    {transactions.map((t, i) => (
                        <div key={i}
                            className="p-5 rounded-2xl border border-cyan-500/20 
                            bg-[#1a1a2e] flex flex-col sm:flex-row justify-between sm:items-center gap-4
                            hover:scale-[1.02] transition">

                            <div className="flex items-center gap-4">
                                <div className="text-3xl bg-white/5 p-3 rounded-full">
                                    {t.icon}
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-cyan-400">
                                        {t.displayType}
                                    </p>
                                    <p className="text-gray-300 font-semibold">
                                        {t.displayAmount}
                                    </p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {t.createdAt?.toDate?.().toLocaleString() || new Date(t.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:items-end gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold border border-current ${getStatusColor(t.displayStatus)} inline-block w-fit`}>
                                    {(t.displayStatus || "success").toUpperCase()}
                                </span>
                                {t.address && <p className="text-xs text-gray-400 font-mono">To: {t.address.substring(0, 8)}...{t.address.substring(t.address.length - 6)}</p>}
                                {t.hash && <p className="text-xs text-gray-400 font-mono">Hash: {t.hash.substring(0, 8)}...{t.hash.substring(t.hash.length - 6)}</p>}
                            </div>

                        </div>
                    ))}
                </div>
            )}

        </div>
    )
}
