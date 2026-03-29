import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import coin from "../assets/brs.png"
import { db } from "../lib/firebase"
import { doc, setDoc, collection, query, where, getDocs, getDoc } from "firebase/firestore"

type Mode = "signin" | "signup"

// 🔐 Password rules
const passwordRules = [
  { id: "length", label: "Minimum 8 characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "One special character (!@#$%...)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

// 📧 Valid email domains
const validEmailDomains = [
  "gmail.com", "yahoo.com", "yahoo.in", "outlook.com", "hotmail.com",
  "live.com", "icloud.com", "protonmail.com", "mail.com", "zoho.com",
  "aol.com", "yandex.com", "rediffmail.com"
]

export default function Auth() {

  const [mode, setMode] = useState<Mode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userName, setUserName] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // 🔗 referral auto detect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref) {
      setReferralCode(ref)
      setMode("signup")
    }
  }, [])

  // 📧 Validate email format + real domain
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) return false

    const domain = email.split("@")[1]?.toLowerCase()
    return validEmailDomains.includes(domain)
  }

  // 🔐 Check all password rules pass
  const allPasswordRulesPass = passwordRules.every(rule => rule.test(password))

  // 🚀 SUBMIT
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const cleanEmail = email.trim().toLowerCase()

      // 📧 Email validation
      if (!isValidEmail(cleanEmail)) {
        setError("Please use a valid email (Gmail, Yahoo, Outlook, etc.)")
        setLoading(false)
        return
      }

      if (mode === "signup") {

        // 🔐 Password validation
        if (!allPasswordRulesPass) {
          setError("Password does not meet all requirements")
          setLoading(false)
          return
        }

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
          setError("This email is already registered. Please sign in.")
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
          password: password,

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
        const cleanEmailForLogin = cleanEmail
        const userRef = doc(db, "users", cleanEmailForLogin)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          setError("Account not found. Please sign up first.")
          setLoading(false)
          return
        }

        const userData: any = userSnap.data()

        // 🔐 Password check
        if (userData.password && userData.password !== password) {
          setError("Incorrect password")
          setLoading(false)
          return
        }
      }

      // 👉 login
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
        <div>
          <input
            type="email"
            placeholder="Enter your email (Gmail, Yahoo, Outlook...)"
            className="w-full px-4 py-3 rounded-lg bg-[#0B0919] border border-cyan-500/20 text-white focus:border-cyan-400 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {mode === "signup" && email.length > 3 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {isValidEmail(email) ? (
                <p className="text-green-400 text-xs">✅ Valid email</p>
              ) : (
                <p className="text-red-400 text-xs">❌ Use a valid email (Gmail, Yahoo, Outlook, etc.)</p>
              )}
            </div>
          )}
        </div>

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
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            className="w-full px-4 py-3 pr-12 rounded-lg bg-[#0B0919] border border-cyan-500/20 text-white focus:border-cyan-400 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* 🔐 PASSWORD STRENGTH — Live green checkmarks */}
        {mode === "signup" && password.length > 0 && (
          <div className="bg-[#0B0919] border border-white/10 rounded-lg p-3 space-y-1.5">
            <p className="text-xs text-gray-400 mb-1 font-semibold">Password Requirements:</p>
            {passwordRules.map(rule => (
              <div key={rule.id} className="flex items-center gap-2">
                <span className={`text-sm transition-all duration-300 ${rule.test(password) ? "text-green-400 scale-110" : "text-gray-600"}`}>
                  {rule.test(password) ? "✅" : "⬜"}
                </span>
                <span className={`text-xs transition-all duration-300 ${rule.test(password) ? "text-green-400" : "text-gray-500"}`}>
                  {rule.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 🚀 BUTTON */}
        <button
          type="submit"
          disabled={loading || (mode === "signup" && (!allPasswordRulesPass || !isValidEmail(email)))}
          className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.8)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
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