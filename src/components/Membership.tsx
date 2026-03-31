import { useEffect, useState, useRef } from 'react'
import {CheckCircle2, Wallet, Gift, RefreshCcw, Coins, Rocket} from 'lucide-react'
import { navigate } from '@/lib/router'

function Membership() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const isAuthenticated = !!sessionStorage.getItem('bharos_user')

  const handleActivateClick = () => {
    if (isAuthenticated) {
      navigate('/activate-membership')
    } else {
      navigate('/auth')
    }
  }

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
    <section id="membership" ref={sectionRef} className="relative py-8 lg:py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Membership & Subscription
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join the Bharos ecosystem with a one-time activation fee and unlock exclusive benefits
          </p>
        </div>

        <div className={`relative transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-yellow-500/20 rounded-3xl blur-2xl" />
          
          <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-cyan-500/40 rounded-3xl p-10 sm:p-12">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 rounded-full px-6 py-2 mb-6">
                <Wallet className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-400 font-semibold">Activation Package</span>
              </div>
              
              <div className="mb-4">
                <span className="text-7xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  $12
                </span>
                <span className="text-2xl text-gray-400 ml-2">USDT</span>
              </div>
              <p className="text-gray-400">One-time subscription fee</p>
            </div>

            <div className="space-y-4 mb-10">
              <BenefitItem
                icon={<Gift className="w-5 h-5" />}
                text="Receive 150 BRS tokens instantly credited to your wallet"
              />
              <BenefitItem
                icon={<CheckCircle2 className="w-5 h-5" />}
                text="Access to full trading platform and exchange features"
              />
              <BenefitItem
                icon={<CheckCircle2 className="w-5 h-5" />}
                text="Unlock 12-level referral commission system"
              />
              <BenefitItem
                icon={<CheckCircle2 className="w-5 h-5" />}
                text="Dual wallet system: USDT + BRS token wallets"
              />
              <BenefitItem
                icon={<CheckCircle2 className="w-5 h-5" />}
                text="Community governance voting rights"
              />
            </div>

            <button 
              onClick={handleActivateClick}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
            >
              Activate Account Now
            </button>
          </div>
        </div>

        {/* Membership Refund Policy Section */}
        <div className={`mt-16 transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h3 className="text-3xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Membership Refund Policy
            </span>
          </h3>

          {/* Description */}
          <div className="bg-[#1a1a2e] border border-cyan-500/30 rounded-xl p-8 mb-10 space-y-4">
            <p className="text-lg text-gray-300 leading-relaxed">
              Users join the Bharos ecosystem by activating their account with a <span className="text-cyan-400 font-semibold">12 USDT membership subscription</span>.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              This activation helps support platform development and ecosystem growth during the early phase of the project.
            </p>
          </div>

          {/* Refund Mechanism Card */}
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-600/20 to-yellow-500/20 rounded-2xl blur-xl" />
            
            <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-2 border-yellow-500/40 rounded-2xl p-8">
              <h4 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
                <RefreshCcw className="w-6 h-6" />
                Refund Mechanism
              </h4>
              
              <div className="space-y-4 text-gray-300">
                <p className="text-lg leading-relaxed">
                  After the official Bharos Exchange launch and BRS token listing in{' '}
                  <span className="text-yellow-400 font-semibold">Phase 3 (Q3 2026)</span>, users will receive BRS tokens equivalent to the{' '}
                  <span className="text-cyan-400 font-semibold">12 USDT activation amount</span>.
                </p>
                <p className="text-lg leading-relaxed">
                  The refund will be distributed automatically in the user's{' '}
                  <span className="text-yellow-400 font-semibold">BRS Wallet</span> inside the Bharos platform.
                </p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-[#1a1a2e] border border-cyan-500/30 rounded-xl p-8 mb-10">
            <h4 className="text-xl font-bold text-cyan-400 mb-6">Important Notes:</h4>
            <div className="space-y-4">
              <NoteItem
                icon={<Coins className="w-5 h-5" />}
                text="The refund will be issued in BRS tokens, not in USDT."
              />
              <NoteItem
                icon={<Coins className="w-5 h-5" />}
                text="The value of BRS tokens will be calculated based on the market price at the time of listing."
              />
              <NoteItem
                icon={<Rocket className="w-5 h-5" />}
                text="This mechanism rewards early supporters who joined the ecosystem during the development phase."
              />
            </div>
          </div>

          {/* Highlight Box */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-yellow-500/30 rounded-2xl blur-lg animate-pulse" />
            
            <div className="relative bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/50 rounded-2xl p-8 text-center">
              <div className="inline-block bg-yellow-500/20 border border-yellow-500/50 rounded-full px-4 py-1 mb-4">
                <span className="text-yellow-400 text-sm font-semibold">⭐ Early Supporter Reward</span>
              </div>
              <p className="text-lg text-gray-200 leading-relaxed">
                "Early supporters of Bharos Exchange will receive BRS tokens equivalent to their 12 USDT activation after the official exchange launch in{' '}
                <span className="text-yellow-400 font-bold">Phase 3 (Q3 2026)</span>."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function BenefitItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 text-gray-300">
      <div className="text-cyan-400 mt-0.5">{icon}</div>
      <p>{text}</p>
    </div>
  )
}

function NoteItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 text-gray-300">
      <div className="text-yellow-400 mt-0.5">{icon}</div>
      <p className="text-base">{text}</p>
    </div>
  )
}

export default Membership
