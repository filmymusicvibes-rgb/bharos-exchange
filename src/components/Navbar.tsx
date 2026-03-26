import { useState, useEffect } from 'react'
import { navigate } from '@/lib/router'
import { Menu, X } from 'lucide-react'

function Navbar() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("bharos_user")
    setIsLoggedIn(!!user)
  }, [])

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false) // Close menu on click
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

  const navigateTo = (path: string) => {
    setIsMobileMenuOpen(false)
    navigate(path)
  }

  const handleLogout = () => {
    localStorage.removeItem("bharos_user")
    navigate("/")
    window.location.reload()
  }

  return (
    <nav className="flex justify-between items-center p-4 bg-[#0B0919] text-white border-b border-cyan-500/20 relative z-50">

      {/* LOGO */}
      <h1
        onClick={() => navigate("/")}
        className="text-cyan-400 font-bold text-xl cursor-pointer"
      >
        Bharos
      </h1>

      {/* DESKTOP MENU */}
      <div className="hidden md:flex items-center gap-6 text-base flex-1 justify-center">
        {isLoggedIn ? (
          <>
            <button onClick={() => navigateTo("/dashboard")} className="hover:text-cyan-400 transition">Dashboard</button>
            <button onClick={() => navigateTo("/referral-network")} className="hover:text-cyan-400 transition">Network</button>
            <button onClick={() => navigateTo("/leaderboard")} className="hover:text-cyan-400 transition">Leaderboard</button>
            <button onClick={() => navigateTo("/transactions")} className="hover:text-cyan-400 transition">Transactions</button>
            <button onClick={() => navigateTo("/profile")} className="hover:text-cyan-400 transition">Profile</button>
          </>
        ) : (
          <>
            <button onClick={() => scrollToSection("home")} className="hover:text-cyan-400 transition">Home</button>
            <button onClick={() => scrollToSection("about")} className="hover:text-cyan-400 transition">About</button>
            <button onClick={() => scrollToSection("features")} className="hover:text-cyan-400 transition">Features</button>
            <button onClick={() => scrollToSection("tokenomics")} className="hover:text-cyan-400 transition">Tokenomics</button>
            <button onClick={() => scrollToSection("roadmap")} className="hover:text-cyan-400 transition">Roadmap</button>
            <button onClick={() => scrollToSection("community")} className="hover:text-cyan-400 transition">Community</button>
          </>
        )}
      </div>

      {/* DESKTOP RIGHT */}
      <div className="hidden md:flex items-center gap-4">
        {isLoggedIn ? (
          <button onClick={handleLogout} className="text-red-400 hover:scale-105 transition">
            Logout
          </button>
        ) : (
          <button 
            onClick={() => navigateTo("/auth")}
            className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition shrink-0"
          >
            Join Now
          </button>
        )}
      </div>

      {/* MOBILE CONTROLS & TOGGLE */}
      <div className="flex items-center gap-3 md:hidden">
        {!isLoggedIn && (
          <button 
            onClick={() => navigateTo("/auth")}
            className="px-3 py-1.5 text-xs bg-blue-500 rounded-lg hover:bg-blue-600 transition shrink-0"
          >
            Join Now
          </button>
        )}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-cyan-400 p-1">
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-[#0B0919] border-b border-cyan-500/20 py-4 px-6 flex flex-col gap-4 shadow-2xl md:hidden z-50">
          {isLoggedIn ? (
            <>
              <button onClick={() => navigateTo("/dashboard")} className="text-left text-lg hover:text-cyan-400 transition">Dashboard</button>
              <button onClick={() => navigateTo("/referral-network")} className="text-left text-lg hover:text-cyan-400 transition">Network</button>
              <button onClick={() => navigateTo("/leaderboard")} className="text-left text-lg hover:text-cyan-400 transition">Leaderboard</button>
              <button onClick={() => navigateTo("/transactions")} className="text-left text-lg hover:text-cyan-400 transition">Transactions</button>
              <button onClick={() => navigateTo("/profile")} className="text-left text-lg hover:text-cyan-400 transition">Profile</button>
              <hr className="border-cyan-500/20 my-2" />
              <button onClick={handleLogout} className="text-left text-lg text-red-400 hover:text-red-300 transition">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => scrollToSection("home")} className="text-left text-lg hover:text-cyan-400 transition">Home</button>
              <button onClick={() => scrollToSection("about")} className="text-left text-lg hover:text-cyan-400 transition">About</button>
              <button onClick={() => scrollToSection("features")} className="text-left text-lg hover:text-cyan-400 transition">Features</button>
              <button onClick={() => scrollToSection("tokenomics")} className="text-left text-lg hover:text-cyan-400 transition">Tokenomics</button>
              <button onClick={() => scrollToSection("roadmap")} className="text-left text-lg hover:text-cyan-400 transition">Roadmap</button>
              <button onClick={() => scrollToSection("community")} className="text-left text-lg hover:text-cyan-400 transition">Community</button>
            </>
          )}
        </div>
      )}

    </nav>
  )
}

export default Navbar