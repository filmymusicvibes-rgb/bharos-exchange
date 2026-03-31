import { useState } from 'react'
import { MessageCircle, X, Send, Headphones, Mail, ExternalLink } from 'lucide-react'

const faqItems = [
  { q: 'How to activate my account?', a: 'Deposit 12 USDT to the provided BEP20 address. Your account will be auto-verified via blockchain.' },
  { q: 'How to earn USDT referral?', a: 'Share your referral link. When someone joins and activates, you earn USDT commission through our 12-level system.' },
  { q: 'Where are my BRS Coins?', a: 'Your BRS balance is shown on your Dashboard. 150 BRS are credited on activation.' },
  { q: 'How to withdraw USDT?', a: 'Go to Dashboard → Withdraw. Enter your BEP20 wallet address and amount. Admin will process within 24 hours.' },
  { q: 'What is BRS Coin price?', a: 'Current price is $0.005. It will increase as we grow through phases. Target: $1.50 by Phase 5.' },
  { q: 'Is my investment safe?', a: 'Yes. BRS runs on BSC Mainnet smart contract. All transactions are transparent and on-chain.' },
]

export default function SupportChat() {
  const [open, setOpen] = useState(false)
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null)

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          open
            ? 'bg-red-500 hover:bg-red-400 rotate-0'
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-110 hover:shadow-cyan-500/40'
        }`}
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Green dot indicator */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
          <div className="absolute top-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-[#050816] animate-pulse" />
        </div>
      )}

      {/* CHAT PANEL */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 max-h-[70vh] bg-[#0d1117]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Bharos Support</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-green-400">Online 24/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Welcome */}
            <div className="bg-white/5 rounded-xl rounded-tl-none p-3 max-w-[85%]">
              <p className="text-xs text-gray-300">👋 Welcome to Bharos Support! How can we help you?</p>
            </div>

            {/* FAQ Buttons */}
            <div className="space-y-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Common Questions</p>
              {faqItems.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => setSelectedFaq(selectedFaq === i ? null : i)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all ${
                      selectedFaq === i
                        ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                        : 'bg-white/5 border border-white/5 text-gray-300 hover:bg-white/8 hover:border-white/10'
                    }`}
                  >
                    {faq.q}
                  </button>
                  {selectedFaq === i && (
                    <div className="ml-3 mt-2 bg-green-500/5 border border-green-500/10 rounded-xl rounded-tl-none p-3">
                      <p className="text-[11px] text-gray-300 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer — Contact Options */}
          <div className="border-t border-white/10 p-3 space-y-2">
            <p className="text-[10px] text-gray-500 text-center">Need more help? Contact us:</p>
            <div className="flex gap-2">
              <a
                href="mailto:support@bharosexchange.com"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition text-xs text-cyan-400"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
              <a
                href="https://t.me/bharosexchange"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition text-xs text-blue-400"
              >
                <Send className="w-3.5 h-3.5" />
                Telegram
              </a>
              <a
                href="https://wa.me/17248017964"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition text-xs text-green-400"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
