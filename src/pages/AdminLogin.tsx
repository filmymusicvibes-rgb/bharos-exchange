import { setUser } from "../lib/session"
import { useState } from "react"
import { db, auth } from "../lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { signInWithEmailAndPassword } from "firebase/auth"
import { resetAdminPassword } from "../lib/resetAdmin"

export default function AdminLogin() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetMsg, setResetMsg] = useState("")

  const login = async () => {

    setError("")
    setLoading(true)

    try {
      const cleanEmail = email.trim().toLowerCase()

      if (!cleanEmail || !password) {
        setError("Please enter email and password")
        setLoading(false)
        return
      }

      // 🔥 Check Firestore admins collection
      const adminRef = doc(db, "admins", cleanEmail)
      const adminSnap = await getDoc(adminRef)

      if (!adminSnap.exists()) {
        setError("Access denied — not an admin")
        setLoading(false)
        return
      }

      const adminData: any = adminSnap.data()

      if (adminData.password !== password) {
        setError("Invalid password")
        setLoading(false)
        return
      }

      // ✅ Admin verified — sign into Firebase Auth (REQUIRED for Firestore writes)
      const userEmail = adminData.userEmail || cleanEmail
      try {
        await signInWithEmailAndPassword(auth, userEmail, password)
      } catch (authErr: any) {
        // If user doesn't exist in Firebase Auth, create them
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          try {
            const { createUserWithEmailAndPassword } = await import('firebase/auth')
            await createUserWithEmailAndPassword(auth, userEmail, password)
          } catch (createErr: any) {
            // If already exists but wrong password, try with a fallback
            if (createErr.code === 'auth/email-already-in-use') {
              console.warn("Firebase Auth user exists but password mismatch. Admin functions may have limited write access.")
            } else {
              console.error("Firebase Auth setup failed:", createErr)
            }
          }
        } else {
          console.error("Firebase Auth sign-in failed:", authErr)
        }
      }

      localStorage.setItem("bharos_admin", "true")
      setUser(userEmail)
      window.location.href = "/admin"

    } catch (err: any) {
      setError("Login failed: " + err.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0919] text-white">

      <div className="bg-[#1a1a2e] p-8 rounded-xl w-80 space-y-4 border border-cyan-500/20">

        <h2 className="text-xl text-cyan-400 text-center font-bold">🔐 Admin Login</h2>

        {error && (
          <p className="text-red-400 text-center text-sm">{error}</p>
        )}

        <input
          placeholder="Admin Email"
          className="w-full p-3 bg-black/30 rounded border border-cyan-500/20 text-white focus:border-cyan-400 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 bg-black/30 rounded border border-cyan-500/20 text-white focus:border-cyan-400 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3 rounded font-semibold hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Login"}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Multi-device admin access enabled
        </p>

        {/* 🔧 TEMPORARY — Remove after password reset! */}
        <button
          onClick={async () => {
            const result = await resetAdminPassword()
            setResetMsg(result)
          }}
          className="w-full mt-3 py-2 rounded text-[10px] text-gray-600 hover:text-yellow-400 border border-white/5 hover:border-yellow-500/20 transition-all"
        >
          🔧 Reset Admin Password
        </button>
        {resetMsg && <p className="text-xs text-center mt-1 text-yellow-400">{resetMsg}</p>}

      </div>

    </div>
  )
}
