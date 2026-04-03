import { useState, useEffect, useRef } from "react"
import { db } from "../lib/firebase"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"

// ===== LAUNCH CONFIG =====
const LAUNCH_DATE = new Date("2026-04-07T00:01:00+05:30") // April 7, 2026 12:01 AM IST
const COMPANY_REF_CODE = "BRS44447"
const TELEGRAM_LINK = "https://t.me/Bharos_exchange"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function CountdownPage() {

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [copied, setCopied] = useState(false)
  const [phone, setPhone] = useState("")
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "saving" | "done" | "exists">("idle")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [particles] = useState(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 10,
  })))

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // ===== COUNTDOWN TIMER =====
  useEffect(() => {
    const update = () => {
      const now = new Date().getTime()
      const diff = LAUNCH_DATE.getTime() - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        window.location.reload()
        return
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  // ===== ANIMATED BACKGROUND =====
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const stars: { x: number; y: number; r: number; speed: number; alpha: number }[] = []
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.3 + 0.05,
        alpha: Math.random() * 0.8 + 0.2,
      })
    }

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        ctx.globalAlpha = s.alpha * (0.5 + 0.5 * Math.sin(Date.now() * 0.001 * s.speed))
        ctx.fillStyle = "#22d3ee"
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
        s.y -= s.speed * 0.5
        if (s.y < -5) { s.y = canvas.height + 5; s.x = Math.random() * canvas.width }
      })
      animId = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener("resize", handleResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", handleResize) }
  }, [])

  // ===== COPY REF CODE =====
  const copyCode = () => {
    navigator.clipboard.writeText(COMPANY_REF_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ===== COPY SHARE LINK =====
  const copyShareLink = () => {
    navigator.clipboard.writeText("https://bharosexchange.com?ref=BRS44447")
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  // ===== NOTIFY ME (WhatsApp) =====
  const handleNotify = async () => {
    if (!phone || phone.length < 10) return
    setNotifyStatus("saving")

    try {
      // Check if already registered
      const q = query(collection(db, "launch_notify"), where("phone", "==", phone))
      const existing = await getDocs(q)
      if (!existing.empty) {
        setNotifyStatus("exists")
        return
      }

      await addDoc(collection(db, "launch_notify"), {
        phone,
        createdAt: new Date(),
      })
      setNotifyStatus("done")
      setPhone("")
    } catch {
      setNotifyStatus("done")
    }
  }

  // ===== FAQ DATA =====
  const faqs = [
    {
      q: "Why is everyone joining at the same time?",
      a: "Bharos Exchange believes in FAIR LAUNCH — no unfair early access, no head-starts. Everyone gets an equal opportunity from second one. This ensures a level playing field for all members."
    },
    {
      q: "Why can't I register right now?",
      a: "We're building a community-first platform. Our synchronized launch ensures every member starts at the same level with equal opportunities. The strongest communities are built together, not in isolation."
    },
    {
      q: "What should I do right now?",
      a: "Save the referral code shown below (BRS44447). Be ready at 12:01 AM on April 7th. Share this page with friends. That's it!"
    },
    {
      q: "What is BRS Token?",
      a: "BRS is Bharos Exchange's native utility token built on the Binance Smart Chain. It starts at Phase 1 pricing and increases as the community grows. Genesis members get the best price — EVER."
    },
    {
      q: "Is my investment safe?",
      a: "Bharos Exchange is built on transparent blockchain smart contracts. All transactions are verifiable on-chain. The platform has been through extensive private beta testing and security audits."
    },
  ]

  // ===== BENEFITS DATA =====
  const benefits = [
    { icon: "🎁", title: "250 Extra BRS Tokens", desc: "Exclusive bonus only for Genesis members" },
    { icon: "👑", title: "Founding Member Badge", desc: "Permanent golden badge on your profile" },
    { icon: "⚡", title: "Priority Withdrawals", desc: "Your withdrawals get processed first" },
    { icon: "💰", title: "12-Level Referral Income", desc: "Earn USDT from 12 levels deep" },
    { icon: "📈", title: "Lowest BRS Price Ever", desc: "Phase 1 token price — never this low again" },
    { icon: "🪂", title: "Genesis Airdrop", desc: "Special airdrop for Week 1 active members" },
  ]

  // ===== FEATURES DATA =====
  const features = [
    { icon: "🔗", title: "Blockchain Powered", desc: "Built on Binance Smart Chain" },
    { icon: "💱", title: "Crypto Exchange", desc: "Trade, stake, and earn rewards" },
    { icon: "🔒", title: "Military-Grade Security", desc: "Smart contracts verified on-chain" },
    { icon: "📱", title: "Mobile App", desc: "Coming soon on Android & iOS" },
  ]

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "linear-gradient(180deg, #030712 0%, #0a0e1e 30%, #0d0625 60%, #050816 100%)", color: "#fff", overflow: "hidden" }}>

      {/* Canvas Background */}
      <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />

      {/* Floating Particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: "fixed", left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: "50%",
          background: p.id % 3 === 0 ? "#22d3ee" : p.id % 3 === 1 ? "#8b5cf6" : "#3b82f6",
          opacity: 0.3, filter: "blur(1px)", zIndex: 0,
          animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}

      {/* Glow Orbs */}
      <div style={{ position: "fixed", top: "10%", left: "20%", width: 400, height: 400, background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0, animation: "pulseOrb 8s ease-in-out infinite" }} />
      <div style={{ position: "fixed", bottom: "10%", right: "15%", width: 350, height: 350, background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0, animation: "pulseOrb 10s ease-in-out 2s infinite" }} />

      {/* MAIN CONTENT */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>

        {/* ===== HEADER ===== */}
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "6px 16px", borderRadius: 50, background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#22d3ee", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Genesis Launch Event</span>
          </div>

          <h1 style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16, background: "linear-gradient(135deg, #fff 0%, #22d3ee 50%, #8b5cf6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            The Future of Crypto<br />Exchange is Almost Here
          </h1>

          <p style={{ fontSize: "clamp(14px, 2.5vw, 18px)", color: "#9ca3af", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
            After months of development & security testing, Bharos Exchange
            is launching with a <span style={{ color: "#22d3ee", fontWeight: 600 }}>Fair Launch Event</span> — 
            where <strong>EVERYONE</strong> starts at the same time with equal opportunity.
          </p>
        </div>

        {/* ===== COUNTDOWN TIMER ===== */}
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16, letterSpacing: 3, textTransform: "uppercase" }}>Launching In</p>

          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(8px, 3vw, 20px)", marginBottom: 16 }}>
            {[
              { val: timeLeft.days, label: "Days" },
              { val: timeLeft.hours, label: "Hours" },
              { val: timeLeft.minutes, label: "Minutes" },
              { val: timeLeft.seconds, label: "Seconds" },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  width: "clamp(65px, 18vw, 110px)", height: "clamp(65px, 18vw, 110px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(34,211,238,0.2)",
                  borderRadius: 16,
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 0 30px rgba(34,211,238,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "rgba(255,255,255,0.02)", borderRadius: "16px 16px 0 0" }} />
                  <span style={{ fontSize: "clamp(28px, 7vw, 48px)", fontWeight: 800, fontFamily: "'Inter', monospace", color: "#fff", position: "relative" }}>
                    {String(item.val).padStart(2, "0")}
                  </span>
                </div>
                <p style={{ fontSize: "clamp(9px, 2vw, 12px)", color: "#6b7280", marginTop: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>{item.label}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: "16px 24px", borderRadius: 14, background: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(234,88,12,0.1) 100%)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <p style={{ fontSize: "clamp(18px, 4vw, 26px)", fontWeight: 800, background: "linear-gradient(135deg, #fbbf24, #f59e0b, #ea580c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>
              🗓️ April 7, 2026 — 12:01 AM IST
            </p>
            <p style={{ fontSize: 13, color: "#d97706", fontWeight: 500 }}>
              Mark your calendar! Be ready at midnight.
            </p>
          </div>
        </div>

        {/* ===== REFERRAL CODE ===== */}
        <div style={{
          textAlign: "center", marginBottom: 50, padding: "30px 24px",
          background: "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(139,92,246,0.08) 100%)",
          border: "1px solid rgba(34,211,238,0.2)", borderRadius: 20,
          backdropFilter: "blur(10px)", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 150, height: 150, background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />

          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4, textTransform: "uppercase", letterSpacing: 2, fontWeight: 600 }}>Official Company Referral Code</p>
          <p style={{ fontSize: 10, color: "#6b7280", marginBottom: 16 }}>Save this code — you'll need it on Launch Day!</p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{
              padding: "14px 32px", background: "rgba(10,15,30,0.9)",
              border: "2px solid rgba(34,211,238,0.4)", borderRadius: 14,
              fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 800, letterSpacing: 6,
              fontFamily: "'Inter', monospace", color: "#22d3ee",
              textShadow: "0 0 20px rgba(34,211,238,0.3)",
              animation: "glowCode 3s ease-in-out infinite",
            }}>
              {COMPANY_REF_CODE}
            </div>

            <button onClick={copyCode} style={{
              padding: "14px 24px", borderRadius: 12, border: "none",
              background: copied ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #22d3ee, #3b82f6)",
              color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
              transition: "all 0.3s", boxShadow: "0 4px 20px rgba(34,211,238,0.2)",
            }}>
              {copied ? "✅ Copied!" : "📋 Copy Code"}
            </button>
          </div>

          <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 16, fontWeight: 500 }}>
            ⚠️ Only this code qualifies for Genesis Founding Member benefits!
          </p>

          {/* SHARE LINK BUTTON */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>📤 Share this link with friends:</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{
                padding: "10px 16px", background: "rgba(10,15,30,0.9)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                fontSize: 13, color: "#22d3ee", fontFamily: "monospace",
                wordBreak: "break-all",
              }}>
                bharosexchange.com?ref=BRS44447
              </div>
              <button onClick={copyShareLink} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: linkCopied ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                transition: "all 0.3s",
              }}>
                {linkCopied ? "✅ Copied!" : "📋 Copy Link"}
              </button>
            </div>
          </div>
        </div>

        {/* ===== GENESIS BENEFITS ===== */}
        <div style={{ marginBottom: 50 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              👑 Genesis Founding Member Benefits
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Exclusive perks for those who join with Company Code on Launch Day</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {benefits.map((b, i) => (
              <div key={i} style={{
                padding: "20px 18px", borderRadius: 14,
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(10px)",
                transition: "all 0.3s", cursor: "default",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.3)"; e.currentTarget.style.transform = "translateY(-2px)" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(0)" }}
              >
                <span style={{ fontSize: 28 }}>{b.icon}</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginTop: 8, marginBottom: 4 }}>{b.title}</p>
                <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== WHY SYNCHRONIZED LAUNCH FAQ ===== */}
        <div style={{ marginBottom: 50 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              ❓ Why Synchronized Launch?
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280" }}>Everything you need to know about our Genesis Event</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{
                borderRadius: 14, overflow: "hidden",
                background: openFaq === i ? "rgba(34,211,238,0.05)" : "rgba(15,23,42,0.5)",
                border: `1px solid ${openFaq === i ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.06)"}`,
                transition: "all 0.3s",
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", padding: "16px 20px", background: "none", border: "none",
                    color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    textAlign: "left",
                  }}
                >
                  <span>❓ {faq.q}</span>
                  <span style={{ fontSize: 18, color: "#22d3ee", transition: "transform 0.3s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 16px", fontSize: 13, color: "#9ca3af", lineHeight: 1.6, animation: "fadeIn 0.3s ease" }}>
                    ✅ {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===== FEATURES TEASER ===== */}
        <div style={{ marginBottom: 50 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              ⚡ What's Coming
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280" }}>A glimpse of what awaits on April 7th</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                padding: 18, borderRadius: 14, textAlign: "center",
                background: "rgba(15,23,42,0.5)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ fontSize: 28 }}>{f.icon}</span>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginTop: 8 }}>{f.title}</p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== NOTIFY ME (WhatsApp) ===== */}
        <div style={{
          marginBottom: 50, padding: "28px 24px", borderRadius: 20, textAlign: "center",
          background: "linear-gradient(135deg, rgba(34,211,238,0.05) 0%, rgba(16,185,129,0.05) 100%)",
          border: "1px solid rgba(34,211,238,0.15)",
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>🔔 Get Notified on Launch</h3>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 18 }}>Enter your WhatsApp number — we'll add you to our launch notification list!</p>

          {notifyStatus === "done" ? (
            <div style={{ padding: "14px 20px", borderRadius: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <p style={{ color: "#10b981", fontSize: 14, fontWeight: 600 }}>✅ You're on the list! We'll notify you on launch day.</p>
            </div>
          ) : notifyStatus === "exists" ? (
            <div style={{ padding: "14px 20px", borderRadius: 12, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <p style={{ color: "#f59e0b", fontSize: 14, fontWeight: 600 }}>📱 This number is already registered! You'll be notified.</p>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <input
                type="tel"
                placeholder="Enter WhatsApp number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  padding: "12px 18px", borderRadius: 12, fontSize: 14, width: 240,
                  background: "rgba(10,15,30,0.8)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", outline: "none",
                }}
              />
              <button
                onClick={handleNotify}
                disabled={notifyStatus === "saving"}
                style={{
                  padding: "12px 24px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  opacity: notifyStatus === "saving" ? 0.6 : 1,
                }}
              >
                {notifyStatus === "saving" ? "Saving..." : "📲 Notify Me"}
              </button>
            </div>
          )}
        </div>

        {/* ===== TELEGRAM + SOCIAL ===== */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>Join our community for updates</p>
          <a
            href={TELEGRAM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "14px 28px", borderRadius: 14, textDecoration: "none",
              background: "linear-gradient(135deg, #0088cc, #006699)",
              color: "#fff", fontWeight: 700, fontSize: 15,
              boxShadow: "0 4px 20px rgba(0,136,204,0.2)",
              transition: "transform 0.3s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Join Bharos Telegram
          </a>
        </div>

        {/* ===== FOOTER ===== */}
        <div style={{ textAlign: "center", paddingBottom: 40 }}>
          <p style={{ fontSize: 22, fontWeight: 700, background: "linear-gradient(135deg, #22d3ee, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>
            Bharos Exchange
          </p>
          <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6 }}>
            "Great things are worth waiting for. Be part of crypto history."
          </p>
          <p style={{ fontSize: 10, color: "#374151", marginTop: 12 }}>
            © 2026 Bharos Exchange. All rights reserved.
          </p>
        </div>

      </div>

      {/* ===== ANIMATIONS ===== */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-30px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-15px) translateX(-10px); opacity: 0.2; }
          75% { transform: translateY(-40px) translateX(5px); opacity: 0.5; }
        }
        @keyframes pulseOrb {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }
        @keyframes glowCode {
          0%, 100% { text-shadow: 0 0 20px rgba(34,211,238,0.3); }
          50% { text-shadow: 0 0 40px rgba(34,211,238,0.6), 0 0 80px rgba(34,211,238,0.2); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        input::placeholder { color: #4b5563; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      `}</style>
    </div>
  )
}
