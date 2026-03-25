import { useState } from "react"
import { db } from "../lib/firebase"
import { doc, getDoc, updateDoc, addDoc, collection, getDocs } from "firebase/firestore"
import { navigate } from "../lib/router"

export default function TransferBRS() {

    const [userId, setUserId] = useState("")
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)

    const sendBRS = async () => {

        const senderEmail = localStorage.getItem("bharos_user")

        if (!senderEmail) {
            alert("Login required")
            return
        }

        const receiverInput = userId.trim()
        if (!receiverInput) {
            alert("Enter valid receiver referral code")
            return
        }

        const transferAmount = Number(amount)

        if (!transferAmount || transferAmount < 10) {
            alert("Minimum transfer is 10 BRS")
            return
        }

        setLoading(true)

        try {

            const senderRef = doc(db, "users", senderEmail)
            const senderSnap = await getDoc(senderRef)

            if (!senderSnap.exists()) {
                alert("Sender not found")
                setLoading(false)
                return
            }

            const sender: any = senderSnap.data()
            const senderBalance = sender.brsBalance || 0

            if (senderBalance < transferAmount) {
                alert("Insufficient BRS balance")
                setLoading(false)
                return
            }

            const usersSnap = await getDocs(collection(db, "users"))

            let receiverUser: any = null

            usersSnap.forEach((doc) => {
                const d: any = doc.data()

                // 🔥 IMPORTANT: match correct field
                if (d.referralCode === receiverInput) {
                    receiverUser = d
                }
            })

            if (!receiverUser) {
                alert("Receiver not found")
                setLoading(false)
                return
            }

            const receiverEmail = receiverUser.email

            if (senderEmail === receiverEmail) {
                alert("You cannot send to yourself")
                setLoading(false)
                return
            }

            if (receiverUser.status !== "active") {
                alert("User not active")
                setLoading(false)
                return
            }

            const receiverBalance = receiverUser.brsBalance || 0

            await updateDoc(senderRef, {
                brsBalance: senderBalance - transferAmount
            })

            await updateDoc(doc(db, "users", receiverEmail), {
                brsBalance: receiverBalance + transferAmount
            })

            // ADD TRANSACTION LOGS
            await addDoc(collection(db, "transactions"), {
                userId: senderEmail,
                type: "BRS_SEND",
                amount: transferAmount,
                to: receiverEmail,
                createdAt: new Date()
            })

            await addDoc(collection(db, "transactions"), {
                userId: receiverEmail,
                type: "BRS_RECEIVE",
                amount: transferAmount,
                from: senderEmail,
                createdAt: new Date()
            })

            alert("✅ Transfer successful")

            setUserId("")
            setAmount("")

            navigate("/dashboard")

        } catch (err) {

            console.error(err)
            alert("Transfer failed")

        }

        setLoading(false)

    }

    return (

        <div className="min-h-screen bg-[#0B0919] flex justify-center items-center px-4">

            <div className="w-full max-w-[600px] space-y-6">

                <h1 className="text-3xl sm:text-4xl text-center font-bold text-cyan-400">
                    Send BRS
                </h1>

                <div className="bg-[#1a1a2e] p-8 rounded-2xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10">

                    <p className="text-gray-400 mb-2">
                        Receiver Referral Code
                    </p>

                    <input
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="e.g. BRS12345"
                        className="w-full p-3 mb-2 bg-[#0B0919] text-white placeholder-gray-400 rounded-lg border border-cyan-500/20 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 outline-none"
                    />

                    <p className="text-xs text-gray-500 mb-4">
                        Only registered Bharos users can receive BRS
                    </p>

                    <p className="text-gray-400 mb-2">
                        Amount (BRS)
                    </p>

                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Minimum 10 BRS"
                        className="w-full p-3 mb-6 bg-[#0B0919] text-white placeholder-gray-400 rounded-lg border border-cyan-500/20 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 outline-none"
                    />

                    <button
                        onClick={sendBRS}
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.7)] hover:scale-105 disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send BRS"}
                    </button>

                </div>

                {/* INFO */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-300 space-y-2">
                    <p>⚠ Minimum transfer: <b>10 BRS</b></p>
                    <p>⚡ Instant internal transfer</p>
                    <p>🔐 Only Bharos users allowed</p>
                    <p>❗ Wrong referral code may result in loss</p>
                </div>

            </div>

        </div>
    )
}