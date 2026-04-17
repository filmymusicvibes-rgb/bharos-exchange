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
    const [cooldownRemaining, setCooldownRemaining] = useState(0) // seconds remaining

    // Load user's profile wallet address + check 24hr cooldown
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
                // Check 24hr cooldown
                if (data.lastWithdrawalAt) {
                    const lastTime = data.lastWithdrawalAt.seconds
                        ? data.lastWithdrawalAt.seconds * 1000
                        : new Date(data.lastWithdrawalAt).getTime()
                    const diff = Date.now() - lastTime
                    const cooldownMs = 24 * 60 * 60 * 1000 // 24 hours
                    if (diff < cooldownMs) {
                        setCooldownRemaining(Math.ceil((cooldownMs - diff) / 1000))
                    }
                }
            }
        }
        loadProfileWallet()
    }, [])

    // Countdown timer
    useEffect(() => {
        if (cooldownRemaining <= 0) return
        const timer = setInterval(() => {
            setCooldownRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [cooldownRemaining])

    // Format countdown
    const formatCooldown = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
    }
    // Validate address matches profile
    const validateAddress = (inputAddress: string) => {
        setAddress(inputAddress)
        setWalletError("")

        if (profileWallet && inputAddress && inputAddress.trim().toLowerCase() !== profileWallet.trim().toLowerCase()) {
            setWalletError("Address must match your profile BEP20 wallet address")
        }
    }

    const submitWithdraw = async () => {

        // 🔒 24hr cooldown check
        if (cooldownRemaining > 0) {
            alert(`⏰ Withdrawal locked! Please wait ${formatCooldown(cooldownRemaining)} before your next withdrawal.`)
            return
        }

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

            // 🔔 Notify admin via Telegram
            try {
                fetch('/api/notify-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'withdrawal',
                        userId: email,
                        amount: withdrawAmount,
                        address: address.trim()
                    })
                }).catch(() => {}) // Fire and forget — don't block user
            } catch (e) { /* silent */ }

            // 🔒 Save withdrawal timestamp for 24hr cooldown
            await updateDoc(userRef, {
                lastWithdrawalAt: new Date()
            })

            // Set cooldown for 24 hours
            setCooldownRemaining(24 * 60 * 60)

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

                {/* 🔒 24HR COOLDOWN WARNING */}
                {cooldownRemaining > 0 && (
                    <div className="relative mb-4">
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl blur-sm animate-pulse" />
                        <div className="relative bg-[#0d1117]/95 backdrop-blur-xl border border-red-500/25 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Lock className="w-5 h-5 text-red-400" />
                                <span className="text-red-400 font-bold text-sm">Withdrawal Locked</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-400 font-mono mb-1">
                                {formatCooldown(cooldownRemaining)}
                            </p>
                            <p className="text-[10px] text-gray-500">You can withdraw once every 24 hours</p>
                        </div>
                    </div>
                )}

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
                            disabled={loading || !!walletError || cooldownRemaining > 0}
                            className="w-full py-3.5 rounded-xl font-semibold text-black bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Submitting...
                                </span>
                            ) : cooldownRemaining > 0 ? (
                                <span className="flex items-center gap-2 text-gray-800">
                                    <Lock className="w-4 h-4" />
                                    🔒 Locked — {formatCooldown(cooldownRemaining)}
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
                        <div className="flex items-center gap-2 text-orange-400">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Withdrawal limit: <b>1 time per 24 hours</b></span>
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