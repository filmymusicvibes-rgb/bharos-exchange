import { useState, useEffect } from "react"
import { db, storage } from "../lib/firebase"
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { navigate } from "../lib/router"
import qrBharos from "../assets/qr-bharos.jpeg"

function ActivateMembership() {

  const [txid, setTxid] = useState("")
  const [amount, setAmount] = useState("12")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      const email = localStorage.getItem("bharos_user")
      if (!email) return

      const userRef = doc(db, "users", email)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const data: any = userSnap.data()

        // 🚫 already active
        if (data.status === "active") {
          navigate("/dashboard")
        }

        // 🔎 check real pending deposit instead of user status
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
    }

    checkStatus()
  }, [])

  const submitDeposit = async () => {

    if (loading) return

    const email = localStorage.getItem("bharos_user")

    if (!email) {
      alert("User not logged in")
      return
    }

    if (!txid) {
      alert("Please enter TXID")
      return
    }

    if (!txid.startsWith("0x") || txid.length < 10) {
      alert("Enter valid TXID")
      return
    }

    if (screenshot) {
      // 🛑 FILE VALIDATION
      if (!screenshot.type.startsWith("image/")) {
        alert("Only image files allowed")
        return
      }

      if (screenshot.size > 2 * 1024 * 1024) {
        alert("Image too large (max 2MB)")
        return
      }
    }

    setLoading(true)

    try {
      let screenshotURL = ""

      if (screenshot) {
        try {
          const fileName = Date.now() + "_" + screenshot.name
          const storageRef = ref(storage, "screenshots/" + fileName)

          await uploadBytes(storageRef, screenshot)

          screenshotURL = await getDownloadURL(storageRef)

        } catch (error) {
          console.error(error)
          alert("Upload failed. Check internet / rules.")
          setLoading(false)
          return
        }
      }

      // 💾 SAVE
      await addDoc(collection(db, "deposits"), {
        userId: email,
        txHash: txid,
        amount: Number(amount),
        screenshot: screenshotURL,
        status: "pending",
        createdAt: new Date()
      })

      // 🔄 UPDATE USER STATUS
      await updateDoc(doc(db, "users", email), {
        status: "pending"
      })

      alert("✅ Payment submitted")

      navigate("/dashboard")

    } catch (err) {
      console.error(err)
      alert("❌ Upload failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (

    <div className="min-h-screen bg-[#0B0919] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,212,255,0.1)]">

      <h1 className="text-4xl font-bold mb-10">
        Activate Membership
      </h1>

      {/* SEND USDT */}

      <div className="bg-[#1a1a2e] p-8 rounded-xl mb-8">

        <h2 className="text-xl mb-6">1️⃣ Send USDT</h2>

        <p className="mb-2 text-gray-400">Amount</p>
        <p className="text-2xl text-yellow-400 mb-4">12 USDT</p>

        <p className="mb-2 text-gray-400">Network</p>
        <p className="mb-4 text-yellow-400">BNB Smart Chain (BEP20)</p>

        <p className="mb-2 text-gray-400">Wallet Address</p>

        <div className="flex gap-3 mb-6">

          <input
            value="0xCD72FfF7F22eC409FCAcED1A06AEC227da6C1A56"
            readOnly
            className="w-full p-3 bg-[#0B0919] rounded"
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
            className="bg-cyan-500 px-4 rounded hover:bg-cyan-400 transition"
          >
            Copy
          </button>

        </div>

        <div className="flex justify-center">

          <img
            src={qrBharos}
            alt="Bharos Payment QR Code"
            className="rounded"
            width={200}
            height={200}
          />

        </div>

      </div>

      {/* SUBMIT PROOF */}

      <div className="bg-[#1a1a2e] p-8 rounded-xl mb-8">

        <h2 className="text-xl mb-6">2️⃣ Submit Deposit Proof</h2>

        <p className="mb-2 text-gray-400">Transaction Hash (TXID)</p>

        <input
          value={txid}
          onChange={(e) => setTxid(e.target.value)}
          placeholder="0x..."
          className="w-full p-3 bg-[#0B0919] rounded mb-4"
        />

        <p className="mb-2 text-gray-400">Amount Sent (USDT)</p>

        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 bg-[#0B0919] rounded mb-4"
        />

        <p className="mb-2 text-gray-400">Payment Proof (Optional)</p>
        <p className="text-yellow-400 text-sm mb-4">
          ⚠️ TXID is mandatory. Screenshot is only for reference.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setScreenshot(e.target.files ? e.target.files[0] : null)
          }
          className="mb-6"
        />

        <button
          onClick={submitDeposit}
          disabled={loading}
          className="w-full p-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:scale-105 transition-all duration-300 shadow-lg"
        >
          {loading ? "Verifying Payment..." : "Submit Deposit"}
        </button>

      </div>
      </div>

    </div>
  )
}

export default ActivateMembership