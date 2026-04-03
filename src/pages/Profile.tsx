import { getUser, setUser } from "../lib/session"
import { useEffect, useState } from "react"
import { db, auth } from "../lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { navigate } from "@/lib/router"
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth"
import { User, Mail, Phone, Wallet, Calendar, Lock, Save, CheckCircle, KeyRound, Eye, EyeOff, Check, Circle, ChevronDown, ChevronUp } from "lucide-react"

import Navbar from "../components/Navbar"

export default function Profile() {

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [wallet, setWallet] = useState("")

  const [walletLocked, setWalletLocked] = useState(false)

  // Change Password States
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [pwSuccess, setPwSuccess] = useState("")
  const [pwError, setPwError] = useState("")

  // Password rules
  const passwordRules = [
    { id: "length", label: "Minimum 8 characters", test: (p: string) => p.length >= 8 },
    { id: "upper", label: "One uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
    { id: "lower", label: "One lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
    { id: "number", label: "One number (0-9)", test: (p: string) => /[0-9]/.test(p) },
    { id: "special", label: "One special character (!@#$%...)", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
  ]
  const allPwRulesPass = passwordRules.every(rule => rule.test(newPassword))

  const handleChangePassword = async () => {
    setPwError("")
    setPwSuccess("")

    if (!currentPassword) { setPwError("Enter current password"); return }
    if (!allPwRulesPass) { setPwError("New password doesn't meet requirements"); return }
    if (newPassword !== confirmPassword) { setPwError("Passwords don't match"); return }
    if (currentPassword === newPassword) { setPwError("New password must be different"); return }

    setChangingPw(true)

    try {
      const user = auth.currentUser
      if (!user || !user.email) {
        setPwError("Session expired. Please sign in again.")
        setChangingPw(false)
        return
      }

      // Re-authenticate first (Firebase requires this for password change)
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, newPassword)

      setPwSuccess("Password changed successfully! ✅")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowChangePassword(false)

      setTimeout(() => setPwSuccess(""), 5000)
    } catch (err: any) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPwError("Current password is incorrect")
      } else if (err.code === "auth/too-many-requests") {
        setPwError("Too many attempts. Try again later.")
      } else if (err.code === "auth/requires-recent-login") {
        setPwError("Session expired. Please logout and login again.")
      } else {
        setPwError("Failed to change password. Try again.")
      }
    }

    setChangingPw(false)
  }

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const email = getUser()
    if (!email) return navigate("/")

    const snap = await getDoc(doc(db, "users", email))
    if (!snap.exists()) return

    const data: any = snap.data()

    setUser(data)
    setName(data.fullName || "")
    setPhone(data.phone || "")
    setWallet(data.walletAddress || "")

    if (data.walletAddress) setWalletLocked(true)

    setLoading(false)
  }

  const saveProfile = async () => {
    const email = getUser()
    if (!email) return

    setSaving(true)
    const userRef = doc(db, "users", email)

    const updateData: any = {
      fullName: name,
      phone: phone
    }

    if (!walletLocked && wallet) {
      updateData.walletAddress = wallet
    }

    await updateDoc(userRef, updateData)

    if (wallet && !walletLocked) {
      setWalletLocked(true)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050816]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading Profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white relative overflow-hidden">

      {/* AMBIENT BACKGROUND */}
      <div className="absolute top-[-15%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full" />

      <Navbar />

      <div className="relative z-10 p-6 max-w-lg mx-auto">

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <User className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            My Profile
          </h1>
        </div>

        {/* 🏢 COMPANY DIRECT MEMBER BADGE */}
        {user?.isCompanyDirect && (
          <div className="mb-6 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div>
              <p className="text-sm font-bold text-amber-400">Company Direct Member</p>
              <p className="text-[10px] text-amber-400/60">
                You joined directly under the company — a proud first-generation member!
              </p>
            </div>
          </div>
        )}

        {/* CARD */}
        <div className="relative">
          {/* Glow border */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/20 rounded-2xl blur-sm" />

          <div className="relative bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-7 space-y-5">

            {/* FULL NAME */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={user?.email || ""}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-gray-500 cursor-not-allowed"
                />
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              </div>
            </div>

            {/* PHONE */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Mobile</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* WALLET */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">
                BEP20 Wallet Address
              </label>
              <div className="relative">
                <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  disabled={walletLocked}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border transition-all duration-300 ${walletLocked
                    ? "bg-white/[0.02] border-white/5 text-gray-500 cursor-not-allowed"
                    : "bg-white/5 border-green-500/20 text-white placeholder-gray-500 focus:border-green-400/50 focus:bg-white/8 outline-none"
                    }`}
                  placeholder="Enter wallet address"
                />
                {walletLocked && (
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                )}
              </div>

              {walletLocked && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Lock className="w-3 h-3 text-green-500" />
                  <p className="text-green-400 text-xs">Wallet locked — cannot be changed</p>
                </div>
              )}

              {!walletLocked && (
                <p className="text-yellow-400/60 text-xs mt-1.5">⚠️ Wallet will be permanently locked after saving</p>
              )}
            </div>

            {/* JOINED DATE */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Joined Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={user?.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* CHANGE PASSWORD SECTION */}
            <div className="border-t border-white/10 pt-5">
              {pwSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-green-400 text-sm">{pwSuccess}</p>
                </div>
              )}

              <button
                onClick={() => { setShowChangePassword(!showChangePassword); setPwError(""); setPwSuccess("") }}
                className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] hover:border-amber-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition">Change Password</span>
                </div>
                {showChangePassword ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {showChangePassword && (
                <div className="mt-4 space-y-4 bg-white/[0.02] border border-white/8 rounded-xl p-5">
                  
                  {pwError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
                      <span className="text-red-400 text-sm">❌</span>
                      <p className="text-red-400 text-sm">{pwError}</p>
                    </div>
                  )}

                  {/* Current Password */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-amber-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-400 transition"
                      >
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">New Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-amber-400/50 focus:bg-white/8 outline-none transition-all duration-300"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-400 transition"
                      >
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength */}
                  {newPassword.length > 0 && (
                    <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3 space-y-1.5">
                      <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase tracking-wider">Requirements:</p>
                      {passwordRules.map(rule => (
                        <div key={rule.id} className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                            rule.test(newPassword)
                              ? 'bg-green-400/20 border border-green-400/40'
                              : 'bg-white/5 border border-white/10'
                          }`}>
                            {rule.test(newPassword)
                              ? <Check className="w-2 h-2 text-green-400" />
                              : <Circle className="w-1.5 h-1.5 text-gray-600" />
                            }
                          </div>
                          <span className={`text-[11px] transition-all ${rule.test(newPassword) ? 'text-green-400' : 'text-gray-500'}`}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Confirm Password */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-500 focus:bg-white/8 outline-none transition-all duration-300 ${
                          confirmPassword && confirmPassword === newPassword
                            ? 'border-green-500/40 focus:border-green-400/60'
                            : confirmPassword
                              ? 'border-red-500/40 focus:border-red-400/60'
                              : 'border-white/10 focus:border-amber-400/50'
                        }`}
                        placeholder="Re-enter new password"
                      />
                      {confirmPassword && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          {confirmPassword === newPassword
                            ? <Check className="w-4 h-4 text-green-400" />
                            : <span className="text-red-400 text-xs">✕</span>
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Change Password Button */}
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPw || !allPwRulesPass || newPassword !== confirmPassword || !currentPassword}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    {changingPw ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Changing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4" />
                        Update Password
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* SAVE BUTTON */}
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : saved ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Saved Successfully!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Profile
                </span>
              )}
            </button>

          </div>
        </div>

      </div>

    </div>
  )
}