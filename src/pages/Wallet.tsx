import { getUser } from "../lib/session"
import { useEffect, useState } from "react"
import { navigate } from "../lib/router"
import { db } from "../lib/firebase"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore"
import { Wallet as WalletIcon } from "lucide-react"

// ✅ IMPORT LOGOS (IMPORTANT)
import brsLogo from "../assets/brs.png"
import usdtLogo from "../assets/usdt.png"

export default function Wallet() {

  const [usdt, setUsdt] = useState(0)
  const [brs, setBrs] = useState(0)
  const [tokenPrice, setTokenPrice] = useState(0)

  const [withdraws, setWithdraws] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWallet()
  }, [])

  const loadWallet = async () => {

    const email = getUser()

    if (!email) {
      navigate("/")
      return
    }

    try {

      const userRef = doc(db, "users", email)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const data: any = userSnap.data()
        setUsdt(data.usdtBalance || 0)
        setBrs(data.brsBalance || 0)
      }

      const tokenSnap = await getDoc(doc(db, "config", "token"))

      if (tokenSnap.exists()) {
        const token: any = tokenSnap.data()
        setTokenPrice(token.price)
      }

      const wq = query(
        collection(db, "withdrawals"),
        where("userId", "==", email)
      )

      const wsnap = await getDocs(wq)

      const wlist: any[] = []
      wsnap.forEach((doc) => {
        wlist.push({ id: doc.id, ...doc.data() })
      })

      setWithdraws(wlist)

      const tq = query(
        collection(db, "transactions"),
        where("userId", "==", email)
      )

      const tsnap = await getDocs(tq)

      const tlist: any[] = []
      tsnap.forEach((doc) => {
        tlist.push({ id: doc.id, ...doc.data() })
      })

      setTransactions(tlist)

    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0919] flex items-center justify-center">
        <div className="text-[#00d4ff] text-xl">Loading wallet...</div>
      </div>
    )
  }

  return (

    <div className="min-h-screen bg-[#0B0919] text-white">

      {/* NAV */}
      <nav className="bg-[#1a1a2e] border-b border-[#00d4ff]/20 p-4 flex justify-between">
        <h1 className="text-2xl font-bold text-[#00d4ff]">
          Bharos Wallet
        </h1>

        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-300 hover:text-[#00d4ff]"
        >
          Dashboard
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* TITLE */}
        <div className="mb-10 flex items-center gap-3">
          <WalletIcon className="text-[#00d4ff]" size={32} />
          <h2 className="text-3xl font-bold">
            My Wallet
          </h2>
        </div>

        {/* 🔥 CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          {/* 🟡 BRS */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-700/10 border border-yellow-400/30 rounded-2xl p-6 shadow-lg shadow-yellow-500/20">

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-yellow-300 font-semibold">
                BRS Coin
              </h3>
              <img src={brsLogo} className="w-10 h-10 drop-shadow-[0_0_10px_gold]" />
            </div>

            <p className="text-3xl font-bold text-white">
              {brs} BRS
            </p>

            <p className="text-sm text-gray-400 mt-2">
              Token Price: <span className="text-yellow-400">${tokenPrice}</span>
            </p>

            <p className="text-green-400 font-semibold">
              Value: ${(brs * tokenPrice).toFixed(2)}
            </p>

            <div className="mt-6">
              <button
                onClick={() => navigate("/transfer")}
                className="w-full py-3 text-sm font-semibold bg-white/5 border border-white/20 rounded-lg hover:scale-105 hover:shadow-lg transition"
              >
                Send BRS
              </button>
            </div>

          </div>

          {/* 🟢 USDT */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-700/10 border border-green-400/30 rounded-2xl p-6 shadow-lg shadow-green-500/20">

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-green-300 font-semibold">
                USDT (BEP-20)
              </h3>
              <img src={usdtLogo} className="w-10 h-10 drop-shadow-[0_0_10px_green]" />
            </div>

            <p className="text-3xl font-bold text-white">
              ${usdt.toFixed(2)}
            </p>

            <p className="text-sm text-gray-400 mt-2">
              Network: <span className="text-green-400">BEP-20 (BSC)</span>
            </p>

            <p className="text-green-400 font-semibold">
              Status: Active
            </p>

            <div className="flex gap-4 mt-6">
              <button
                className="flex-1 py-3 text-sm font-semibold bg-white/5 border border-white/20 rounded-lg hover:scale-105 hover:shadow-lg transition"
              >
                Deposit
              </button>

              <button
                onClick={() => navigate("/withdraw")}
                className="flex-1 py-3 text-sm font-semibold bg-white/5 border border-white/20 rounded-lg hover:scale-105 hover:shadow-lg transition"
              >
                Withdraw
              </button>
            </div>

          </div>

        </div>

        {/* 📊 HISTORY */}
        <div className="bg-[#1a1a2e] border border-cyan-500/20 rounded-2xl p-6">

          <h2 className="text-xl font-bold mb-4 text-cyan-400">
            Transaction History
          </h2>

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="text-gray-400 border-b border-cyan-500/20">
                  <th className="py-2 text-left">Type</th>
                  <th className="py-2 text-left">Amount</th>
                  <th className="py-2 text-left">Status</th>
                </tr>
              </thead>

              <tbody>

                {withdraws.map((w, i) => (
                  <tr key={"w" + i} className="border-b border-gray-700/30">
                    <td className="py-3 text-red-400">USDT Withdraw</td>
                    <td className="py-3 text-yellow-400">${w.amount}</td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-xs ${w.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-green-500/20 text-green-400"
                        }`}>
                        {w.status === "pending" ? "Pending" : "Success"}
                      </span>
                    </td>
                  </tr>
                ))}

                {transactions
                  .sort((a: any, b: any) => {
                    const aTime = a.timestamp?.toDate?.() || new Date(0)
                    const bTime = b.timestamp?.toDate?.() || new Date(0)
                    return bTime.getTime() - aTime.getTime()
                  })
                  .map((t: any, i: number) => {
                  const isSend = t.type === "send" || t.type === "BRS_SEND"
                  const isBotEarn = t.type === "bot_earn"
                  const isCommission = t.type === "commission" || t.type === "team_reward" || t.type === "matrix_bonus"
                  const isActivation = t.type === "activation" || t.description?.includes?.("Activation")
                  const isDailyReward = t.type === "daily_reward" || t.type === "social_earn"
                  const isBRS = t.currency === "BRS"
                  const isUSDT = t.currency === "USDT"

                  // Determine display
                  let typeLabel = t.description || t.type || "Transaction"
                  let typeColor = "text-cyan-400"
                  let amountPrefix = "+"
                  let currencyLabel = isBRS ? "BRS" : isUSDT ? "USDT" : "BRS"

                  if (isSend) {
                    typeLabel = `BRS Send${t.description ? ` — ${t.description}` : ''}`
                    typeColor = "text-red-400"
                    amountPrefix = "-"
                  } else if (t.type === "receive" || t.type === "BRS_RECEIVE") {
                    typeLabel = "BRS Received"
                    typeColor = "text-green-400"
                  } else if (isBotEarn) {
                    typeLabel = t.description || "🤖 Bot Earn"
                    typeColor = "text-purple-400"
                  } else if (isCommission) {
                    typeLabel = t.description || "💰 Commission"
                    typeColor = isUSDT ? "text-green-400" : "text-yellow-400"
                  } else if (isActivation) {
                    typeLabel = t.description || "🎁 Activation Reward"
                    typeColor = "text-amber-400"
                  } else if (isDailyReward) {
                    typeLabel = t.description || "📅 Daily Reward"
                    typeColor = "text-blue-400"
                  }

                  const timeStr = t.timestamp?.toDate?.()
                    ? t.timestamp.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                    : ''

                  return (
                  <tr key={"t" + i} className="border-b border-gray-700/30">
                    <td className={`py-3 ${typeColor}`}>
                      <div className="flex flex-col">
                        <span className="text-xs">{typeLabel}</span>
                        {timeStr && <span className="text-[10px] text-gray-500">{timeStr}</span>}
                      </div>
                    </td>
                    <td className={`py-3 ${isSend ? 'text-red-400' : 'text-green-400'}`}>
                      {amountPrefix}{t.amount} {currencyLabel}
                    </td>
                    <td className="py-3">
                      <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                        Success
                      </span>
                    </td>
                  </tr>
                  )
                })}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  )
}