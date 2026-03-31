import { useState, useEffect } from "react"
import { getUser } from "@/lib/session"
import { db } from "@/lib/firebase"
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { navigate } from "@/lib/router"
import Navbar from "@/components/Navbar"
import { Coins, Wallet, ArrowRight, Copy, CheckCircle, AlertCircle, Shield, ChevronLeft, Send } from "lucide-react"

const COMPANY_BNB_WALLET = "0xa1B74920035258a4b6c31Eb6aC3529453fD249Cc"
const MIN_BRS = 500
const BNB_FEE_USD = 2 // $2 USDT worth of BNB

export default function WithdrawBRS() {
  const user = getUser()

  const [brsBalance, setBrsBalance] = useState(0)
  const [amount, setAmount] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [txHash, setTxHash] = useState("")
  const [step, setStep] = useState<"form" | "payment" | "confirm" | "success">("form")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) { navigate("/auth"); return }
    loadBalance()
  }, [])

  async function loadBalance() {
    const snap = await getDoc(doc(db, "users", user!))
    if (snap.exists()) {
      const data: any = snap.data()
      setBrsBalance(data.brsBalance || 0)
      setWalletAddress(data.walletAddress || "")
    }
  }

  function handleNext() {
    setError("")
    const amt = Number(amount)
    if (!amt || amt < MIN_BRS) {
      setError(`Minimum withdrawal is ${MIN_BRS} BRS`)
      return
    }
    if (amt > brsBalance) {
      setError("Insufficient BRS balance")
      return
    }
    if (!walletAddress || !walletAddress.startsWith("0x") || walletAddress.length !== 42) {
      setError("Enter a valid BEP20 wallet address")
      return
    }
    setStep("payment")
  }

  function copyAddress() {
    navigator.clipboard.writeText(COMPANY_BNB_WALLET)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function submitWithdrawal() {
    if (!txHash || txHash.length < 10) {
      setError("Enter a valid BNB transaction hash")
      return
    }
    setLoading(true)
    setError("")

    try {
      await addDoc(collection(db, "brs_withdrawals"), {
        userId: user,
        amount: Number(amount),
        walletAddress,
        bnbTxHash: txHash,
        feeUSD: BNB_FEE_USD,
        status: "pending",
        createdAt: serverTimestamp(),
      })
      setStep("success")
    } catch (err: any) {
      setError(err.message || "Failed to submit withdrawal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Back Button */}
        <button onClick={() => step === "form" ? navigate("/dashboard") : setStep("form")}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm mb-6 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          {step === "form" ? "Back to Dashboard" : "Back"}
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center">
            <Coins className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Withdraw BRS Tokens</h1>
            <p className="text-xs text-gray-500">Send BRS to your Trust Wallet</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-[#0d1117]/80 border border-amber-500/15 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Available BRS</p>
              <p className="text-2xl font-bold text-amber-400">{brsBalance.toLocaleString()} BRS</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">Min Withdrawal</p>
              <p className="text-sm text-gray-400">{MIN_BRS} BRS</p>
            </div>
          </div>
        </div>

        {/* ═══════ STEP 1: FORM ═══════ */}
        {step === "form" && (
          <div className="space-y-4">
            {/* Amount */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">BRS Amount</label>
              <div className="relative">
                <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/50" />
                <input
                  type="number"
                  placeholder={`Min ${MIN_BRS} BRS`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-20 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-amber-400/50 outline-none transition-all"
                />
                <button
                  onClick={() => setAmount(String(brsBalance))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-1 rounded-md hover:bg-amber-500/20 transition"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Wallet Address */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Your Trust Wallet Address (BEP20)</label>
              <div className="relative">
                <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/50" />
                <input
                  type="text"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-400/50 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Fee Info */}
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-blue-300 font-semibold mb-1">Network Fee Required</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    To process your BRS withdrawal, a network fee of <span className="text-amber-400 font-bold">${BNB_FEE_USD} USDT worth of BNB</span> is required.
                    This covers the BSC gas fee for token transfer to your wallet.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full py-3.5 rounded-xl font-semibold text-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ═══════ STEP 2: BNB PAYMENT ═══════ */}
        {step === "payment" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-[#0d1117]/80 border border-white/10 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Withdraw Amount</span>
                <span className="text-amber-400 font-bold">{Number(amount).toLocaleString()} BRS</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">To Wallet</span>
                <span className="text-cyan-400 font-mono text-xs">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                <span className="text-gray-400">Network Fee</span>
                <span className="text-green-400 font-bold">${BNB_FEE_USD} (BNB)</span>
              </div>
            </div>

            {/* Pay BNB Instructions */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
              <p className="text-amber-400 text-sm font-semibold mb-3">📤 Send ${BNB_FEE_USD} worth of BNB to:</p>

              <div className="bg-black/40 rounded-lg p-3 flex items-center justify-between gap-2 mb-3">
                <p className="text-white font-mono text-[11px] break-all">{COMPANY_BNB_WALLET}</p>
                <button onClick={copyAddress} className="shrink-0">
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400 hover:text-white transition" />
                  )}
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] text-gray-400">
                <p>• Send on <span className="text-amber-400 font-semibold">BNB Smart Chain (BEP20)</span> network only</p>
                <p>• Amount: <span className="text-white font-semibold">${BNB_FEE_USD} USDT worth of BNB</span></p>
                <p>• After sending, paste the transaction hash below</p>
              </div>
            </div>

            {/* TX Hash Input */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">BNB Transaction Hash</label>
              <div className="relative">
                <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400/50" />
                <input
                  type="text"
                  placeholder="0x..."
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-green-400/50 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={submitWithdrawal}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Submit Withdrawal
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ═══════ STEP 3: SUCCESS ═══════ */}
        {step === "success" && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Withdrawal Submitted! 🎉</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
              Your BRS withdrawal request has been submitted. Admin will verify your BNB payment and transfer {Number(amount).toLocaleString()} BRS to your wallet within 24 hours.
            </p>

            <div className="bg-[#0d1117]/80 border border-white/10 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="text-amber-400 font-bold">{Number(amount).toLocaleString()} BRS</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">To</span>
                <span className="text-cyan-400 font-mono text-xs">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fee Paid</span>
                <span className="text-green-400">${BNB_FEE_USD} BNB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="text-yellow-400 font-semibold">⏳ Pending Review</span>
              </div>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 rounded-xl font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
