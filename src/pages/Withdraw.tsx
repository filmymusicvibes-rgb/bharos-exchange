import { getUser } from "../lib/session"
import { useState, useEffect } from "react"
import { db } from "../lib/firebase"
import { collection, addDoc, doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { navigate } from "../lib/router"
import { Wallet, DollarSign, ArrowLeft, AlertTriangle, Clock, Shield, Lock, Info } from "lucide-react"

export default function Withdraw() {

    const [amount, setAmount] = useState("")
    const [address, setAddress] = useState("")
    const [loading, setLoading] = useState(false)
    const [profileWallet, setProfileWallet] = useState("")
    const [walletError, setWalletError] = useState("")

    // Load user's profile wallet address
    useEffect(() => {
        const loadProfileWallet = async () => {
            const email = getUser()
            if (!email) return

            const snap = await getDoc(doc(db, "users", email))
            if (snap.exists()) {
                const data: any = snap.data()
                if (data.walletAddress) {
                    setProfileWallet(data.walletAddress)
                    setAddress(data.walletAddress)
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
            setWalletError("Address must match your profile BEP20 wallet address")
        }
    }

    const submitWithdraw = async () => {

        const email = getUser()

        if (!email) {
            alert("User not logged in")
            return
        }

        const withdrawAmount = Number(amount)

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

        if (profileWallet && address.trim().toLowerCase() !== profileWallet.trim().toLowerCase()) {
            alert("❌ Withdrawal address must match your profile BEP20 wallet address!\n\nGo to Profile → Update your BEP20 address first.")
            return
        }

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

            // 🔥 Atomic freeze (prevents race condition)
            await updateDoc(userRef, {
                usdtFrozen: increment(withdrawAmount)
            })

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

        <div className="min-h-screen bg-[#050816] text-white flex justify-center items-center px-4 relative overflow-hidden">

            {/* AMBIENT */}
            <div className="absolute top-[-15%] right-[-10%] w-[400px] h-[400px] bg-green-500/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full" />

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
                    <div className="w-14 h-14 mx-auto bg-gradient-to-br from-green-500/15 to-emerald-500/15 rounded-xl flex items-center justify-center border border-green-500/20 mb-3">
                        <Wallet className="w-7 h-7 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        Withdraw USDT
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Withdraw to your BEP20 wallet</p>
                </div>

                {/* FORM CARD */}
                <div className="relative">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-green-500/20 via-cyan-500/15 to-blue-500/20 rounded-2xl blur-sm" />
                    <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-7 space-y-5">

                        {/* AMOUNT */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block font-medium">Withdraw Amount</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Minimum 5 USDT"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-green-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* WALLET ADDRESS */}
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block font-medium">Wallet Address (BEP20)</label>

                            {/* Profile wallet locked info */}
                            {profileWallet && (
                                <div className="flex items-center gap-2 bg-green-500/5 border border-green-500/15 rounded-lg px-3 py-2 mb-2">
                                    <Lock className="w-3.5 h-3.5 text-green-400" />
                                    <span className="text-green-400 text-[10px] font-mono truncate">{profileWallet}</span>
                                </div>
                            )}

                            {!profileWallet && (
                                <div className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/15 rounded-lg px-3 py-2 mb-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                                    <p className="text-yellow-400 text-[10px]">
                                        No wallet in profile.{" "}
                                        <span onClick={() => navigate("/profile")} className="text-cyan-400 cursor-pointer underline">Set it now →</span>
                                    </p>
                                </div>
                            )}

                            <div className="relative">
                                <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    value={address}
                                    onChange={(e) => validateAddress(e.target.value)}
                                    placeholder="0x..."
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-500 outline-none transition-all duration-300 ${
                                        walletError
                                            ? 'border-red-500/30 focus:border-red-400/50'
                                            : 'border-white/10 focus:border-green-400/50 focus:bg-white/8'
                                    }`}
                                />
                            </div>

                            {walletError && (
                                <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {walletError}
                                </p>
                            )}
                        </div>

                        {/* BUTTON */}
                        <button
                            onClick={submitWithdraw}
                            disabled={loading || !!walletError}
                            className="w-full py-3.5 rounded-xl font-semibold text-black bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Submitting...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Wallet className="w-4 h-4" />
                                    Request Withdrawal
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
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Minimum withdrawal: <b>5 USDT</b></span>
                        </div>
                        <div className="flex items-center gap-2 text-cyan-400">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Processing time: <b>Within 24 hours</b></span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-400">
                            <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Network: <b>BEP20 (BSC)</b></span>
                        </div>
                        <div className="flex items-center gap-2 text-green-400">
                            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Address must match your <b>Profile wallet</b></span>
                        </div>
                        <div className="flex items-center gap-2 text-red-400">
                            <Info className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Wrong address may result in permanent loss</span>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    )
}