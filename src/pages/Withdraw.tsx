import { useState, useEffect } from "react"
import { db } from "../lib/firebase"
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore"
import { navigate } from "../lib/router"

export default function Withdraw() {

    const [amount, setAmount] = useState("")
    const [address, setAddress] = useState("")
    const [loading, setLoading] = useState(false)
    const [profileWallet, setProfileWallet] = useState("")
    const [walletError, setWalletError] = useState("")

    // Load user's profile wallet address
    useEffect(() => {
        const loadProfileWallet = async () => {
            const email = localStorage.getItem("bharos_user")
            if (!email) return

            const snap = await getDoc(doc(db, "users", email))
            if (snap.exists()) {
                const data: any = snap.data()
                if (data.walletAddress) {
                    setProfileWallet(data.walletAddress)
                    setAddress(data.walletAddress) // Auto-fill
                }
            }
        }
        loadProfileWallet()
    }, [])

    // Validate address matches profile
    const validateAddress = (inputAddress: string) => {
        setAddress(inputAddress)
        setWalletError("")

        if (profileWallet && inputAddress && inputAddress.trim().toLowerCase() !== profileWallet.trim().toLowerCase()) {
            setWalletError("⚠️ Address must match your profile BEP20 wallet address. Go to Profile to update.")
        }
    }

    const submitWithdraw = async () => {

        const email = localStorage.getItem("bharos_user")

        if (!email) {
            alert("User not logged in")
            return
        }

        const withdrawAmount = Number(amount)

        // 🔒 STRICT VALIDATION
        if (!withdrawAmount || isNaN(withdrawAmount)) {
            alert("Enter valid amount")
            return
        }

        if (withdrawAmount < 5) {
            alert("Minimum withdrawal is 5 USDT")
            return
        }

        if (!address || address.length < 10) {
            alert("Enter valid wallet address")
            return
        }

        if (!address.startsWith("0x")) {
            alert("Only BEP-20 (0x...) address allowed")
            return
        }

        // 🔒 PROFILE WALLET MATCH CHECK
        if (profileWallet && address.trim().toLowerCase() !== profileWallet.trim().toLowerCase()) {
            alert("❌ Withdrawal address must match your profile BEP20 wallet address!\n\nGo to Profile → Update your BEP20 address first.")
            return
        }

        // 🔒 NO WALLET IN PROFILE
        if (!profileWallet) {
            alert("⚠️ Please save your BEP20 wallet address in Profile first before withdrawing.")
            return
        }

        try {

            const userRef = doc(db, "users", email)
            const snap = await getDoc(userRef)

            if (!snap.exists()) {
                alert("User not found")
                return
            }

            const user: any = snap.data()

            const balance = user.usdtBalance || 0
            const frozen = user.usdtFrozen || 0
            const available = balance - frozen

            if (available < withdrawAmount) {
                alert("Insufficient balance")
                return
            }

            setLoading(true)

            // 🔒 FREEZE FUNDS
            await updateDoc(userRef, {
                usdtFrozen: frozen + withdrawAmount
            })

            // 🔒 SAVE REQUEST
            await addDoc(collection(db, "withdrawals"), {
                userId: email,
                amount: withdrawAmount,
                address: address.trim(),
                status: "pending",
                createdAt: new Date()
            })

            alert("✅ Withdraw request submitted")

            setAmount("")
            setAddress("")

            navigate("/dashboard")

        } catch (err) {
            console.error(err)
            alert("Withdraw failed")
        }

        setLoading(false)
    }

    return (

        <div className="min-h-screen bg-[#0B0919] text-white flex justify-center items-center px-4">

            <div className="w-full max-w-[600px] space-y-6">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-3xl sm:text-4xl text-center sm:text-left font-bold text-cyan-400">
                        Withdraw USDT
                    </h1>
                    <button 
                        onClick={() => navigate("/withdraw-history")}
                        className="w-full sm:w-auto px-6 py-2 bg-[#1a1a2e] border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors font-semibold"
                    >
                        History
                    </button>
                </div>

                <div className="bg-[#1a1a2e] p-8 rounded-2xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10">

                    <p className="text-gray-400 mb-2">Withdraw Amount</p>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Minimum 5 USDT"
                        className="w-full p-3 mb-6 bg-[#0B0919] text-white placeholder-gray-400 rounded-lg border border-cyan-500/20 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 outline-none"
                    />

                    <p className="text-gray-400 mb-2">Wallet Address (BEP20)</p>

                    {/* Show locked profile wallet info */}
                    {profileWallet && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2.5 mb-2 flex items-center gap-2">
                            <span className="text-green-400 text-xs">🔒 Profile Wallet:</span>
                            <span className="text-green-300 text-xs font-mono truncate">{profileWallet}</span>
                        </div>
                    )}

                    {!profileWallet && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5 mb-2">
                            <p className="text-yellow-300 text-xs">
                                ⚠️ No wallet address in profile. <span onClick={() => navigate("/profile")} className="text-cyan-400 cursor-pointer underline">Set it now →</span>
                            </p>
                        </div>
                    )}

                    <input
                        value={address}
                        onChange={(e) => validateAddress(e.target.value)}
                        placeholder="0x..."
                        className={`w-full p-3 mb-1 bg-[#0B0919] text-white placeholder-gray-400 rounded-lg border outline-none ${
                            walletError
                                ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400'
                                : 'border-cyan-500/20 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400'
                        }`}
                    />

                    {walletError && (
                        <p className="text-red-400 text-xs mb-4 animate-pulse">{walletError}</p>
                    )}

                    {!walletError && <div className="mb-6" />}

                    <button
                        onClick={submitWithdraw}
                        disabled={loading || !!walletError}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.7)] hover:scale-105 disabled:opacity-50"
                    >
                        {loading ? "Submitting..." : "Request Withdrawal"}
                    </button>

                </div>

                {/* INFO BOX */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-300 space-y-2">

                    <p>⚠️ Minimum withdrawal: <b>5 USDT</b></p>

                    <p>⏳ Processing time: <b>Within 24 hours</b></p>

                    <p>🔐 Network: <b>BEP20 (BSC)</b></p>

                    <p>🔒 Withdrawal address must match your <b>Profile wallet</b></p>

                    <p>❗ Wrong address may result in permanent loss</p>

                </div>

            </div>

        </div>
    )
}