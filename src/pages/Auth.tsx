import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import coin from "../assets/brs.png"
import { db, auth } from "../lib/firebase"
import { doc, setDoc, collection, query, where, getDocs, getDoc } from "firebase/firestore"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth"

type Mode = "signin" | "signup"
type Step = "form" | "verify-email"

// 🔐 Password rules
const passwordRules = [
  { id: "length", label: "Minimum 8 characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "One special character (!@#$%...)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

export default function Auth() {

  const [mode, setMode] = useState<Mode>("signin")
  const [step, setStep] = useState<Step>("form")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userName, setUserName] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  // 🔗 referral auto detect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref) {
      setReferralCode(ref)
      setMode("signup")
    }
  }, [])

  // ⏱ Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // 🔐 Check all password rules pass
  const allPasswordRulesPass = passwordRules.every(rule => rule.test(password))

  // 📧 Resend verification email
  const resendVerification = async () => {
    if (resendTimer > 0) return

    try {
      const user = auth.currentUser
      if (user) {
        await sendEmailVerification(user)
        setSuccess("Verification email sent again! Check inbox & spam folder.")
        setResendTimer(60) // 60 sec cooldown
      }
    } catch (err: any) {
      setError("Could not resend. Try again later.")
    }
  }

  // ✅ Check if email is verified & complete login
  const checkVerification = async () => {
    setLoading(true)
    setError("")

    try {
      const user = auth.currentUser
      if (!user) {
        setError("Session expired. Please sign up again.")
        setStep("form")
        setLoading(false)
        return
      }

      await user.reload()

      if (user.emailVerified) {
        // ✅ Email verified — login!
        localStorage.setItem("bharos_user", user.email!.toLowerCase())
        window.location.href = "/dashboard"
      } else {
        setError("Email not verified yet. Please check your inbox & spam folder.")
      }
    } catch (err: any) {
      setError("Error checking verification. Try again.")
    }

    setLoading(false)
  }

  // 🚀 SUBMIT
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const cleanEmail = email.trim().toLowerCase()

      if (mode === "signup") {

        // 🔐 Password validation
        if (!allPasswordRulesPass) {
          setError("Password does not meet all requirements")
          setLoading(false)
          return
        }

        const refCode = referralCode.trim()

        if (!refCode) {
          setError("Referral Code is required")
          setLoading(false)
          return
        }

        // Referral validation
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

        // Check Firestore duplicate
        const userRef = doc(db, "users", cleanEmail)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          setError("This email is already registered. Please sign in.")
          setLoading(false)
          return
        }

        // 🔥 Create Firebase Auth account
        let userCredential
        try {
          userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password)
        } catch (authErr: any) {
          if (authErr.code === "auth/email-already-in-use") {
            setError("This email is already registered. Please sign in.")
          } else if (authErr.code === "auth/weak-password") {
            setError("Password is too weak. Follow the requirements below.")
          } else if (authErr.code === "auth/invalid-email") {
            setError("Invalid email address.")
          } else {
            setError(authErr.message)
          }
          setLoading(false)
          return
        }

        // 📧 Send verification email
        await sendEmailVerification(userCredential.user)

        // Generate unique referral code
        let myReferral = ""
        let exists = true
        while (exists) {
          myReferral = "REF" + Math.floor(100000 + Math.random() * 900000)
          const q = query(collection(db, "users"), where("referralCode", "==", myReferral))
          const snap = await getDocs(q)
          exists = !snap.empty
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
          emailVerificationRequired: true,
          createdAt: new Date()
        })

        await setDoc(doc(db, "referralIndex", myReferral), {
          userId: cleanEmail
        })

        // Show verify email screen
        setStep("verify-email")
        setResendTimer(60)
        setLoading(false)
        return
      }

      // 🔑 SIGN IN
      if (mode === "signin") {

        let userCredential
        try {
          userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password)
        } catch (authErr: any) {

          // 🔄 Firebase Auth failed — check if old user exists in Firestore (migration)
          if (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential") {
            
            // Check Firestore for old user
            const oldUser = await getDoc(doc(db, "users", cleanEmail))
            
            if (oldUser.exists()) {
              // ✅ Old user found in Firestore — migrate to Firebase Auth
              try {
                const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, password)
                void newCred // migration - we just need the account created
                // Migration successful — log them in directly
                localStorage.setItem("bharos_user", cleanEmail)
                window.location.href = "/dashboard"
                return
              } catch (migrateErr: any) {
                if (migrateErr.code === "auth/email-already-in-use") {
                  // Firebase Auth account exists but wrong password
                  setError("Incorrect password. Please try again.")
                } else if (migrateErr.code === "auth/weak-password") {
                  setError("Please use a stronger password (min 6 characters)")
                } else {
                  setError("Login failed. Please try again.")
                }
                setLoading(false)
                return
              }
            }

            // User doesn't exist in Firestore either
            setError("Invalid email or password")
          } else if (authErr.code === "auth/wrong-password") {
            setError("Incorrect password")
          } else if (authErr.code === "auth/too-many-requests") {
            setError("Too many failed attempts. Try again later.")
          } else {
            setError(authErr.message)
          }
          setLoading(false)
          return
        }

        // ✅ Firebase Auth sign-in succeeded — check Firestore
        const existingUser = await getDoc(doc(db, "users", cleanEmail))

        if (existingUser.exists()) {
          const userData = existingUser.data()

          // New user (has emailVerificationRequired flag) — must verify email first
          if (userData.emailVerificationRequired && !userCredential.user.emailVerified) {
            await sendEmailVerification(userCredential.user)
            setStep("verify-email")
            setResendTimer(60)
            setLoading(false)
            return
          }

          // Old user (no flag) OR verified new user — login directly
          localStorage.setItem("bharos_user", cleanEmail)
          window.location.href = "/dashboard"
          return
        }

        // New user (registered with email verification flow) — must verify email
        if (!userCredential.user.emailVerified) {
          await sendEmailVerification(userCredential.user)
          setStep("verify-email")
          setResendTimer(60)
          setLoading(false)
          return
        }

        // ✅ Verified new user — login
        localStorage.setItem("bharos_user", cleanEmail)
        window.location.href = "/dashboard"
        return
      }

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
          if (step === "verify-email") {
            setStep("form")
            return
          }
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

      {/* 📧 VERIFY EMAIL SCREEN */}
      {step === "verify-email" && (
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-2xl shadow-cyan-500/20 space-y-5 text-center">

          <div className="text-5xl">📧</div>

          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Verify Your Email
          </h2>

          <p className="text-gray-400 text-sm">
            We sent a verification link to
          </p>
          <p className="text-cyan-400 font-semibold">{email}</p>

          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4 text-sm">
            <p className="text-yellow-300">📌 Check your <b>inbox</b> and <b>spam/junk</b> folder</p>
            <p className="text-yellow-300 mt-1">Click the verification link in the email</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}

          <button
            onClick={checkVerification}
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.8)] hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Checking..." : "✅ I Have Verified — Continue"}
          </button>

          <button
            onClick={resendVerification}
            disabled={resendTimer > 0}
            className="w-full py-2 text-sm text-gray-400 hover:text-cyan-400 transition disabled:opacity-40"
          >
            {resendTimer > 0
              ? `Resend in ${resendTimer}s`
              : "📩 Resend Verification Email"
            }
          </button>

        </div>
      )}

      {/* 🧊 FORM */}
      {step === "form" && (
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

          {/* 🔐 PASSWORD STRENGTH */}
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
            disabled={loading || (mode === "signup" && !allPasswordRulesPass)}
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
                  onClick={() => { setMode("signup"); setError("") }}
                  className="text-cyan-400 cursor-pointer hover:underline"
                >
                  Sign up
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span
                  onClick={() => { setMode("signin"); setError("") }}
                  className="text-cyan-400 cursor-pointer hover:underline"
                >
                  Sign in
                </span>
              </>
            )}
          </p>

        </form>
      )}
    </div>
  )
}