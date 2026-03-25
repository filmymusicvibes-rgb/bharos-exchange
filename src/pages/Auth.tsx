import { useState, useEffect } from "react"
import coin from "../assets/brs.png"
import { db } from "../lib/firebase"
import { doc, setDoc, collection, query, where, getDocs, getDoc } from "firebase/firestore"

type Mode = "signin" | "signup"

export default function Auth() {

  const [mode, setMode] = useState<Mode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userName, setUserName] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // 🔗 referral auto detect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref) {
      setReferralCode(ref)
      setMode("signup")
    }
  }, [])

  // 🚀 SUBMIT
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const cleanEmail = email.trim().toLowerCase()

      if (mode === "signup") {

        const refCode = referralCode.trim()

        // ❌ prevent self empty
        if (!refCode) {
          setError("Referral Code is required")
          setLoading(false)
          return
        }

        if (refCode === "REF000000") {
          const usersSnap = await getDocs(collection(db, "users"))

          if (!usersSnap.empty) {
            setError("Root user already created")
            setLoading(false)
            return
          }
        } else {
          const refDoc = await getDoc(doc(db, "referralIndex", refCode))

          if (!refDoc.exists()) {
            setError("Invalid Referral Code")
            setLoading(false)
            return
          }
        }

        const userRef = doc(db, "users", cleanEmail)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          setError("User already exists")
          setLoading(false)
          return
        }

        let myReferral = ""
        let exists = true

        while (exists) {
          myReferral = "REF" + Math.floor(100000 + Math.random() * 900000)

          const q = query(collection(db, "users"), where("referralCode", "==", myReferral))
          const snap = await getDocs(q)

          exists = !snap.empty
        }

        if (refCode === myReferral) {
          setError("Invalid referral")
          setLoading(false)
          return
        }

        // 🔥 SAVE TO FIREBASE
        await setDoc(userRef, {
          email: cleanEmail,
          userName: userName || cleanEmail.split("@")[0],

          referralCode: myReferral,
          referredBy: refCode,

          status: "inactive",
          role: "user",

          usdtBalance: 0,
          brsBalance: 0,
          usdtFrozen: 0,

          createdAt: new Date()
        })

        await setDoc(doc(db, "referralIndex", myReferral), {
          userId: cleanEmail
        })

        console.log("User saved to Firebase")
      }

      if (mode === "signin") {
        console.log("Signin:", cleanEmail)

        // optional future check (skip now)
      }

      // 👉 simulate login
      localStorage.setItem("bharos_user", cleanEmail)

      // 🔁 redirect
      window.location.href = "/dashboard"

    } catch (err: any) {
      setError(err.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050816] px-4 relative overflow-hidden">

      {/* 🔙 BACK BUTTON */}
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 2) {
            window.history.back()
          } else {
            window.location.href = "/"
          }
        }}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/20 bg-[#1a1a2e] text-cyan-400 hover:bg-cyan-500/10 hover:scale-105 transition z-10"
      >
        ← Back
      </button>

      {/* 🌌 BACKGROUND */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full"></div>

      {/* 🧊 CARD */}
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-2xl shadow-cyan-500/20 space-y-4"
      >

        {/* 🪙 LOGO */}
        <div className="flex justify-center">
          <img src={coin} className="w-10 h-10" />
        </div>

        {/* 🔥 TITLE */}
        <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h2>

        {/* ❌ ERROR */}
        {error && <p className="text-red-400 text-center text-sm">{error}</p>}

        {/* 📩 EMAIL */}
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full px-4 py-3 rounded-lg bg-[#0B0919] border border-cyan-500/20 text-white focus:border-cyan-400 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* 👤 USERNAME */}
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Username"
            className="w-full px-4 py-3 rounded-lg bg-[#0B0919] border border-cyan-500/20 text-white"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        )}

        {/* 🔗 REFERRAL */}
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Referral Code (Required)"
            className="w-full px-4 py-3 rounded-lg bg-[#0B0919] border border-cyan-500/20 text-white"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
          />
        )}

        {/* 🔐 PASSWORD */}
        <input
          type="password"
          placeholder="Enter password"
          className="w-full px-4 py-3 rounded-lg bg-[#0B0919] border border-cyan-500/20 text-white focus:border-cyan-400 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* 🚀 BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.8)] hover:scale-105 active:scale-95"
        >
          {loading ? "Processing..." : mode === "signin" ? "Sign In" : "Create Account"}
        </button>

        {/* 🔄 SWITCH */}
        <p className="text-center text-gray-400 text-sm">
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <span
                onClick={() => setMode("signup")}
                className="text-cyan-400 cursor-pointer hover:underline"
              >
                Sign up
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                onClick={() => setMode("signin")}
                className="text-cyan-400 cursor-pointer hover:underline"
              >
                Sign in
              </span>
            </>
          )}
        </p>

      </form>
    </div>
  )
}