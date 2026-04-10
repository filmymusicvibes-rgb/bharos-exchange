import { getUser } from "../lib/session"
import { useState } from "react"
import { db } from "../lib/firebase"
import { doc, getDoc, updateDoc, addDoc, collection, increment } from "firebase/firestore"
import { navigate } from "../lib/router"
import { Send, Coins, ArrowLeft, AlertTriangle, Zap, Shield, Info } from "lucide-react"

export default function TransferBRS() {

    const [userId, setUserId] = useState("")
    const [amount, setAmount] = useState("")
    const [loading, setLoading] = useState(false)

    const sendBRS = async () => {

        const senderEmail = getUser()

        if (!senderEmail) {
            alert("Login required")
            return
        }

        const receiverInput = userId.trim().toLowerCase()
        if (!receiverInput || !receiverInput.includes("@")) {
            alert("Enter a valid email address")
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

            // Direct lookup by email (Firestore doc ID = email)
            const receiverRef = doc(db, "users", receiverInput)
            const receiverSnap = await getDoc(receiverRef)

            if (!receiverSnap.exists()) {
                alert("Receiver not found — check email address")
                setLoading(false)
                return
            }

            const receiverUser: any = receiverSnap.data()
            const receiverEmail = receiverInput

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

            // 🔥 Atomic balance updates (prevents race conditions)
            await updateDoc(senderRef, {
                brsBalance: increment(-transferAmount)
            })

            await updateDoc(doc(db, "users", receiverEmail), {
                brsBalance: increment(transferAmount)
            })

            await addDoc(collection(db, "transactions"), {
                userId: senderEmail,
                type: "BRS_SEND",
                currency: "BRS",
                amount: -transferAmount,
                description: `BRS Transfer sent to ${receiverEmail}`,
                to: receiverEmail,
                createdAt: new Date()
            })

            await addDoc(collection(db, "transactions"), {
                userId: receiverEmail,
                type: "BRS_RECEIVE",
                currency: "BRS",
                amount: transferAmount,
                description: `BRS Transfer received from ${senderEmail}`,
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

        <div className="min-h-screen bg-[#050816] flex justify-center items-center px-4 relative overflow-hidden">

            {/* AMBIENT */}
            <div className="absolute top-[-15%] left-[-10%] w-[400px] h-[400px] bg-yellow-500/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full" />

            {/* BACK */}
            <button
                onClick={() => navigate("/dashboard")}
                className="absolute top-5 left-5 flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-gray-400 hover:text-white hover:border-cyan-500/30 transition-all z-10 text-sm"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>

            <div className="w-full max-w-md relative z-10 space-y-5">

                {/* HEADER */}
                <div className="text-center">
                    <div className="w-14 h-14 mx-auto bg-gradient-to-br from-yellow-500/15 to-amber-500/15 rounded-xl flex items-center justify-center border border-yellow-500/20 mb-3">
                        <Send className="w-7 h-7 text-yellow-400" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                        Send BRS
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Transfer BRS to other Bharos users</p>
                </div>

                {/* FORM CARD */}
                <div className="relative">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500/20 via-cyan-500/15 to-blue-500/20 rounded-2xl blur-sm" />
                    <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-7 space-y-5">

                        {/* RECEIVER */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block font-medium">Receiver Email Address</label>
                            <div className="relative">
                                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="e.g. user@gmail.com"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-yellow-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                                />
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1">Only registered Bharos users can receive BRS</p>
                        </div>

                        {/* AMOUNT */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block font-medium">Amount (BRS)</label>
                            <div className="relative">
                                <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Minimum 10 BRS"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-yellow-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* BUTTON */}
                        <button
                            onClick={sendBRS}
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl font-semibold text-black bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 transition-all duration-300 hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Sending...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    Send BRS
                                </span>
                            )}
                        </button>

                    </div>
                </div>

                {/* INFO */}
                <div className="relative">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl blur-sm" />
                    <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/8 rounded-xl p-4 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-yellow-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Minimum transfer: <b>10 BRS</b></span>
                        </div>
                        <div className="flex items-center gap-2 text-cyan-400">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Instant internal transfer</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-400">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Only Bharos users allowed</span>
                        </div>
                        <div className="flex items-center gap-2 text-red-400">
                            <Info className="w-3.5 h-3.5" />
                            <span>Wrong email address may result in loss</span>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    )
}