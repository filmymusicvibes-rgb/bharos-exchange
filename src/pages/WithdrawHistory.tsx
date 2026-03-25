import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs } from "firebase/firestore"

export default function WithdrawHistory() {

    const [withdraws, setWithdraws] = useState<any[]>([])

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {

        const email = localStorage.getItem("bharos_user")

        const snap = await getDocs(collection(db, "withdrawals"))

        const list: any[] = []

        snap.forEach((doc) => {
            const data: any = doc.data()

            if (data.userId === email) {
                list.push(data)
            }
        })

        setWithdraws(list.reverse())
    }

    const getStatusColor = (status: string) => {
        if (status === "approved") return "text-green-400"
        if (status === "rejected") return "text-red-400"
        return "text-yellow-400"
    }

    return (

        <div className="min-h-screen bg-[#0B0919] text-white p-6">

            <h1 className="text-3xl text-cyan-400 mb-8 font-bold">
                Withdraw History
            </h1>

            <div className="space-y-4">

                {withdraws.map((w, i) => (

                    <div key={i}
                        className="p-5 rounded-2xl border border-cyan-500/20 
  bg-[#1a1a2e] flex justify-between items-center
  hover:scale-[1.02] transition">

                        <div>
                            <p className="font-bold text-lg">
                                ${Number(w.amount || 0).toFixed(2)}
                            </p>
                            <p className="text-gray-400 text-sm">
                                {w.address}
                            </p>
                            <p className="text-gray-500 text-xs">
                                {w.createdAt?.toDate?.().toLocaleString() || "N/A"}
                            </p>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(w.status)}`}>
                            {w.status}
                        </span>

                    </div>

                ))}

            </div>

        </div>
    )
}