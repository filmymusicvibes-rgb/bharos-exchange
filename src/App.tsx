import { useEffect, useState, lazy, Suspense } from "react"
import { getCurrentPath } from "./lib/router"
import SupportChat from "./components/SupportChat"

import Home from "./pages/Home"
import Auth from "./pages/Auth"

// Lazy load all dashboard pages (code splitting — reduces initial bundle)
const Dashboard = lazy(() => import("./pages/Dashboard"))
const AdminPanel = lazy(() => import("./pages/AdminPanel"))
const ActivateMembership = lazy(() => import("./pages/ActivateMembership"))
const ReferralNetwork = lazy(() => import("./pages/ReferralNetwork"))
const ReferralEarnings = lazy(() => import("./pages/ReferralEarnings"))
const Withdraw = lazy(() => import("./pages/Withdraw"))
const WithdrawHistory = lazy(() => import("./pages/WithdrawHistory"))
const Transactions = lazy(() => import("./pages/Transactions"))
const Wallet = lazy(() => import("./pages/Wallet"))
const Leaderboard = lazy(() => import("./pages/Leaderboard"))
const TransferBRS = lazy(() => import("./pages/TransferBRS"))
const Profile = lazy(() => import("./pages/Profile"))
const AdminLogin = lazy(() => import("./pages/AdminLogin"))
const Support = lazy(() => import("./pages/Support"))
const FAQs = lazy(() => import("./pages/FAQs"))
const TermsOfService = lazy(() => import("./pages/TermsOfService"))
const Staking = lazy(() => import("./pages/Staking"))
const WithdrawBRS = lazy(() => import("./pages/WithdrawBRS"))
const SocialEarn = lazy(() => import("./pages/SocialEarn"))
const DailyRewards = lazy(() => import("./pages/DailyRewards"))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050816]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  )
}

export default function App() {

  const [path, setPath] = useState(getCurrentPath())

  useEffect(() => {
    const handleRouteChange = () => {
      setPath(getCurrentPath())
    }

    window.addEventListener("popstate", handleRouteChange)

    return () => {
      window.removeEventListener("popstate", handleRouteChange)
    }
  }, [])

  // Home and Auth are static imports (instant load)
  if (path === "/") return <><Home /><SupportChat /></>
  if (path === "/auth") return <><Auth /><SupportChat /></>

  // All other pages are lazy loaded
  let Page = null

  if (path === "/dashboard") Page = <Dashboard />
  else if (path === "/wallet") Page = <Wallet />
  else if (path === "/withdraw") Page = <Withdraw />
  else if (path === "/withdraw-history") Page = <WithdrawHistory />
  else if (path === "/transactions") Page = <Transactions />
  else if (path === "/transfer") Page = <TransferBRS />
  else if (path === "/leaderboard") Page = <Leaderboard />
  else if (path === "/referral-network") Page = <ReferralNetwork />
  else if (path === "/referral-earnings") Page = <ReferralEarnings />
  else if (path === "/activate-membership" || path === "/activate") Page = <ActivateMembership />
  else if (path === "/admin") Page = <AdminPanel />
  else if (path === "/admin-login") Page = <AdminLogin />
  else if (path === "/profile") Page = <Profile />
  else if (path === "/support") Page = <Support />
  else if (path === "/faqs") Page = <FAQs />
  else if (path === "/terms-of-service") Page = <TermsOfService />
  else if (path === "/staking") Page = <Staking />
  else if (path === "/withdraw-brs") Page = <WithdrawBRS />
  else if (path === "/social-earn") Page = <SocialEarn />
  else if (path === "/daily-rewards") Page = <DailyRewards />
  else return <Home />

  const showChat = path !== "/admin" && path !== "/admin-login"

  return (
    <div className="bg-[#0B0919] min-h-screen overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto px-4">
        <Suspense fallback={<PageLoader />}>
          {Page}
        </Suspense>
      </div>
      {showChat && <SupportChat />}
    </div>
  )
}