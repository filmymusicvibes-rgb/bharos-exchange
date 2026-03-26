import { useState, useEffect, useRef } from 'react'
import {Copy, Check, Shield} from 'lucide-react'

function BRSSmartContract() {
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLaunched, setIsLaunched] = useState(false) // Set to true after token listing
  const [glowActive, setGlowActive] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  
  // Full contract address (will be revealed after launch)
  const fullContractAddress = "0xB7A9C5E3D8F92A6B4E1C7D9F2A5B8C3E6D9F1A4B"
  const maskedAddress = "0xB7A9****F92A"
  
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullContractAddress)
      setCopied(true)
      setGlowActive(true)
      setTimeout(() => {
        setCopied(false)
        setGlowActive(false)
      }, 1000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <section 
      id="smart-contract" 
      ref={sectionRef} 
      className="relative py-8 lg:py-16 px-4 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"
    >
      <div className="max-w-4xl mx-auto">
        <div className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {/* Section Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                BRS Smart Contract
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Official BRS token smart contract on BNB Smart Chain
            </p>
          </div>

          {/* Contract Display Card */}
          <div className="relative">
            {/* Glowing background */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl animate-pulse" />
            
            <div className="relative bg-[#1a1a2e] border-2 border-cyan-500/40 rounded-2xl p-8 hover:border-cyan-400/60 transition-all duration-300">
              {/* Network Badge */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-yellow-400" />
                <span className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/40 rounded-full text-yellow-400 text-sm font-semibold">
                  BEP20 Smart Contract (BNB Smart Chain)
                </span>
              </div>

              {/* Contract Address Display */}
              <div className="bg-[#0B0919] border border-cyan-500/30 rounded-xl p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1 w-full min-w-0 text-center sm:text-left">
                    <p className="text-gray-400 text-sm mb-2">Contract Address</p>
                    <div className="font-mono text-base sm:text-lg lg:text-xl text-white break-all">
                      {isLaunched ? (
                        // Show full address after launch
                        <span className="tracking-wide">{fullContractAddress}</span>
                      ) : (
                        // Show animated masked address before launch
                        <span className="inline-block animate-pulse tracking-wide">
                          {maskedAddress}
                        </span>
                      )}
                    </div>
                    {!isLaunched && (
                      <p className="text-cyan-400 text-xs sm:text-sm mt-3 animate-pulse">
                        Full address will be revealed after token listing
                      </p>
                    )}
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className={`group relative w-full sm:w-auto justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:scale-105 ${
                      glowActive ? 'shadow-cyan-400/70' : 'shadow-cyan-500/30 hover:shadow-cyan-400/50'
                    }`}
                  >
                    {copied ? <Check className="w-5 h-5 shrink-0 text-white" /> : <Copy className="w-5 h-5 shrink-0" />}
                    <span className="text-sm sm:text-base whitespace-nowrap">{copied ? "Copied!" : "Copy Contract Address"}</span>
                    
                    {/* Enhanced glowing border effect */}
                    <div className={`absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 blur transition-all duration-300 ${
                      glowActive ? 'opacity-40 scale-110' : 'opacity-0 group-hover:opacity-20'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-[#0B0919] border border-cyan-500/20 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Network</p>
                  <p className="text-white font-semibold">BNB Chain</p>
                </div>
                <div className="bg-[#0B0919] border border-cyan-500/20 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Token Standard</p>
                  <p className="text-white font-semibold">BEP20</p>
                </div>
                <div className="bg-[#0B0919] border border-cyan-500/20 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Symbol</p>
                  <p className="text-yellow-400 font-semibold">BRS</p>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm text-center">
                  <span className="font-semibold">⚠️ Always verify the contract address</span> before any transaction. 
                  Bharos official channels will announce the contract deployment.
                </p>
              </div>
            </div>
          </div>

          {/* Animated Glow Lines */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  )
}

export default BRSSmartContract
