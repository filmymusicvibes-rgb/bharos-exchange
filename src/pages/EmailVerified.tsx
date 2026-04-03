import { useEffect, useState } from "react"
import { auth } from "../lib/firebase"
import { applyActionCode } from "firebase/auth"

export default function EmailVerified() {

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [show, setShow] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mode = params.get("mode")
    const oobCode = params.get("oobCode")

    if (mode === "verifyEmail" && oobCode) {
      // Apply the verification code
      applyActionCode(auth, oobCode)
        .then(() => {
          setStatus("success")
          setTimeout(() => setShow(true), 100)
        })
        .catch((err) => {
          console.error("Verification error:", err)
          if (err.code === "auth/invalid-action-code") {
            setErrorMsg("This link has expired or already been used.")
          } else {
            setErrorMsg("Verification failed. Please try again.")
          }
          setStatus("error")
          setTimeout(() => setShow(true), 100)
        })
    } else if (mode === "resetPassword") {
      // Password reset — redirect to auth page with code
      window.location.href = `/auth?mode=resetPassword&oobCode=${oobCode}`
    } else {
      // Direct visit or already verified
      setStatus("success")
      setTimeout(() => setShow(true), 100)
    }
  }, [])

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg, #030712 0%, #0a0e1e 40%, #0d0625 70%, #050816 100%)",
      color: "#fff",
      overflow: "hidden",
      position: "relative",
      padding: 20,
    }}>

      {/* Ambient Glow */}
      <div style={{ position: "fixed", top: "20%", left: "30%", width: 400, height: 400, background: `radial-gradient(circle, ${status === "error" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.1)"} 0%, transparent 70%)`, borderRadius: "50%", animation: "pulseOrb 6s ease-in-out infinite" }} />
      <div style={{ position: "fixed", bottom: "20%", right: "20%", width: 350, height: 350, background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)", borderRadius: "50%", animation: "pulseOrb 8s ease-in-out 2s infinite" }} />

      {/* Card */}
      <div style={{
        position: "relative",
        maxWidth: 440,
        width: "100%",
        textAlign: "center",
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>

        {/* Glow Border */}
        <div style={{
          position: "absolute", inset: -1, borderRadius: 24,
          background: status === "error"
            ? "linear-gradient(135deg, rgba(239,68,68,0.4), rgba(220,38,38,0.3))"
            : "linear-gradient(135deg, rgba(16,185,129,0.4), rgba(34,211,238,0.3), rgba(139,92,246,0.4))",
          filter: "blur(1px)",
        }} />

        <div style={{
          position: "relative",
          background: "rgba(13,17,23,0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: "48px 32px",
        }}>

          {/* VERIFYING STATE */}
          {status === "verifying" && (
            <>
              <div style={{
                width: 80, height: 80, margin: "0 auto 24px",
                borderRadius: "50%",
                border: "3px solid rgba(34,211,238,0.2)",
                borderTopColor: "#22d3ee",
                animation: "spin 1s linear infinite",
              }} />
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                Verifying your email...
              </h1>
              <p style={{ fontSize: 14, color: "#6b7280" }}>Please wait</p>
            </>
          )}

          {/* SUCCESS STATE */}
          {status === "success" && (
            <>
              <div style={{
                width: 90, height: 90, margin: "0 auto 24px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(34,211,238,0.1))",
                border: "2px solid rgba(16,185,129,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: "successPulse 2s ease-in-out infinite",
              }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>

              <h1 style={{
                fontSize: 28, fontWeight: 800, marginBottom: 8,
                background: "linear-gradient(135deg, #10b981, #22d3ee)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Email Verified! ✅
              </h1>

              <p style={{ fontSize: 15, color: "#9ca3af", marginBottom: 32, lineHeight: 1.6 }}>
                Your email has been successfully verified.<br />
                Welcome to <span style={{ color: "#22d3ee", fontWeight: 600 }}>Bharos Exchange!</span>
              </p>

              {/* BRS Logo */}
              <div style={{
                width: 64, height: 64, margin: "0 auto 28px",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 30px rgba(250,204,21,0.3)",
                animation: "coinGlow 3s ease-in-out infinite",
              }}>
                <img src="/brs.png" alt="BRS" style={{ width: 64, height: 64, borderRadius: "50%" }} />
              </div>

              <a
                href="/auth"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
                  width: "100%", padding: "16px 0", borderRadius: 14,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff", fontWeight: 700, fontSize: 16,
                  textDecoration: "none", cursor: "pointer",
                  boxShadow: "0 4px 24px rgba(16,185,129,0.25)",
                  transition: "all 0.3s",
                }}
              >
                🚀 Sign In Now
              </a>

              <p style={{ fontSize: 12, color: "#4b5563", marginTop: 20 }}>
                Go back to login and sign in with your credentials
              </p>
            </>
          )}

          {/* ERROR STATE */}
          {status === "error" && (
            <>
              <div style={{
                width: 90, height: 90, margin: "0 auto 24px",
                borderRadius: "50%",
                background: "rgba(239,68,68,0.1)",
                border: "2px solid rgba(239,68,68,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#ef4444", marginBottom: 8 }}>
                Verification Failed
              </h1>

              <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 28, lineHeight: 1.6 }}>
                {errorMsg}
              </p>

              <a
                href="/auth"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: "100%", padding: "14px 0", borderRadius: 14,
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff", fontWeight: 700, fontSize: 15,
                  textDecoration: "none", cursor: "pointer",
                }}
              >
                Try Again
              </a>
            </>
          )}

          {/* Branding */}
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{
              fontSize: 18, fontWeight: 700,
              background: "linear-gradient(135deg, #22d3ee, #8b5cf6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Bharos Exchange
            </p>
            <p style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>
              The Future of Crypto Exchange
            </p>
          </div>

        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulseOrb {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes successPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.2); }
          50% { box-shadow: 0 0 0 12px rgba(16,185,129,0); }
        }
        @keyframes coinGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(250,204,21,0.3); }
          50% { box-shadow: 0 0 40px rgba(250,204,21,0.5); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      `}</style>
    </div>
  )
}
