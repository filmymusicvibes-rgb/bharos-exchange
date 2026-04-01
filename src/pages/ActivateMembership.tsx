import { getUser } from "../lib/session"
import { useState, useEffect, useRef } from "react"
import { db } from "../lib/firebase"
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { navigate } from "../lib/router"
import { detectPayment } from "../lib/bscscan"
import { logTransaction, runFullActivation } from "../lib/commission"
import qrBharos from "../assets/qr-bharos.jpeg"
import { AlertTriangle, CheckCircle, XCircle, Search, Copy, Zap, PartyPopper, X, ArrowLeft, Shield } from "lucide-react"

type PaymentStep = "send" | "waiting" | "activating" | "done" | "failed"

function ActivateMembership() {

  const [step, setStep] = useState<PaymentStep>("send")
  const [pollCount, setPollCount] = useState(0)
  const [verifiedAmount, setVerifiedAmount] = useState(0)
  const [showWarning, setShowWarning] = useState(true)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxPolls = 30 // 30 × 10 sec = 5 minutes

  const PAYMENT_AMOUNT = 12

  // 🔒 Check status on load
  useEffect(() => {
    const init = async () => {
      const email = getUser()
      if (!email) return

      const userRef = doc(db, "users", email)
      const userSnap = await getDoc(userRef)
      if (!userSnap.exists()) return

      const data: any = userSnap.data()

      if (data.status === "active") {
        navigate("/dashboard")
        return
      }

      // 🔄 Auto-resume if left page during verification
      if (data.status === "awaiting_verification") {
        setShowWarning(false)
        startPolling()
      }
    }

    init()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  // 🔒 Reset user status back to inactive
  const resetUserStatus = async () => {
    const email = getUser()
    if (!email) return
    try {
      await updateDoc(doc(db, "users", email), { status: "inactive" })
    } catch (err) {
      console.error("Reset status error:", err)
    }
  }

  // 🔍 Start auto-detection
  const startPolling = async () => {
    const email = getUser()
    if (!email) return

    setStep("waiting")
    setPollCount(0)

    // Save state
    try {
      const userRef = doc(db, "users", email)
      const snap = await getDoc(userRef)
      if (snap.exists()) {
        const data: any = snap.data()
        if (data.status !== "awaiting_verification") {
          await updateDoc(userRef, {
            status: "awaiting_verification",
            verificationStartedAt: new Date()
          })
        }
      }
    } catch (err) {
      console.error("Status update error:", err)
    }

    // Get used hashes
    const depositsSnap = await getDocs(collection(db, "deposits"))
    const usedHashes = depositsSnap.docs
      .map((d: any) => d.data().txHash?.toLowerCase())
      .filter(Boolean)

    if (pollRef.current) clearInterval(pollRef.current)

    // Immediate check
    const immediateResult = await detectPayment(PAYMENT_AMOUNT, usedHashes)
    if (immediateResult.verified) {
      setVerifiedAmount(immediateResult.amount!)
      await activateUser(immediateResult.amount!, email, immediateResult.from!)
      return
    }

    let count = 0

    pollRef.current = setInterval(async () => {
      count++
      setPollCount(count)

      if (count >= maxPolls) {
        if (pollRef.current) clearInterval(pollRef.current)
        await resetUserStatus()
        setStep("failed")
        return
      }

      try {
        const result = await detectPayment(PAYMENT_AMOUNT, usedHashes)
        if (result.verified) {
          if (pollRef.current) clearInterval(pollRef.current)
          setVerifiedAmount(result.amount!)
          await activateUser(result.amount!, email, result.from!)
        }
      } catch (err) {
        console.error("Poll error:", err)
      }
    }, 10000)
  }

  // ❌ Cancel scanning
  const cancelScanning = async () => {
    if (pollRef.current) clearInterval(pollRef.current)
    await resetUserStatus()
    setStep("send")
  }

  // ✅ ACTIVATE
  const activateUser = async (amount: number, email: string, fromAddress: string) => {
    setStep("activating")

    try {
      await addDoc(collection(db, "deposits"), {
        userId: email,
        amount: amount,
        status: "verified",
        verifiedBy: "blockchain-rpc",
        fromAddress: fromAddress,
        toAddress: "0xCD72FfF7F22eC409FCAcED1A06AEC227da6C1A56",
        createdAt: new Date()
      })

      await updateDoc(doc(db, "users", email), {
        status: "active",
        brsBalance: increment(150),
        activatedAt: new Date()
      })

      await logTransaction(email, 150, "BRS", "Membership activation reward")
      await runFullActivation(email)

      setStep("done")
      setTimeout(() => navigate("/dashboard"), 3000)
    } catch (err) {
      console.error(err)
      await resetUserStatus()
      setStep("failed")
    }
  }

  const formatTime = (polls: number) => {
    const seconds = polls * 10
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">

      {/* AMBIENT */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-yellow-500/5 blur-[120px] rounded-full" />

      {/* BACK */}
      <button
        onClick={() => navigate("/dashboard")}
        className="absolute top-5 left-5 flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-gray-400 hover:text-white hover:border-cyan-500/30 transition-all z-20 text-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      {/* ═══ IMPORTANT WARNING POPUP ═══ */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-5">
          <div className="relative w-full max-w-md animate-scale-in">
            <div className="absolute -inset-[1px] bg-gradient-to-br from-amber-500/30 to-red-500/30 rounded-2xl blur-md" />

            <button
              onClick={() => setShowWarning(false)}
              className="absolute -top-2 -right-2 z-20 w-7 h-7 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <X className="w-3.5 h-3.5 text-gray-300" />
            </button>

            <div className="relative bg-[#0d1117]/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-gradient-to-b from-amber-500/20 to-transparent blur-[60px] rounded-full" />

              <div className="relative p-7">
                <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-amber-400" />
                </div>

                <h3 className="text-lg font-bold text-center text-white mb-4">Important — Read Before Sending</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-300">Membership fee: <b className="text-white">12 USDT</b> (network/platform fee extra)</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-300">Our wallet must receive at least <b className="text-white">12 USDT</b> — sending less will <b className="text-red-400">NOT</b> be verified</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-300">If your exchange charges fee, send extra (e.g., 13 USDT if 1 USDT fee)</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-300">Use <b className="text-white">BNB Smart Chain (BEP20)</b> only — wrong network = <b className="text-red-400">permanent loss</b></p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-300">Wrong address = <b className="text-red-400">permanent loss of funds</b></p>
                  </div>
                  <div className="flex items-start gap-2.5 pt-1 border-t border-white/5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-green-300">Payment verified instantly on blockchain — auto-detect</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowWarning(false)}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20"
                >
                  I Understand — Continue to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center min-h-screen p-4 pt-16 relative z-10">
        <div className="w-full max-w-xl">

          {/* TITLE */}
          <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Activate Membership
          </h1>

          {/* ✅ SUCCESS */}
          {step === "done" && (
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-sm" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-green-500/15 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <PartyPopper className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-green-400 mb-2">Payment Verified!</h2>
                <p className="text-green-300 text-sm">{verifiedAmount.toFixed(2)} USDT verified on blockchain</p>
                <p className="text-green-300 text-sm mt-1">150 BRS credited to your wallet</p>
                <p className="text-xs text-gray-500 mt-4">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {/* ⚡ ACTIVATING */}
          {step === "activating" && (
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-sm" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-cyan-500/15 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-cyan-400 mb-2">Payment Verified! Activating...</h2>
                <p className="text-gray-400 text-sm">Setting up your account & distributing rewards...</p>
              </div>
            </div>
          )}

          {/* ❌ FAILED */}
          {step === "failed" && (
            <div className="relative">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur-sm" />
              <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-red-500/15 rounded-2xl p-6">
                <div className="text-center mb-5">
                  <div className="w-14 h-14 mx-auto bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-3">
                    <XCircle className="w-7 h-7 text-red-400" />
                  </div>
                  <h2 className="text-lg font-bold text-red-400 mb-2">Payment Not Detected</h2>
                  <p className="text-gray-400 text-xs">
                    We could not find a valid payment of minimum 12 USDT to our wallet.
                  </p>
                </div>

                <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 mb-5 space-y-1.5">
                  <p className="text-xs text-amber-400 font-semibold mb-2">Possible reasons:</p>
                  <p className="text-[11px] text-gray-400">• Amount was less than 12 USDT</p>
                  <p className="text-[11px] text-gray-400">• Payment sent on wrong network (not BEP20)</p>
                  <p className="text-[11px] text-gray-400">• Transaction still processing — wait and try again</p>
                  <p className="text-[11px] text-gray-400">• Wrong wallet address</p>
                </div>

                <button
                  onClick={() => setStep("send")}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* 📤 SEND & DETECT */}
          {(step === "send" || step === "waiting") && (
            <>
              {/* STEP 1: SEND */}
              <div className="relative mb-5">
                <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur-sm" />
                <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg mb-5 flex items-center gap-2.5 font-semibold">
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    Send USDT
                  </h2>

                  <div className="glass-shield rounded-xl p-4 mb-5">
                    <p className="text-[10px] text-yellow-300/80 mb-1 relative z-10">Membership Fee</p>
                    <p className="text-3xl font-bold text-yellow-400 relative z-10">12 USDT</p>
                    <p className="text-[10px] text-gray-500 mt-1 relative z-10">+ Network fee (if applicable from your exchange)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
                    <div>
                      <p className="text-[10px] text-gray-500">Network</p>
                      <p className="text-yellow-400 font-semibold text-xs">BNB Smart Chain (BEP20)</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Token</p>
                      <p className="text-green-400 font-semibold text-xs">USDT (BEP20)</p>
                    </div>
                  </div>

                  <p className="mb-2 text-gray-500 text-[10px] uppercase tracking-wider">Deposit Address</p>
                  <div className="flex gap-2 mb-5">
                    <input
                      value="0xCD72FfF7F22eC409FCAcED1A06AEC227da6C1A56"
                      readOnly
                      className="w-full p-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-mono text-white"
                    />
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText("0xCD72FfF7F22eC409FCAcED1A06AEC227da6C1A56")
                          alert("Address copied!")
                        } catch { alert("Copy failed") }
                      }}
                      className="px-5 py-3 rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-105 transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>

                  <div className="flex justify-center">
                    <div className="bg-white p-2 rounded-xl">
                      <img src={qrBharos} alt="QR Code" className="rounded-lg" width={160} height={160} />
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: AUTO-DETECT */}
              <div className="relative mb-5">
                <div className="absolute -inset-[1px] bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-xl blur-sm" />
                <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg mb-5 flex items-center gap-2.5 font-semibold">
                    <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    {step === "waiting" ? "Detecting Payment..." : "Confirm Payment"}
                  </h2>

                  {step === "waiting" && (
                    <div className="text-center space-y-4">
                      <div className="relative mx-auto w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-[3px] border-cyan-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-cyan-400 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Search className="w-5 h-5 text-cyan-400" />
                        </div>
                      </div>

                      <p className="text-cyan-400 font-semibold text-sm">Scanning Blockchain...</p>
                      <p className="text-gray-500 text-xs">Looking for your payment (minimum 12 USDT)</p>

                      <div className="bg-green-500/5 border border-green-500/15 rounded-lg p-2.5">
                        <p className="text-green-400 text-[10px] flex items-center justify-center gap-1.5">
                          <CheckCircle className="w-3 h-3" /> Safe to close — verification resumes when you return
                        </p>
                      </div>

                      <div className="w-full bg-white/5 rounded-full h-2 border border-white/5">
                        <div
                          className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min((pollCount / maxPolls) * 100, 100)}%` }}
                        ></div>
                      </div>

                      <p className="text-gray-600 text-[10px]">Elapsed: {formatTime(pollCount)} / 5:00</p>

                      <button
                        onClick={cancelScanning}
                        className="text-red-400/60 text-xs hover:text-red-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {step === "send" && (
                    <>
                      <p className="text-gray-400 text-xs mb-4">
                        After sending <span className="text-yellow-400 font-bold">12 USDT</span> (+ network fee), click below. Payment will be <b className="text-cyan-400">automatically detected</b> on blockchain.
                      </p>

                      <button
                        onClick={startPolling}
                        className="w-full py-3.5 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/20"
                      >
                        I Have Sent Payment
                      </button>

                      <p className="text-center text-gray-600 text-[10px] mt-3">
                        Payment is automatically detected on BSC blockchain
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* READ AGAIN */}
              <button
                onClick={() => setShowWarning(true)}
                className="w-full py-2.5 rounded-xl text-[10px] text-gray-500 hover:text-amber-400 transition border border-white/5 bg-white/[0.02] hover:border-amber-500/20 flex items-center justify-center gap-1.5 mb-5"
              >
                <AlertTriangle className="w-3 h-3" /> Read Important Warning Again
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default ActivateMembership