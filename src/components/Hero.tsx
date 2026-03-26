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
      className="relative flex items-center justify-center px-4 py-12 md:py-24 min-h-[50vh] md:min-h-[70vh]"
    >

      <div className={`w-full max-w-[1200px] mx-auto text-center transition-all duration-700
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

        {/* COIN */}
        <div className="mb-2 flex justify-center">
          <img
            src={coin}
            alt="BRS Coin"
            className="w-56 sm:w-72 md:w-80 lg:w-[420px] drop-shadow-[0_0_60px_rgba(255,215,0,0.8)]"
          />
        </div>

        {/* TITLE */}
        <h1 className="font-bold leading-tight">
          <span className="block text-3xl sm:text-5xl md:text-6xl bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Bharos Exchange
          </span>

          <span className="block text-white text-xl sm:text-3xl md:text-4xl mt-1">
            Trustworthy Crypto for Everyone
          </span>
        </h1>

        {/* SUBTEXT */}
        <p className="text-sm sm:text-base md:text-lg text-gray-300 mt-3 mb-5 max-w-xl mx-auto">
          A community-driven digital finance ecosystem powered by{" "}
          <span className="text-yellow-400 font-semibold">BRS Coin</span>
        </p>

        {/* BUTTON */}
        <button
          onClick={scrollToFeatures}
          className="px-6 py-2 border border-cyan-500/40 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition"
        >
          Explore Features
        </button>

      </div>
    </section>
  )
}

export default Hero