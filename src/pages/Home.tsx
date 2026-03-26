import { useEffect, useState } from "react"
import Hero from "@/components/Hero"
import AnnouncementsSlider from "@/components/AnnouncementsSlider"
import About from "@/components/About"
import Features from "@/components/Features"
import Tokenomics from "@/components/Tokenomics"
import BRSSmartContract from "@/components/BRSSmartContract"
import PriceGrowthStrategy from "@/components/PriceGrowthStrategy"
import BharosATMCard from "@/components/BharosATMCard"
import AIGrowthModel from "@/components/AIGrowthModel"
import CommunityGovernance from "@/components/CommunityGovernance"
import Membership from "@/components/Membership"
import Referral from "@/components/Referral"
import Roadmap from "@/components/Roadmap"
import MobileApp from "@/components/MobileApp"
import Community from "@/components/Community"
import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import ParticleBackground from "@/components/ParticleBackground"

function Home() {

  if (window.location.pathname !== "/") return null

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative min-h-screen bg-[#0B0919] text-white overflow-x-hidden">

      <ParticleBackground />
      <Navbar />

      <main className={`relative z-10 px-4 transition-opacity duration-1000 ${mounted ? "opacity-100" : "opacity-0"}`}>

        <Hero />

        <div className="mt-6">
          <AnnouncementsSlider />
        </div>

        <section id="about" className="py-6">
          <About />
        </section>

        <div className="py-4">
          <Features />
        </div>

        <section id="tokenomics" className="py-6">
          <Tokenomics />
        </section>

        <div className="py-4">
          <BRSSmartContract />
        </div>

        <div className="py-4">
          <PriceGrowthStrategy />
        </div>

        <div className="py-4">
          <AIGrowthModel />
        </div>

        <div className="py-4">
          <CommunityGovernance />
        </div>

        <div className="py-4">
          <BharosATMCard />
        </div>

        <div className="py-4">
          <Membership />
        </div>

        <div className="py-4">
          <Referral />
        </div>

        <section id="roadmap" className="py-6">
          <Roadmap />
        </section>

        <div className="py-4">
          <MobileApp />
        </div>

        <section id="community" className="py-6">
          <Community />
        </section>

      </main>

      <Footer />

    </div>
  )
}

export default Home