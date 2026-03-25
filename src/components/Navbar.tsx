import { useState, useEffect } from 'react'
import { navigate } from '@/lib/router'

function Navbar() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("bharos_user")
    setIsLoggedIn(!!user)
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    } else {
      // Navigate to home then try to scroll if not on home
      navigate("/")
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }

  return (
    <nav className="flex justify-between items-center p-4 bg-[#0B0919] text-white border-b border-cyan-500/20">

      {/* LOGO */}
      <h1
        onClick={() => navigate("/")}
        className="text-cyan-400 font-bold text-xl cursor-pointer"
      >
        Bharos
      </h1>

      {/* MENU */}
      <div className="flex gap-6 items-center">

        {isLoggedIn ? (
          <>
            <button onClick={() => navigate("/dashboard")}>Dashboard</button>
            <button onClick={() => navigate("/referral-network")}>Network</button>
            <button onClick={() => navigate("/leaderboard")}>Leaderboard</button>
            <button onClick={() => navigate("/transactions")}>Transactions</button>
            <button onClick={() => navigate("/profile")}>Profile</button>

            <button
              onClick={() => {
                localStorage.removeItem("bharos_user")
                navigate("/")
                window.location.reload()
              }}
              className="text-red-400 hover:scale-105 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button onClick={() => scrollToSection("home")}>Home</button>
            <button onClick={() => scrollToSection("about")}>About</button>
            <button onClick={() => scrollToSection("features")}>Features</button>
            <button onClick={() => scrollToSection("tokenomics")}>Tokenomics</button>
            <button onClick={() => scrollToSection("roadmap")}>Roadmap</button>
            <button onClick={() => scrollToSection("community")}>Community</button>

            <button
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1 rounded-lg hover:scale-105 transition"
            >
              Join Now
            </button>
          </>
        )}

      </div>

    </nav>
  )
}

export default Navbar