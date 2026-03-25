import { useState } from 'react'
import {Wallet, Send, Download, Copy, Share2, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle, Clock} from 'lucide-react'

function WalletDashboardPreview() {
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedReferral, setCopiedReferral] = useState(false)

  const handleCopyAddress = () => {
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const handleCopyReferral = () => {
    setCopiedReferral(true)
    setTimeout(() => setCopiedReferral(false), 2000)
  }

  const transactions = [
    { date: '2024-01-15', type: 'Deposit', amount: '+5,000 USDT', status: 'Completed' },
    { date: '2024-01-14', type: 'Referral Reward', amount: '+150 BRS', status: 'Completed' },
    { date: '2024-01-13', type: 'Withdrawal', amount: '-2,000 USDT', status: 'Completed' },
    { date: '2024-01-12', type: 'Send BRS', amount: '-500 BRS', status: 'Completed' },
    { date: '2024-01-11', type: 'Subscription', amount: '-12 USDT', status: 'Completed' },
  ]

  return (
    <section id="wallet-dashboard" className="relative py-20 px-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0919] via-[#1a1a2e] to-[#0B0919]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ffd700] opacity-5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00d4ff] opacity-5 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#ffd700] via-[#00d4ff] to-[#ffd700] bg-clip-text text-transparent">
            Bharos Wallet Dashboard Preview
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Experience the future of crypto wallet management with our intuitive dashboard
          </p>
        </div>

        {/* Dashboard Preview Container */}
        <div className="bg-[#16213e] rounded-3xl border border-[#00d4ff]/20 shadow-2xl overflow-hidden backdrop-blur-xl hover:shadow-[0_0_40px_rgba(0,212,255,0.3)] transition-all duration-500">
          
          {/* Dashboard Top Navigation */}
          <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-6 border-b border-[#00d4ff]/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ffd700] to-[#00d4ff] rounded-lg flex items-center justify-center shadow-lg shadow-[#ffd700]/30">
                  <Wallet className="w-6 h-6 text-[#0B0919]" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-[#ffd700] to-[#00d4ff] bg-clip-text text-transparent">
                  BHAROS Wallet
                </span>
              </div>

              <nav className="hidden md:flex items-center gap-6">
                <button className="text-[#00d4ff] font-semibold hover:text-[#ffd700] transition-colors">Dashboard</button>
                <button className="text-gray-400 hover:text-[#00d4ff] transition-colors">Exchange</button>
                <button className="text-gray-400 hover:text-[#00d4ff] transition-colors">Earn</button>
                <button className="text-gray-400 hover:text-[#00d4ff] transition-colors">Profile</button>
              </nav>

              <button className="px-6 py-2.5 bg-gradient-to-r from-[#ffd700] to-[#00d4ff] text-[#0B0919] font-bold rounded-lg hover:shadow-lg hover:shadow-[#00d4ff]/50 transition-all duration-300 hover:scale-105">
                Connect Wallet
              </button>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-8">
            
            {/* Wallet Cards Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              
              {/* BRS Wallet Card */}
              <div className="bg-gradient-to-br from-[#ffd700]/10 to-[#ffd700]/5 p-6 rounded-2xl border border-[#ffd700]/30 hover:border-[#ffd700] transition-all duration-300 group hover:shadow-lg hover:shadow-[#ffd700]/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#ffd700]/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">BRS Coin Wallet</p>
                      <p className="text-xs text-[#ffd700]">Mainnet</p>
                    </div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-[#ffd700]" />
                </div>
                
                <div className="mb-6">
                  <p className="text-3xl font-bold text-white mb-1">150,000 BRS</p>
                  <p className="text-sm text-gray-400">≈ $2,449,500 USD</p>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-2.5 bg-[#ffd700] text-[#0B0919] font-semibold rounded-lg hover:bg-[#ffed4e] transition-all hover:shadow-lg hover:shadow-[#ffd700]/30 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                  <button className="flex-1 py-2.5 bg-[#ffd700]/20 text-[#ffd700] font-semibold rounded-lg hover:bg-[#ffd700]/30 transition-all border border-[#ffd700]/50 flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Receive
                  </button>
                </div>
              </div>

              {/* USDT Wallet Card */}
              <div className="bg-gradient-to-br from-[#00d4ff]/10 to-[#00d4ff]/5 p-6 rounded-2xl border border-[#00d4ff]/30 hover:border-[#00d4ff] transition-all duration-300 group hover:shadow-lg hover:shadow-[#00d4ff]/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#00d4ff]/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl">💵</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">USDT Wallet</p>
                      <p className="text-xs text-[#00d4ff]">TRC20</p>
                    </div>
                  </div>
                  <Wallet className="w-5 h-5 text-[#00d4ff]" />
                </div>
                
                <div className="mb-6">
                  <p className="text-3xl font-bold text-white mb-1">250,000 USDT</p>
                  <p className="text-sm text-gray-400">≈ $250,000 USD</p>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-2.5 bg-[#00d4ff] text-[#0B0919] font-semibold rounded-lg hover:bg-[#00f0ff] transition-all hover:shadow-lg hover:shadow-[#00d4ff]/30 flex items-center justify-center gap-2">
                    <ArrowDownRight className="w-4 h-4" />
                    Deposit
                  </button>
                  <button className="flex-1 py-2.5 bg-[#00d4ff]/20 text-[#00d4ff] font-semibold rounded-lg hover:bg-[#00d4ff]/30 transition-all border border-[#00d4ff]/50 flex items-center justify-center gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <button className="p-4 bg-[#1a1a2e] rounded-xl border border-[#00d4ff]/20 hover:border-[#00d4ff] hover:bg-[#1a1a2e]/80 transition-all group">
                <ArrowDownRight className="w-6 h-6 text-[#00d4ff] mb-2 mx-auto group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold text-white">Deposit</p>
              </button>
              
              <button className="p-4 bg-[#1a1a2e] rounded-xl border border-[#00d4ff]/20 hover:border-[#00d4ff] hover:bg-[#1a1a2e]/80 transition-all group">
                <ArrowUpRight className="w-6 h-6 text-[#00d4ff] mb-2 mx-auto group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold text-white">Withdraw</p>
              </button>
              
              <button 
                onClick={handleCopyAddress}
                className="p-4 bg-[#1a1a2e] rounded-xl border border-[#00d4ff]/20 hover:border-[#00d4ff] hover:bg-[#1a1a2e]/80 transition-all group relative"
              >
                {copiedAddress ? (
                  <CheckCircle className="w-6 h-6 text-green-400 mb-2 mx-auto" />
                ) : (
                  <Copy className="w-6 h-6 text-[#00d4ff] mb-2 mx-auto group-hover:scale-110 transition-transform" />
                )}
                <p className="text-sm font-semibold text-white">{copiedAddress ? 'Copied!' : 'Copy Address'}</p>
              </button>
              
              <button 
                onClick={handleCopyReferral}
                className="p-4 bg-[#1a1a2e] rounded-xl border border-[#00d4ff]/20 hover:border-[#00d4ff] hover:bg-[#1a1a2e]/80 transition-all group"
              >
                {copiedReferral ? (
                  <CheckCircle className="w-6 h-6 text-green-400 mb-2 mx-auto" />
                ) : (
                  <Share2 className="w-6 h-6 text-[#00d4ff] mb-2 mx-auto group-hover:scale-110 transition-transform" />
                )}
                <p className="text-sm font-semibold text-white">{copiedReferral ? 'Copied!' : 'Share Link'}</p>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-[#ffd700]/10 to-transparent p-5 rounded-xl border border-[#ffd700]/20 hover:border-[#ffd700]/50 transition-all">
                <p className="text-sm text-gray-400 mb-1">Total Earned</p>
                <p className="text-2xl font-bold text-[#ffd700]">5,000 BRS</p>
              </div>
              
              <div className="bg-gradient-to-br from-[#00d4ff]/10 to-transparent p-5 rounded-xl border border-[#00d4ff]/20 hover:border-[#00d4ff]/50 transition-all">
                <p className="text-sm text-gray-400 mb-1">Referral Earnings</p>
                <p className="text-2xl font-bold text-[#00d4ff]">1,200 BRS</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/10 to-transparent p-5 rounded-xl border border-green-500/20 hover:border-green-500/50 transition-all">
                <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                <p className="text-2xl font-bold text-green-400">450</p>
              </div>
              
              <div className="bg-gradient-to-br from-[#ffd700]/10 to-transparent p-5 rounded-xl border border-[#ffd700]/20 hover:border-[#ffd700]/50 transition-all">
                <p className="text-sm text-gray-400 mb-1">Account Level</p>
                <p className="text-2xl font-bold text-[#ffd700]">Gold VIP</p>
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-[#1a1a2e] p-6 rounded-2xl border border-[#00d4ff]/20 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">BRS / USD Live Price Chart</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold text-[#ffd700]">$16.33</p>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-semibold rounded-lg flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      +12.5%
                    </span>
                  </div>
                </div>
                <div className="hidden md:flex gap-2">
                  <button className="px-4 py-2 bg-[#00d4ff]/20 text-[#00d4ff] rounded-lg text-sm font-semibold hover:bg-[#00d4ff]/30 transition-all">24H</button>
                  <button className="px-4 py-2 text-gray-400 rounded-lg text-sm font-semibold hover:bg-[#00d4ff]/20 hover:text-[#00d4ff] transition-all">7D</button>
                  <button className="px-4 py-2 text-gray-400 rounded-lg text-sm font-semibold hover:bg-[#00d4ff]/20 hover:text-[#00d4ff] transition-all">1M</button>
                </div>
              </div>
              
              {/* Simple Chart Visualization */}
              <div className="h-48 flex items-end gap-2">
                {[40, 65, 45, 80, 60, 90, 70, 95, 75, 85, 100, 90].map((height, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-gradient-to-t from-[#ffd700] to-[#00d4ff] rounded-t-lg hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-[#1a1a2e] p-6 rounded-2xl border border-[#00d4ff]/20">
              <h3 className="text-xl font-bold text-white mb-6">Recent Transactions</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#00d4ff]/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Transaction Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr 
                        key={i} 
                        className="border-b border-[#00d4ff]/10 hover:bg-[#00d4ff]/5 transition-colors"
                      >
                        <td className="py-4 px-4 text-sm text-gray-300">{tx.date}</td>
                        <td className="py-4 px-4 text-sm text-white font-medium">{tx.type}</td>
                        <td className={`py-4 px-4 text-sm font-semibold ${tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.amount}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-lg">
                            <CheckCircle className="w-3 h-3" />
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 max-w-3xl mx-auto px-4 py-4 bg-[#1a1a2e]/50 rounded-xl border border-[#00d4ff]/10">
            ⚠️ This dashboard is a preview of the Bharos Exchange platform interface. Full wallet and trading functionality will be available after the official launch.
          </p>
        </div>
      </div>
    </section>
  )
}

export default WalletDashboardPreview
