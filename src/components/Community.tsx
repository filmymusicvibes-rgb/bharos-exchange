import { useEffect, useState, useRef } from 'react'
import { Send, FileText, Bell, MessageCircleDashed as MessageCircle } from 'lucide-react'

function Community() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="community" ref={sectionRef} className="relative py-24 px-4">
      <div className="max-w-5xl mx-auto">

        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Join the Bharos Community
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Connect with thousands of traders, investors, and blockchain enthusiasts building the future of finance
          </p>
        </div>

        {/* CTA Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

          {/* TELEGRAM */}
          <CommunityButton
            icon={<Send className="w-6 h-6" />}
            label="Join Telegram"
            subtitle="Live community chat"
            delay="0ms"
            isVisible={isVisible}
            link="https://t.me/Bharos_exchange"
          />

          {/* WHATSAPP */}
          <CommunityButton
            icon={<MessageCircle className="w-6 h-6" />}
            label="Join WhatsApp"
            subtitle="Official updates channel"
            delay="100ms"
            isVisible={isVisible}
            link="https://whatsapp.com/channel/0029VbCxxpI3wtbHACYFBm3H"
          />

          {/* WHITEPAPER */}
          <CommunityButton
            icon={<FileText className="w-6 h-6" />}
            label="Download Whitepaper"
            subtitle="Technical documentation"
            delay="200ms"
            isVisible={isVisible}
          />

          {/* NEWS */}
          <CommunityButton
            icon={<Bell className="w-6 h-6" />}
            label="Stay Updated"
            subtitle="Newsletter signup"
            delay="300ms"
            isVisible={isVisible}
          />

        </div>

        {/* Newsletter */}
        <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-cyan-500/30 rounded-2xl p-10 shadow-2xl shadow-cyan-500/10">
            <h3 className="text-2xl font-bold text-white mb-3 text-center">Subscribe to Updates</h3>
            <p className="text-gray-400 mb-6 text-center">
              Get the latest news, announcements, and exclusive offers
            </p>

            <form className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-5 py-4 bg-[#0B0919] border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold hover:scale-105 transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

      </div>
    </section>
  )
}

function CommunityButton({
  icon,
  label,
  subtitle,
  delay,
  isVisible,
  link,
}: {
  icon: React.ReactNode
  label: string
  subtitle: string
  delay: string
  isVisible: boolean
  link?: string
}) {
  return (
    <button
      onClick={() => link && window.open(link)}
      className={`group bg-[#1a1a2e] border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 text-left ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      style={{ transitionDelay: delay }}
    >
      <div className="text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="text-white font-semibold mb-1">{label}</p>
      <p className="text-gray-400 text-sm">{subtitle}</p>
    </button>
  )
}

export default Community