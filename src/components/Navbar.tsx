import { getUser, setUser, removeUser } from "@/lib/session"
import { useState, useEffect } from 'react'
import { navigate } from '@/lib/router'
import { Menu, X, LayoutDashboard, Network, Trophy, ArrowLeftRight, User, LogOut, Home, Info, Zap, Coins, Map, Users } from 'lucide-react'
import LanguageSwitcher from './LanguageSwitcher'
import NotificationBell from './NotificationBell'

function Navbar() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const user = getUser()
    setIsLoggedIn(!!user)
  }, [])

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    } else {
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
    setIsMobileMenuOpen(false)
    removeUser()
    navigate("/auth", true)
    window.location.reload()
  }

  // Menu items for logged-in users
  const loggedInMenu = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    // { label: "Staking", path: "/staking", icon: Lock },  // Hidden until listing — Phase 4
    { label: "Network", path: "/referral-network", icon: Network },
    { label: "Leaderboard", path: "/leaderboard", icon: Trophy },
    { label: "Transactions", path: "/transactions", icon: ArrowLeftRight },
    { label: "Profile", path: "/profile", icon: User },
  ]

  // Menu items for guests
  const guestSections = [
    { label: "Home", id: "home", icon: Home },
    { label: "About", id: "about", icon: Info },
    { label: "Features", id: "features", icon: Zap },
    { label: "Tokenomics", id: "tokenomics", icon: Coins },
    { label: "Roadmap", id: "roadmap", icon: Map },
    { label: "Community", id: "community", icon: Users },
  ]

  return (
    <>
      <nav className="flex justify-between items-center p-4 bg-[#0B0919] text-white border-b border-cyan-500/15 relative z-50">

        {/* LOGO */}
        <h1
          onClick={() => navigate("/")}
          className="text-cyan-400 font-bold text-xl cursor-pointer"
        >
          Bharos
        </h1>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-6 text-sm flex-1 justify-center">
          {isLoggedIn ? (
            loggedInMenu.map(item => (
              <button
                key={item.path}
                onClick={() => navigateTo(item.path)}
                className="hover:text-cyan-400 transition text-gray-300"
              >
                {item.label}
              </button>
            ))
          ) : (
            guestSections.map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="hover:text-cyan-400 transition text-gray-300"
              >
                {item.label}
              </button>
            ))
          )}
        </div>

        {/* DESKTOP RIGHT */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          {isLoggedIn && <NotificationBell />}
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigateTo("/auth")}
              className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105 transition-all"
            >
              Join Now
            </button>
          )}
        </div>

        {/* MOBILE CONTROLS */}
        <div className="flex items-center gap-2 md:hidden">
          {isLoggedIn && <NotificationBell />}
          <LanguageSwitcher />
          {isLoggedIn ? (
            <button
              onClick={() => navigateTo("/dashboard")}
              className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => navigateTo("/auth")}
              className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg"
            >
              Join Now
            </button>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-cyan-400 p-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

      </nav>

      {/* ===== MOBILE MENU OVERLAY (Outside nav to avoid z-index issues) ===== */}
      {isMobileMenuOpen && (
        <div className="md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          {/* Dark backdrop */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* Slide-in Panel */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '280px',
            height: '100%',
            backgroundColor: 'rgba(10, 14, 30, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(6,182,212,0.2)',
            boxShadow: '-10px 0 50px rgba(0,0,0,0.9)',
            animation: 'menuSlideIn 0.3s ease-out',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}>
            
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(13, 18, 35, 0.95)',
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#22d3ee' }}>Menu</div>
                <div style={{ fontSize: '10px', color: '#4b5563' }}>Bharos Exchange v1.0</div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#9ca3af',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu Items */}
            <div style={{ padding: '12px', flex: 1 }}>
              {isLoggedIn ? (
                <>
                  {loggedInMenu.map(item => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigateTo(item.path)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          color: '#d1d5db',
                          fontSize: '15px',
                          fontWeight: 500,
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
                          e.currentTarget.style.color = '#ffffff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = '#d1d5db'
                        }}
                      >
                        <Icon style={{ width: '18px', height: '18px', color: '#22d3ee' }} />
                        {item.label}
                      </button>
                    )
                  })}

                  {/* Divider */}
                  <div style={{ margin: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      color: '#f87171',
                      fontSize: '15px',
                      fontWeight: 500,
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <LogOut style={{ width: '18px', height: '18px' }} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  {guestSections.map(item => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          color: '#d1d5db',
                          fontSize: '15px',
                          fontWeight: 500,
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
                          e.currentTarget.style.color = '#ffffff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = '#d1d5db'
                        }}
                      >
                        <Icon style={{ width: '18px', height: '18px', color: '#22d3ee' }} />
                        {item.label}
                      </button>
                    )
                  })}

                  {/* Divider */}
                  <div style={{ margin: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

                  {/* CTA */}
                  <button
                    onClick={() => navigateTo("/auth")}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      fontWeight: 600,
                      fontSize: '14px',
                      color: '#000000',
                      background: 'linear-gradient(to right, #22d3ee, #3b82f6)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(34,211,238,0.2)',
                    }}
                  >
                    Join Now →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menu animation keyframes */}
      <style>{`
        @keyframes menuSlideIn {
          from { transform: translateX(100%); opacity: 0.5; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  )
}

export default Navbar