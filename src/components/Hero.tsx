import { useEffect, useState } from 'react'

import coin from "../assets/brs.png"

function Hero() {

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({
      behavior: 'smooth'
    })
  }

  return (
    <section
      id="home"
      className="relative min-h-[75vh] flex items-center justify-center px-4 md:px-8 py-10"
    >

      <div className={`relative z-10 w-full max-w-[1400px] mx-auto text-center transition-all duration-1000
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

        {/* 🪙 BIG COIN */}
        <div className="mb-2 flex justify-center">
          <img
            src={coin}
            alt="BRS Coin"
            className="w-64 sm:w-80 md:w-[420px] lg:w-[520px] drop-shadow-[0_0_100px_rgba(255,215,0,1)] animate-float"
          />
        </div>

        {/* 🔥 TITLE */}
        <h1 className="font-bold mb-2 leading-tight">
          <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-8xl bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Bharos Exchange
          </span>

          <span className="block text-white text-2xl sm:text-4xl md:text-5xl lg:text-6xl mt-1">
            Trustworthy Crypto for Everyone
          </span>
        </h1>

        {/* 📄 SUBTEXT */}
        <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 max-w-2xl mx-auto px-2">
          A community-driven digital finance ecosystem powered by{" "}
          <span className="text-yellow-400 font-semibold">BRS Coin</span>
        </p>

        {/* 🔘 BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">

          <button
            onClick={scrollToFeatures}
            className="w-full sm:w-auto px-8 py-3 border border-cyan-500/30 rounded-lg text-cyan-400"
          >
            Explore Features
          </button>

        </div>

      </div>
    </section>
  )
}

export default Hero