import { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { navigate } from "@/lib/router"

import Navbar from "../components/Navbar" // ✅ ADDED

export default function Profile() {

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

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

    const userRef = doc(db, "users", email)

    const updateData: any = {
      fullName: name,
      phone: phone
    }

    if (!walletLocked && wallet) {
      updateData.walletAddress = wallet
    }

    await updateDoc(userRef, updateData)

    alert("✅ Profile Updated Successfully")

    if (wallet && !walletLocked) {
      setWalletLocked(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0919] text-cyan-400 text-lg animate-pulse">
        Loading Profile...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0919] text-white">

      {/* ✅ GLOBAL NAVBAR */}
      <Navbar />

      <div className="p-6 animate-fade-in">

        <div className="max-w-xl mx-auto">

          {/* TITLE */}
          <h1 className="text-3xl text-cyan-400 font-bold mb-8 tracking-wide">
            My Profile
          </h1>

          {/* CARD */}
          <div className="space-y-5 bg-[#1a1a2e] p-6 rounded-2xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/30 transition-all duration-500">

            {/* NAME */}
            <div>
              <label className="text-sm text-gray-400">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-3 rounded-lg bg-black/30 border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                placeholder="Enter full name"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <input
                value={user?.email || ""}
                disabled
                className="w-full mt-1 p-3 rounded-lg bg-black/50 border border-gray-500/20"
              />
            </div>

            {/* PHONE */}
            <div>
              <label className="text-sm text-gray-400">Mobile</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 p-3 rounded-lg bg-black/30 border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                placeholder="Optional"
              />
            </div>

            {/* WALLET */}
            <div>
              <label className="text-sm text-gray-400">
                BEP20 Wallet Address 🔐
              </label>

              <input
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                disabled={walletLocked}
                className={`w-full mt-1 p-3 rounded-lg border transition ${walletLocked
                  ? "bg-black/50 border-gray-500/20"
                  : "bg-black/30 border-green-500/30 focus:ring-2 focus:ring-green-400"
                  }`}
                placeholder="Enter wallet address"
              />

              {walletLocked && (
                <p className="text-green-400 text-xs mt-1 animate-pulse">
                  🔒 Wallet locked (cannot change)
                </p>
              )}
            </div>

            {/* JOIN DATE */}
            <div>
              <label className="text-sm text-gray-400">Joined Date</label>
              <input
                value={user?.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                disabled
                className="w-full mt-1 p-3 rounded-lg bg-black/50 border border-gray-500/20"
              />
            </div>

            {/* SAVE BUTTON */}
            <button
              onClick={saveProfile}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold hover:scale-105 hover:shadow-[0_0_20px_rgba(0,212,255,0.6)] transition-all duration-300"
            >
              💾 Save Profile
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}