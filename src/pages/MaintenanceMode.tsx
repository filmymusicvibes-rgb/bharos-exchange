import { useState, useEffect } from "react"

export default function MaintenanceMode() {
  const [dots, setDots] = useState("")
  const [glowIntensity, setGlowIntensity] = useState(0)

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".")
    }, 500)

    const glowInterval = setInterval(() => {
      setGlowIntensity(prev => prev >= 100 ? 0 : prev + 1)
    }, 30)

    return () => {
      clearInterval(dotInterval)
      clearInterval(glowInterval)
    }
  }, [])

  const glowOpacity = (Math.sin(glowIntensity * 0.0628) + 1) / 2

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #050816 0%, #0B0919 30%, #111340 60%, #050816 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      overflow: "hidden",
      position: "relative",
    }}>

      {/* Animated background particles */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            background: i % 3 === 0 ? "#06b6d4" : i % 3 === 1 ? "#8b5cf6" : "#f59e0b",
            borderRadius: "50%",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.1,
            animation: `float-particle ${Math.random() * 6 + 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
          }} />
        ))}
      </div>

      {/* Glowing orbs background */}
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
        top: "-100px",
        right: "-100px",
        filter: "blur(60px)",
        animation: "pulse-orb 4s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute",
        width: "350px",
        height: "350px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
        bottom: "-80px",
        left: "-80px",
        filter: "blur(50px)",
        animation: "pulse-orb 5s ease-in-out infinite",
        animationDelay: "2s",
      }} />

      {/* Main content */}
      <div style={{
        position: "relative",
        zIndex: 10,
        textAlign: "center",
        padding: "40px",
        maxWidth: "600px",
      }}>

        {/* Logo / Shield Icon */}
        <div style={{
          width: "120px",
          height: "120px",
          margin: "0 auto 32px",
          position: "relative",
        }}>
          <div style={{
            width: "100%",
            height: "100%",
            borderRadius: "28px",
            background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))",
            border: "1px solid rgba(6,182,212,0.3)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 ${30 + glowOpacity * 30}px rgba(6,182,212,${0.2 + glowOpacity * 0.3})`,
            transition: "box-shadow 0.3s ease",
            animation: "float-logo 3s ease-in-out infinite",
          }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              {/* Shield shape */}
              <path d="M32 4L8 16V32C8 46.4 18.4 59.6 32 64C45.6 59.6 56 46.4 56 32V16L32 4Z"
                fill="url(#shield-gradient)" stroke="rgba(6,182,212,0.6)" strokeWidth="1.5" />
              {/* B letter */}
              <text x="32" y="42" textAnchor="middle" fill="white" fontSize="28" fontWeight="800"
                fontFamily="'Inter', sans-serif">B</text>
              <defs>
                <linearGradient id="shield-gradient" x1="8" y1="4" x2="56" y2="64">
                  <stop offset="0%" stopColor="rgba(6,182,212,0.3)" />
                  <stop offset="100%" stopColor="rgba(139,92,246,0.3)" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Rotating ring around logo */}
          <div style={{
            position: "absolute",
            inset: "-8px",
            borderRadius: "36px",
            border: "2px solid transparent",
            borderTopColor: "rgba(6,182,212,0.5)",
            borderRightColor: "rgba(139,92,246,0.3)",
            animation: "spin-slow 8s linear infinite",
          }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 42px)",
          fontWeight: 800,
          background: "linear-gradient(135deg, #06b6d4, #8b5cf6, #f59e0b)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "12px",
          letterSpacing: "-0.5px",
        }}>
          BHAROS EXCHANGE
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: "18px",
          color: "rgba(255,255,255,0.6)",
          marginBottom: "40px",
          fontWeight: 300,
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}>
          Coming Soon
        </p>

        {/* Status Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))",
          border: "1px solid rgba(6,182,212,0.15)",
          borderRadius: "20px",
          padding: "32px",
          backdropFilter: "blur(20px)",
          marginBottom: "32px",
        }}>
          {/* Animated gear icon */}
          <div style={{
            width: "48px",
            height: "48px",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{
              animation: "spin-gear 6s linear infinite",
            }}>
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="#06b6d4" strokeWidth="1.5" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                stroke="#06b6d4" strokeWidth="1.5" />
            </svg>
          </div>

          <h2 style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "white",
            marginBottom: "8px",
          }}>
            Under Construction{dots}
          </h2>

          <p style={{
            fontSize: "15px",
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.7,
            maxWidth: "400px",
            margin: "0 auto",
          }}>
            We're building something amazing! Our platform is being crafted with cutting-edge technology to give you the best crypto experience.
          </p>
        </div>

        {/* Feature preview pills */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          justifyContent: "center",
          marginBottom: "40px",
        }}>
          {["🔒 Secure Trading", "💎 Staking Rewards", "🌐 P2P Exchange", "🎁 Airdrops"].map((feature, i) => (
            <span key={i} style={{
              padding: "8px 18px",
              borderRadius: "100px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)",
              fontSize: "13px",
              fontWeight: 500,
            }}>
              {feature}
            </span>
          ))}
        </div>

        {/* Social links */}
        <div style={{
          display: "flex",
          gap: "16px",
          justifyContent: "center",
          marginBottom: "32px",
        }}>
          {[
            { name: "Telegram", icon: "✈️", url: "https://t.me/bharos_exchange" },
            { name: "Twitter", icon: "🐦", url: "#" },
            { name: "YouTube", icon: "▶️", url: "#" },
          ].map((social, i) => (
            <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              textDecoration: "none",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.background = "rgba(6,182,212,0.15)"
              ;(e.target as HTMLElement).style.borderColor = "rgba(6,182,212,0.3)"
              ;(e.target as HTMLElement).style.transform = "translateY(-2px)"
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.background = "rgba(255,255,255,0.04)"
              ;(e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"
              ;(e.target as HTMLElement).style.transform = "translateY(0)"
            }}
            >
              {social.icon}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p style={{
          color: "rgba(255,255,255,0.2)",
          fontSize: "12px",
        }}>
          © 2026 Bharos Exchange. All rights reserved.
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }

        @keyframes pulse-orb {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        @keyframes float-logo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-gear {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
