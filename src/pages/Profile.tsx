import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { navigate } from "@/lib/router"
import { User, Mail, Phone, Wallet, Calendar, Lock, Save, CheckCircle } from "lucide-react"

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

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const email = localStorage.getItem("bharos_user")
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
    const email = localStorage.getItem("bharos_user")
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
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <User className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            My Profile
          </h1>
        </div>

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