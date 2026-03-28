import {Twitter, Github, Send} from 'lucide-react'
import brsLogo from "../assets/brs.png"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative border-t border-cyan-500/20 bg-[#0B0919] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={brsLogo} className="w-10 h-10 rounded-full drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" alt="BRS" />
              <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Bharos Exchange
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Building a secure and transparent crypto ecosystem for the future. A community-driven digital finance platform powered by BRS Coin.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={<Twitter size={20} />} />
              <SocialIcon icon={<Send size={20} />} />
              <SocialIcon icon={<Github size={20} />} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <FooterLink text="Home" href="#hero" />
              <FooterLink text="About" href="#about" />
              <FooterLink text="Features" href="#features" />
              <FooterLink text="Tokenomics" href="#tokenomics" />
              <FooterLink text="Roadmap" href="#roadmap" />
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-3">
              <FooterLink text="Whitepaper" href="#" />
              <FooterLink text="Documentation" href="#" />
              <FooterLink text="Support" href="#" />
              <FooterLink text="FAQs" href="#" />
              <FooterLink text="Terms of Service" href="#" />
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-cyan-500/20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} Bharos Exchange. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Built with <span className="text-cyan-400">♦</span> on blockchain technology
          </p>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="w-10 h-10 border border-cyan-500/30 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-400/60 hover:bg-cyan-500/10 transition-all duration-300 hover:scale-110">
      {icon}
    </button>
  )
}

function FooterLink({ text, href }: { text: string; href: string }) {
  return (
    <li>
      <a
        href={href}
        className="text-gray-400 hover:text-cyan-400 transition-colors duration-200 text-sm"
      >
        {text}
      </a>
    </li>
  )
}

export default Footer
