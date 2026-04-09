import { getUser, setUser } from "../lib/session"
import { useState, useEffect } from "react"
import { Eye, EyeOff, Mail, Lock, User, Phone, Link2, Shield, Check, Circle, MailCheck, Send, ArrowRight, AlertCircle, ChevronLeft } from "lucide-react"
import coin from "../assets/brs.png"
import { db, auth } from "../lib/firebase"
import { navigate } from "../lib/router"
import { doc, setDoc, collection, query, where, getDocs, getDoc } from "firebase/firestore"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth"

type Mode = "signin" | "signup" | "forgot-password"
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
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [forgotEmail, setForgotEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)

  // 🔒 Auto-redirect if already logged in
  useEffect(() => {
    const user = getUser()
    if (user) {
      navigate("/dashboard", true)
      return
    }
  }, [])

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

  // 🔄 Auto-poll for email verification (every 3 seconds when on verify screen)
  useEffect(() => {
    if (step !== 'verify-email') return
    const interval = setInterval(async () => {
      try {
        const user = auth.currentUser
        if (user) {
          await user.reload()
          if (user.emailVerified) {
            clearInterval(interval)
            setUser(user.email!.toLowerCase())
            navigate('/dashboard', true)
          }
        }
      } catch { /* silent */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [step])

  // 🔐 Check all password rules pass
  const allPasswordRulesPass = passwordRules.every(rule => rule.test(password))

  // 📧 Resend verification email
  const resendVerification = async () => {
    if (resendTimer > 0) return

    try {
      const user = auth.currentUser
      if (user) {
        await sendEmailVerification(user)
        setSuccess("Verification email sent again! Check your inbox.")
        setResendTimer(60)
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
        setUser(user.email!.toLowerCase())
        navigate("/dashboard", true)
        return
      } else {
        setError("Email not verified yet. Please check your inbox and click the verification link.")
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
            // 🔄 Check if user exists in Firestore — if not, it's a leftover from data reset
            const existingUser = await getDoc(doc(db, "users", cleanEmail))
            if (!existingUser.exists()) {
              // Old Firebase Auth account exists but Firestore was cleared
              // Try signing in with the new password to reuse the account
              try {
                userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password)
              } catch {
                // Password mismatch — user must use "Forgot Password" to reset
                setError("This email was previously registered. Please use 'Forgot Password' to reset your password, then Sign In.")
                setLoading(false)
                return
              }
            } else {
              setError("This email is already registered. Please sign in.")
              setLoading(false)
              return
            }
          } else if (authErr.code === "auth/weak-password") {
            setError("Password is too weak. Follow the requirements below.")
            setLoading(false)
            return
          } else if (authErr.code === "auth/invalid-email") {
            setError("Invalid email address.")
            setLoading(false)
            return
          } else {
            setError(authErr.message)
            setLoading(false)
            return
          }
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
          fullName: fullName.trim() || "",
          phone: phone.trim() || "",
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
                void newCred
                // 🔐 Auto-detect admin on migration
                try {
                  const adminSnap = await getDoc(doc(db, "admins", cleanEmail))
                  if (adminSnap.exists()) {
                    localStorage.setItem("bharos_admin", "true")
                  }
                } catch { /* skip */ }
                // Migration successful — log them in directly
                setUser(cleanEmail)
                navigate("/dashboard", true)
                return
              } catch (migrateErr: any) {
                if (migrateErr.code === "auth/email-already-in-use") {
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

          // 🔐 Auto-detect admin — check if this user is in admins collection
          try {
            const adminSnap = await getDoc(doc(db, "admins", cleanEmail))
            if (adminSnap.exists()) {
              localStorage.setItem("bharos_admin", "true")
            } else {
              localStorage.removeItem("bharos_admin")
            }
          } catch {
            // Silent — non-admin users just skip this
          }

          // Old user (no flag) OR verified new user — login directly
          setUser(cleanEmail)
          navigate("/dashboard", true)
          return
        }

        // ⚠️ Firebase Auth exists but NO Firestore record (data was reset)
        // Tell user to re-register
        await auth.signOut() // Sign out the orphaned auth session
        setError("Your account data was reset. Please create a new account using 'Sign Up'.")
        setLoading(false)
        return
      }

    } catch (err: any) {
      setError(err.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050816] px-4 relative overflow-hidden">

      {/* 🌌 AMBIENT BACKGROUND */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/8 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/8 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/5 blur-[100px] rounded-full" />

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
        className="absolute top-5 left-5 flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-gray-400 hover:text-white hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all z-10 text-sm"
      >
        ← Back
      </button>

      {/* 📧 VERIFY EMAIL SCREEN */}
      {step === "verify-email" && (
        <div className="w-full max-w-md relative">
          {/* Glow border */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-2xl blur-sm" />
          
          <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5 text-center">

            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
              <Mail className="w-10 h-10 text-cyan-400" />
            </div>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Verify Your Email
            </h2>

            <p className="text-gray-400 text-sm">
              We sent a verification link to
            </p>
            <p className="text-cyan-400 font-semibold">{email}</p>

            <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-4 text-sm">
              <p className="text-green-300">📬 Check your <b>inbox</b> for verification email</p>
              <p className="text-green-300/70 mt-1">From: <b>Bharos Exchange</b> — Click the link to verify</p>
              <p className="text-cyan-400/50 text-[10px] mt-2 animate-pulse">⟳ Auto-detecting verification...</p>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-2">{error}</p>}
            {success && <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-2">{success}</p>}

            <button
              onClick={checkVerification}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-cyan-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 text-black">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Checking...
                </span>
              ) : "I Have Verified — Continue"}
            </button>

            <button
              onClick={resendVerification}
              disabled={resendTimer > 0}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-cyan-400 transition disabled:opacity-40 rounded-lg hover:bg-white/5"
            >
              {resendTimer > 0
                ? `Resend in ${resendTimer}s`
                : "📩 Resend Verification Email"
              }
            </button>

          </div>
        </div>
      )}

      {/* 🧊 FORM */}
      {step === "form" && mode !== "forgot-password" && (
        <div className="w-full max-w-md relative">
          {/* Animated glow border */}
          <div
            className="absolute -inset-[1px] rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(59,130,246,0.2), rgba(168,85,247,0.3), rgba(6,182,212,0.3))',
              backgroundSize: '300% 300%',
              animation: 'borderGlow 4s ease-in-out infinite',
              filter: 'blur(1px)',
            }}
          />

          <form
            onSubmit={submit}
            className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-4"
          >

            {/* 🪙 LOGO */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 rounded-full blur-lg animate-pulse" />
                <img src={coin} className="relative w-14 h-14 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]" />
              </div>
            </div>

            {/* 🔥 TITLE */}
            <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-center text-gray-500 text-sm -mt-2">
              {mode === "signin" ? "Sign in to your Bharos Exchange account" : "Join the Bharos Exchange ecosystem"}
            </p>

            {/* ❌ ERROR */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
                <span className="text-red-400 text-sm">❌</span>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* 📩 EMAIL */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* 👤 USERNAME */}
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
            )}

            {/* 📝 FULL NAME (optional) */}
            {mode === "signup" && (
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            {/* 📱 PHONE (optional) */}
            {mode === "signup" && (
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            )}

            {/* 🔗 REFERRAL */}
            {mode === "signup" && (
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Referral Code (Required)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                />
              </div>
            )}

            {/* 🔐 PASSWORD */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* 🔐 PASSWORD STRENGTH */}
            {mode === "signup" && password.length > 0 && (
              <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4 space-y-2">
                <p className="text-[10px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Password Requirements:</p>
                {passwordRules.map(rule => (
                  <div key={rule.id} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                      rule.test(password) 
                        ? 'bg-green-400/20 border border-green-400/40' 
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      {rule.test(password) 
                        ? <Check className="w-2.5 h-2.5 text-green-400" />
                        : <Circle className="w-2 h-2 text-gray-600" />
                      }
                    </div>
                    <span className={`text-xs transition-all duration-300 ${rule.test(password) ? 'text-green-400' : 'text-gray-500'}`}>
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
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 shadow-lg shadow-cyan-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2 text-black">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Processing...
                </span>
              ) : mode === "signin" ? "Sign In" : "Create Account"}
            </button>

            {/* 🔓 FORGOT PASSWORD (only on sign in) */}
            {mode === "signin" && (
              <p className="text-right -mt-1">
                <span
                  onClick={() => { setMode("forgot-password"); setError(""); setForgotEmail(email); setResetSent(false) }}
                  className="text-cyan-400/70 cursor-pointer hover:text-cyan-300 transition text-xs font-medium"
                >
                  Forgot Password?
                </span>
              </p>
            )}

            {/* 🔄 SWITCH */}
            <p className="text-center text-gray-500 text-sm pt-1">
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <span
                    onClick={() => { setMode("signup"); setError("") }}
                    className="text-cyan-400 cursor-pointer hover:text-cyan-300 transition font-medium"
                  >
                    Sign up
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <span
                    onClick={() => { setMode("signin"); setError("") }}
                    className="text-cyan-400 cursor-pointer hover:text-cyan-300 transition font-medium"
                  >
                    Sign in
                  </span>
                </>
              )}
            </p>

          </form>
        </div>
      )}

      {/* 🔓 FORGOT PASSWORD SCREEN */}
      {mode === "forgot-password" && (
        <div className="w-full max-w-md relative">
          {/* Animated glow border */}
          <div
            className="absolute -inset-[1px] rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(59,130,246,0.2), rgba(168,85,247,0.3), rgba(6,182,212,0.3))',
              backgroundSize: '300% 300%',
              animation: 'borderGlow 4s ease-in-out infinite',
              filter: 'blur(1px)',
            }}
          />

          <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5">

            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-full blur-lg animate-pulse" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                  <Lock className="w-8 h-8 text-amber-400" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Reset Password
            </h2>
            <p className="text-center text-gray-500 text-sm -mt-2">
              Enter your email to receive a password reset link
            </p>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Success */}
            {resetSent ? (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
                  <div className="w-14 h-14 mx-auto bg-green-500/15 rounded-full flex items-center justify-center border border-green-500/30 mb-3">
                    <MailCheck className="w-7 h-7 text-green-400" />
                  </div>
                  <p className="text-green-400 font-semibold text-sm">Password Reset Email Sent!</p>
                  <p className="text-gray-400 text-xs mt-2">Check your inbox & spam folder for the reset link</p>
                  <p className="text-cyan-400 text-sm font-medium mt-2">{forgotEmail}</p>
                </div>

                <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-3 flex items-center gap-2 justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <p className="text-amber-300 text-xs">Click the link in email → Set new password → Sign in</p>
                </div>

                <button
                  onClick={() => { setMode("signin"); setError(""); setResetSent(false) }}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Email Input */}
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-amber-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Send Reset Button */}
                <button
                  onClick={async () => {
                    const cleanEmail = forgotEmail.trim().toLowerCase()
                    if (!cleanEmail) { setError("Please enter your email"); return }
                    
                    setLoading(true)
                    setError("")
                    
                    try {
                      // Check if user exists in Firestore
                      const userSnap = await getDoc(doc(db, "users", cleanEmail))
                      if (!userSnap.exists()) {
                        setError("No account found with this email")
                        setLoading(false)
                        return
                      }
                      
                      await sendPasswordResetEmail(auth, cleanEmail)
                      setResetSent(true)
                    } catch (err: any) {
                      if (err.code === "auth/user-not-found") {
                        setError("No account found with this email")
                      } else if (err.code === "auth/too-many-requests") {
                        setError("Too many requests. Please try again later.")
                      } else if (err.code === "auth/invalid-email") {
                        setError("Invalid email address")
                      } else {
                        setError("Failed to send reset email. Try again.")
                      }
                    }
                    setLoading(false)
                  }}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-amber-500/20"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2 text-black">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Reset Link
                    </span>
                  )}
                </button>

                {/* Back to Sign In */}
                <p className="text-center text-gray-500 text-sm">
                  Remember your password?{" "}
                  <span
                    onClick={() => { setMode("signin"); setError(""); setResetSent(false) }}
                    className="text-cyan-400 cursor-pointer hover:text-cyan-300 transition font-medium"
                  >
                    Sign in
                  </span>
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes borderGlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}