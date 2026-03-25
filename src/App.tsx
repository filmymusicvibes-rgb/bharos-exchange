import { useEffect, useState } from "react"
import { getCurrentPath } from "./lib/router"

import Home from "./pages/Home"
import Auth from "./pages/Auth"
import Dashboard from "./pages/Dashboard"
import AdminPanel from "./pages/AdminPanel"
import ActivateMembership from "./pages/ActivateMembership"
import ReferralNetwork from "./pages/ReferralNetwork"
import ReferralEarnings from "./pages/ReferralEarnings"
import Withdraw from "./pages/Withdraw"
import WithdrawHistory from "./pages/WithdrawHistory"
import Transactions from "./pages/Transactions"
import Wallet from "./pages/Wallet"
import Leaderboard from "./pages/Leaderboard"
import TransferBRS from "./pages/TransferBRS"
import Profile from "./pages/Profile" // ✅ ADDED
import AdminLogin from "./pages/AdminLogin"

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

  let Page = <Home />

  if (path === "/auth") Page = <Auth />
  if (path === "/dashboard") Page = <Dashboard />
  if (path === "/wallet") Page = <Wallet />
  if (path === "/withdraw") Page = <Withdraw />
  if (path === "/withdraw-history") Page = <WithdrawHistory />
  if (path === "/transactions") Page = <Transactions />
  if (path === "/transfer") Page = <TransferBRS />
  if (path === "/leaderboard") Page = <Leaderboard />
  if (path === "/referral-network") Page = <ReferralNetwork />
  if (path === "/referral-earnings") Page = <ReferralEarnings />
  if (path === "/activate-membership") Page = <ActivateMembership />
  if (path === "/activate") Page = <ActivateMembership />
  if (path === "/admin") Page = <AdminPanel />
  if (path === "/admin-login") Page = <AdminLogin />

  if (path === "/profile") Page = <Profile /> // ✅ THIS FIX

  return (
    <div className="bg-[#0B0919] min-h-screen">
      <div className="max-w-6xl mx-auto min-h-screen px-4 md:px-8">
        {Page}
      </div>
    </div>
  )
}