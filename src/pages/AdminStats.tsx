import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { collection, getDocs } from "firebase/firestore"

export default function AdminStats() {

    const [users, setUsers] = useState(0)
    const [active, setActive] = useState(0)
    const [deposits, setDeposits] = useState(0)
    const [withdraws, setWithdraws] = useState(0)
    const [brsSupply, setBrsSupply] = useState(0)
    const [profit, setProfit] = useState(0)

    useEffect(() => {

        loadStats()

        const interval = setInterval(() => {
            loadStats()
        }, 10000) // every 10 sec

        return () => clearInterval(interval)

    }, [])

    async function loadStats() {

        const [usersSnap, depSnap, withSnap] = await Promise.all([
            getDocs(collection(db, "users")),
            getDocs(collection(db, "deposits")),
            getDocs(collection(db, "withdrawals"))
        ])

        let totalUsers = 0
        let activeUsers = 0
        let totalBRS = 0

        usersSnap.forEach((doc) => {

            const data: any = doc.data()

            totalUsers++

            if (data.status === "active") {
                activeUsers++
            }

            totalBRS += data.brsBalance || 0

        })

        setUsers(totalUsers)
        setActive(activeUsers)
        setBrsSupply(totalBRS)

        let totalDeposits = 0

        depSnap.forEach((doc) => {

            const data: any = doc.data()

            if (data.status === "approved") {
                totalDeposits += Number(data.amount || 0)
            }

        })

        setDeposits(totalDeposits)

        let totalWithdraw = 0

        withSnap.forEach((doc) => {

            const data: any = doc.data()

            if (data.status === "approved") {
                totalWithdraw += Number(data.amount || 0)
            }

        })

        setWithdraws(totalWithdraw)

        setProfit(totalDeposits - totalWithdraw)

    }

    return (

        <div className="bg-[#1a1a2e] p-8 rounded-xl mb-10">

            <h2 className="text-3xl font-bold mb-6 text-[#00d4ff]">
                Admin Overview
            </h2>

            <div className="grid md:grid-cols-3 grid-cols-1 gap-6">

                <div className="bg-[#0B0919] p-6 rounded">
                    <p className="text-gray-400">Total Users</p>
                    <p className="text-3xl font-bold">{users}</p>
                </div>

                <div className="bg-[#0B0919] p-6 rounded">
                    <p className="text-gray-400">Active Members</p>
                    <p className="text-3xl font-bold text-green-400">{active}</p>
                </div>

                <div className="bg-[#0B0919] p-6 rounded">
                    <p className="text-gray-400">Total Deposits</p>
                    <p className="text-3xl font-bold text-yellow-400">${deposits}</p>
                </div>

                <div className="bg-[#0B0919] p-6 rounded">
                    <p className="text-gray-400">Total Withdraw</p>
                    <p className="text-3xl font-bold text-red-400">${withdraws}</p>
                </div>

                <div className="bg-[#0B0919] p-6 rounded">
                    <p className="text-gray-400">Company Profit</p>
                    <p className="text-3xl font-bold text-cyan-400">${profit}</p>
                </div>

                <div className="bg-[#0B0919] p-6 rounded">
                    <p className="text-gray-400">BRS Distributed</p>
                    <p className="text-3xl font-bold text-purple-400">{brsSupply}</p>
                </div>

            </div>

        </div>

    )

}