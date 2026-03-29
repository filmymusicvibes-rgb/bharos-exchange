import { useState, useEffect } from "react"
import { db } from "../lib/firebase"
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { navigate } from "../lib/router"
import { verifyTransaction } from "../lib/bscscan"
import { logTransaction, runFullActivation } from "../lib/commission"
import qrBharos from "../assets/qr-bharos.jpeg"

type PaymentStep = "send" | "verify" | "activating" | "done"

function ActivateMembership() {

  const [step, setStep] = useState<PaymentStep>("send")
  const [txid, setTxid] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifiedAmount, setVerifiedAmount] = useState(0)
  const [showTxidGuide, setShowTxidGuide] = useState(false)

  // 🔒 Check status on load
  useEffect(() => {
    const init = async () => {
      const email = localStorage.getItem("bharos_user")
      if (!email) return

      const userRef = doc(db, "users", email)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const data: any = userSnap.data()
        if (data.status === "active") {
          navigate("/dashboard")
          return
        }
      }
    }

    init()
  }, [])

  // 🔗 Verify TXID on blockchain
  const handleVerify = async () => {

    const email = localStorage.getItem("bharos_user")
    if (!email) return

    const trimmedTxid = txid.trim()

    if (!trimmedTxid || !trimmedTxid.startsWith("0x") || trimmedTxid.length !== 66) {
      setErrorMsg("Enter a valid Transaction Hash (TXID). It should be 66 characters starting with 0x")
      return
    }

    // Check duplicate
    const dupSnap = await getDocs(
      query(collection(db, "deposits"), where("txHash", "==", trimmedTxid))
    )
    if (!dupSnap.empty) {
      setErrorMsg("This TXID is already used for another activation.")
      return
    }

    setLoading(true)
    setErrorMsg("")

    const result = await verifyTransaction(trimmedTxid)

    if (!result.verified) {
      setErrorMsg(result.error || "Verification failed. Please try again.")
      setLoading(false)
      return
    }

    // ✅ VERIFIED — Activate!
    setStep("activating")
    setVerifiedAmount(result.amount!)

    try {

      await addDoc(collection(db, "deposits"), {
        userId: email,
        txHash: trimmedTxid,
        amount: result.amount,
        status: "verified",
        verifiedBy: "blockchain-rpc",
        fromAddress: result.from,
        toAddress: result.to,
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
      setLoading(false)
      setStep("verify")
    }
  }

  return (

    <div className="min-h-screen bg-[#0B0919] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,212,255,0.1)]">

        <h1 className="text-3xl sm:text-4xl font-bold mb-8">
          Activate Membership
        </h1>

        {/* ✅ SUCCESS STATE */}
        {step === "done" && (
          <div className="bg-green-500/10 border border-green-400/30 rounded-2xl p-8 text-center">
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
              Setting up your account & distributing rewards...
            </p>
          </div>
        )}

        {/* 📤 SEND & VERIFY STEPS */}
        {(step === "send" || step === "verify") && (
          <>

            {/* ⚠️ IMPORTANT WARNING */}
            <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-6">
              <p className="text-red-400 font-bold text-sm mb-2">⚠️ Important — Read Before Sending</p>
              <ul className="text-red-300 text-xs space-y-1.5">
                <li>• Send <b>exactly 12 USDT</b> — not more, not less</li>
                <li>• Use <b>BNB Smart Chain (BEP20)</b> network only</li>
                <li>• Sending wrong amount or wrong network will result in <b>permanent loss of assets</b></li>
                <li>• Double-check the wallet address before sending</li>
              </ul>
            </div>

            {/* STEP 1: PAYMENT DETAILS */}
            <div className="bg-[#1a1a2e] p-6 sm:p-8 rounded-xl mb-6">

              <h2 className="text-lg sm:text-xl mb-6 flex items-center gap-2">
                <span className="bg-cyan-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Send USDT
              </h2>

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

            {/* STEP 2: VERIFY TXID */}
            <div className="bg-[#1a1a2e] p-6 sm:p-8 rounded-xl mb-6">

              <h2 className="text-lg sm:text-xl mb-4 flex items-center gap-2">
                <span className="bg-cyan-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Verify Payment
              </h2>

              <p className="text-gray-400 text-sm mb-4">
                After sending 12 USDT, paste your <b className="text-cyan-400">Transaction Hash (TXID)</b> below to verify instantly.
              </p>

              {/* TXID Input */}
              <input
                value={txid}
                onChange={(e) => {
                  setTxid(e.target.value)
                  setErrorMsg("")
                }}
                placeholder="0x..."
                disabled={loading}
                className="w-full p-3 bg-[#0B0919] border border-white/10 rounded-lg mb-3 text-sm disabled:opacity-50 focus:border-cyan-500 focus:outline-none transition"
              />

              {/* Error Message */}
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3 mb-3">
                  <p className="text-red-400 text-sm">❌ {errorMsg}</p>
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={handleVerify}
                disabled={loading || !txid.trim()}
                className="w-full p-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Verifying on Blockchain...
                  </span>
                ) : (
                  "🔗 Verify & Activate"
                )}
              </button>

              <p className="text-center text-gray-500 text-xs mt-3">
                Verified directly on BSC blockchain — instant & secure
              </p>

              {/* TXID GUIDE TOGGLE */}
              <button
                onClick={() => setShowTxidGuide(!showTxidGuide)}
                className="w-full mt-4 text-cyan-400 text-sm hover:text-cyan-300 transition"
              >
                {showTxidGuide ? "▲ Hide" : "▼ How to find TXID in Trust Wallet?"}
              </button>

              {/* TXID GUIDE */}
              {showTxidGuide && (
                <div className="mt-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 text-sm space-y-3">
                  <p className="text-cyan-400 font-bold">📱 Trust Wallet lo TXID kaavadam:</p>
                  <ol className="text-gray-300 space-y-2 list-decimal list-inside">
                    <li>Trust Wallet open cheyyi</li>
                    <li><b>USDT</b> token tap cheyyi</li>
                    <li>Nuvvu send chesina <b>transaction</b> tap cheyyi (recent transactions lo)</li>
                    <li><b>"More Details"</b> tap cheyyi</li>
                    <li><b>"Transaction Hash"</b> kanipistundi — adi copy cheyyi!</li>
                    <li>Ikkada paste cheyyi → <b>Verify & Activate</b> click!</li>
                  </ol>
                  <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3 mt-2">
                    <p className="text-yellow-300 text-xs">💡 <b>Tip:</b> Transaction Hash 0x tho start avthundi and 66 characters untundi</p>
                  </div>
                </div>
              )}

            </div>

            {/* ℹ️ WARNINGS */}
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-4 text-sm space-y-2">
              <p className="text-red-400 font-bold mb-1">❗ Warning</p>
              <p className="text-red-300">• Send <b>exactly 12 USDT</b> — wrong amount will <b>NOT</b> be verified</p>
              <p className="text-red-300">• Use <b>BNB Smart Chain (BEP20)</b> — wrong network = <b>permanent loss</b></p>
              <p className="text-red-300">• Wrong address = <b>permanent loss of funds</b></p>
              <p className="text-orange-300 mt-2">💡 Verification is instant — verified directly on blockchain</p>
            </div>

          </>
        )}

      </div>
    </div>
  )
}

export default ActivateMembership