import { useState } from "react"

export default function AdminLogin() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const login = () => {

    // 🔥 simple check
    if (email === "admin@bharos.com" && password === "admin123") {
      localStorage.setItem("bharos_user", email)
      window.location.href = "/admin"
    } else {
      alert("Invalid admin credentials")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0919] text-white">

      <div className="bg-[#1a1a2e] p-8 rounded-xl w-80 space-y-4">

        <h2 className="text-xl text-cyan-400 text-center">Admin Login</h2>

        <input
          placeholder="Email"
          className="w-full p-2 bg-black/30 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 bg-black/30 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full bg-cyan-500 py-2 rounded"
        >
          Login
        </button>

      </div>

    </div>
  )
}
