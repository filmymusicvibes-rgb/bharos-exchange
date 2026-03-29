import { useState, useEffect, useRef } from "react"
import { db } from "../lib/firebase"
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { navigate } from "../lib/router"
import { detectPayment, verifyTransaction, isApiKeyConfigured } from "../lib/bscscan"
import { logTransaction, runFullActivation } from "../lib/commission"
import qrBharos from "../assets/qr-bharos.jpeg"

type PaymentStep = "send" | "waiting" | "activating" | "done" | "fallback"

function ActivateMembership() {

  const [step, setStep] = useState<PaymentStep>("send")
  const [pollCount, setPollCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")
  const [verifiedAmount, setVerifiedAmount] = useState(0)

  // Fallback TXID mode
  const [txid, setTxid] = useState("")
  const [fallbackLoading, setFallbackLoading] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxPolls = 90 // 90 × 10 sec = 15 minutes

  const PAYMENT_AMOUNT = 12

  // 🔒 Check status on load — ALSO resumes verification if user left page
  useEffect(() => {
    const init = async () => {
      const email = localStorage.getItem("bharos_user")
      if (!email) return

      const userRef = doc(db, "users", email)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) return

      const data: any = userSnap.data()

      // ✅ Already active → go to dashboard
      if (data.status === "active") {
        navigate("/dashboard")
        return
      }

      // 🔄 RESUME: User left page during verification → auto-resume polling!
      if (data.status === "awaiting_verification") {
        setStep("waiting")
        startPolling()
        return
      }

      // Check pending deposit
      const q = query(
        collection(db, "deposits"),
        where("userId", "==", email),
        where("status", "==", "pending")
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        alert("⚡ Your activation is already in process.")
        navigate("/dashboard")
      }
    }

    init()

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // 🔍 Start auto-detection polling
  const startPolling = async () => {

    const email = localStorage.getItem("bharos_user")
    if (!email) return

    setStep("waiting")
    setPollCount(0)
    setErrorMsg("")

    // 💾 SAVE STATE TO FIRESTORE — survives page close/back!
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
      console.error("Save state error:", err)
    }

    // Get used TXID hashes to avoid duplicates
    const depositsSnap = await getDocs(collection(db, "deposits"))
    const usedHashes = depositsSnap.docs
      .map((d: any) => d.data().txHash?.toLowerCase())
      .filter(Boolean)

    // 🛑 Clear any existing polling
    if (pollRef.current) clearInterval(pollRef.current)

    // Start polling every 10 seconds
    pollRef.current = setInterval(async () => {

      setPollCount(prev => {
        const newCount = prev + 1

        if (newCount >= maxPolls) {
          if (pollRef.current) clearInterval(pollRef.current)
          setStep("fallback")
          return newCount
        }

        return newCount
      })

      // 📡 Check BSCScan for matching payment
      const result = await detectPayment(PAYMENT_AMOUNT, usedHashes)

      if (result.verified) {
        if (pollRef.current) clearInterval(pollRef.current)
        await activateUser(email, result.amount!, result.txHash!, result.from!)
      }

    }, 10000)

    // Also check immediately (don't wait 10 seconds for first check)
    const immediateResult = await detectPayment(PAYMENT_AMOUNT, usedHashes)
    if (immediateResult.verified) {
      if (pollRef.current) clearInterval(pollRef.current)
      await activateUser(email, immediateResult.amount!, immediateResult.txHash!, immediateResult.from!)
    }
  }

  // 🔗 Fallback: Manual TXID verification
  const manualVerify = async () => {

    const email = localStorage.getItem("bharos_user")
    if (!email) return

    if (!txid || !txid.startsWith("0x") || txid.length < 10) {
      setErrorMsg("Enter valid TXID (starts with 0x)")
      return
    }

    const dupSnap = await getDocs(
      query(collection(db, "deposits"), where("txHash", "==", txid))
    )
    if (!dupSnap.empty) {
      setErrorMsg("This TXID is already used.")
      return
    }

    setFallbackLoading(true)
    setErrorMsg("")

    const result = await verifyTransaction(txid)

    if (!result.verified) {
      setErrorMsg(result.error || "Verification failed")
      setFallbackLoading(false)
      return
    }

    await activateUser(email, result.amount!, txid, result.from!)
  }

  // ✅ ACTIVATE USER
  const activateUser = async (
    email: string,
    amount: number,
    txHash: string,
    fromAddress: string
  ) => {

    setStep("activating")
    setVerifiedAmount(amount)

    try {

      await addDoc(collection(db, "deposits"), {
        userId: email,
        txHash: txHash,
        amount: amount,
        status: "verified",
        verifiedBy: "blockchain",
        fromAddress: fromAddress,
        toAddress: "0xCD72FfF7F22eC409FCAcED1A06AEC227da6C1A56",
        createdAt: new Date()
      })

      const userRef = doc(db, "users", email)
      await updateDoc(userRef, {
        status: "active",
        brsBalance: increment(150),
        activatedAt: new Date()
      })

      await logTransaction(email, 150, "BRS", "Membership activation reward")
      await runFullActivation(email)

      setStep("done")

      setTimeout(() => {
        navigate("/dashboard")
      }, 3000)

    } catch (err) {
      console.error(err)
      setErrorMsg("Activation failed. Please contact support.")
      setStep("fallback")
    }
  }

  // ⏱️ Format elapsed time
  const formatTime = (polls: number) => {
    const seconds = polls * 10
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (

    <div className="min-h-screen bg-[#0B0919] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,212,255,0.1)]">

        <h1 className="text-3xl sm:text-4xl font-bold mb-8">
          Activate Membership
        </h1>

        {/* ✅ SUCCESS STATE */}
        {step === "done" && (
          <div className="bg-green-500/10 border border-green-400/30 rounded-2xl p-8 text-center animate-pulse">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">
              Payment Verified!
            </h2>
            <p className="text-green-300">
              {verifiedAmount.toFixed(2)} USDT verified on blockchain
            </p>
            <p className="text-green-300 mt-1">
              150 BRS credited to your wallet
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Redirecting to dashboard...
            </p>
          </div>
        )}

        {/* ⚡ ACTIVATING STATE */}
        {step === "activating" && (
          <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4 animate-spin">⚡</div>
            <h2 className="text-xl font-bold text-cyan-400 mb-2">
              Payment Verified! Activating...
            </h2>
            <p className="text-gray-400">
              Setting up your account...
            </p>
          </div>
        )}

        {/* 📤 SEND & DETECT STEPS */}
        {(step === "send" || step === "waiting") && (
          <>

            {/* ⚠️ IMPORTANT WARNING — TOP */}
            <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-6">
              <p className="text-red-400 font-bold text-sm mb-2">⚠️ Important — Read Before Sending</p>
              <ul className="text-red-300 text-xs space-y-1.5">
                <li>• Send <b>exactly 12 USDT</b> — not more, not less</li>
                <li>• Use <b>BNB Smart Chain (BEP20)</b> network only</li>
                <li>• Sending wrong amount or wrong network will result in <b>permanent loss of assets</b></li>
                <li>• Double-check the wallet address before sending</li>
              </ul>
            </div>

            {/* PAYMENT DETAILS */}
            <div className="bg-[#1a1a2e] p-6 sm:p-8 rounded-xl mb-6">

              <h2 className="text-lg sm:text-xl mb-6 flex items-center gap-2">
                <span className="bg-cyan-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Send USDT
              </h2>

              {/* 💰 Amount */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/40 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-300 mb-1">Send Exactly</p>
                <p className="text-3xl sm:text-4xl font-bold text-yellow-400">
                  12 USDT
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-400">Network</p>
                  <p className="text-yellow-400 font-semibold">BNB Smart Chain (BEP20)</p>
                </div>
                <div>
                  <p className="text-gray-400">Token</p>
                  <p className="text-green-400 font-semibold">USDT (BEP20)</p>
                </div>
              </div>

              <p className="mb-2 text-gray-400 text-sm">Deposit Address</p>

              <div className="flex gap-2 mb-6">
                <input
                  value="0xCD72FfF7F22eC409FCAcED1A06AEC227da6C1A56"
                  readOnly
                  className="w-full p-3 bg-[#0B0919] rounded text-xs sm:text-sm"
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        "0xCD72FfF7F22eC409FCAcED1A06AEC227da6C1A56"
                      )
                      alert("Address copied!")
                    } catch {
                      alert("Copy failed")
                    }
                  }}
                  className="bg-cyan-500 px-4 rounded hover:bg-cyan-400 transition whitespace-nowrap text-sm font-semibold"
                >
                  Copy
                </button>
              </div>

              <div className="flex justify-center">
                <img
                  src={qrBharos}
                  alt="Bharos Payment QR Code"
                  className="rounded-lg"
                  width={180}
                  height={180}
                />
              </div>

            </div>

            {/* 🔍 AUTO-DETECT STEP */}
            <div className="bg-[#1a1a2e] p-6 sm:p-8 rounded-xl mb-6">

              <h2 className="text-lg sm:text-xl mb-6 flex items-center gap-2">
                <span className="bg-cyan-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                {step === "waiting" ? "Detecting Payment..." : "Confirm Payment"}
              </h2>

              {/* WAITING STATE */}
              {step === "waiting" && (
                <div className="text-center space-y-4">

                  <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl">🔍</span>
                    </div>
                  </div>

                  <p className="text-cyan-400 font-semibold text-lg">
                    Scanning Blockchain...
                  </p>

                  <p className="text-gray-400 text-sm">
                    Looking for your 12 USDT payment
                  </p>

                  {/* Safe to leave notice */}
                  <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3">
                    <p className="text-green-400 text-xs">
                      ✅ Safe to close this page — verification will resume when you return
                    </p>
                  </div>

                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((pollCount / maxPolls) * 100, 100)}%` }}
                    ></div>
                  </div>

                  <p className="text-gray-500 text-xs">
                    Elapsed: {formatTime(pollCount)}
                  </p>

                </div>
              )}

              {/* SEND STATE */}
              {step === "send" && (
                <>
                  <p className="text-gray-400 text-sm mb-4">
                    After sending <span className="text-yellow-400 font-bold">12 USDT</span>, click below. Your payment will be automatically verified on blockchain.
                  </p>

                  <button
                    onClick={startPolling}
                    disabled={!isApiKeyConfigured()}
                    className="w-full p-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    ✅ I Have Sent 12 USDT
                  </button>

                  <p className="text-center text-gray-500 text-xs mt-3">
                    Payment is automatically verified on BSC blockchain
                  </p>
                </>
              )}

            </div>

            {/* ℹ️ WARNINGS */}
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-4 text-sm space-y-2">
              <p className="text-red-400 font-bold mb-1">❗ Warning</p>
              <p className="text-red-300">• Send <b>exactly 12 USDT</b> — wrong amount will <b>NOT</b> be verified</p>
              <p className="text-red-300">• Use <b>BNB Smart Chain (BEP20)</b> — wrong network = <b>permanent loss</b></p>
              <p className="text-red-300">• Wrong address = <b>permanent loss of funds</b></p>
              <p className="text-orange-300 mt-2">💡 Payment verified instantly on blockchain</p>
            </div>

          </>
        )}

        {/* 🔗 FALLBACK — Manual TXID */}
        {step === "fallback" && (
          <div className="bg-[#1a1a2e] p-6 sm:p-8 rounded-xl">

            <h2 className="text-xl mb-2 text-yellow-400">
              ⚠️ Auto-detection timed out
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Enter your Transaction Hash (TXID) manually to verify.
            </p>

            <p className="mb-2 text-gray-400 text-sm">Transaction Hash (TXID)</p>
            <input
              value={txid}
              onChange={(e) => {
                setTxid(e.target.value)
                setErrorMsg("")
              }}
              placeholder="0x..."
              disabled={fallbackLoading}
              className="w-full p-3 bg-[#0B0919] rounded mb-4 disabled:opacity-50"
            />

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">❌ {errorMsg}</p>
              </div>
            )}

            <button
              onClick={manualVerify}
              disabled={fallbackLoading}
              className="w-full p-3 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-[1.02] transition-all duration-300 shadow-lg disabled:opacity-50"
            >
              {fallbackLoading ? "🔍 Verifying..." : "🔗 Verify with TXID"}
            </button>

            <button
              onClick={() => {
                setStep("send")
                setErrorMsg("")
              }}
              className="w-full mt-3 p-2 text-gray-400 text-sm hover:text-white transition"
            >
              ← Try auto-detection again
            </button>

          </div>
        )}

      </div>
    </div>
  )
}

export default ActivateMembership