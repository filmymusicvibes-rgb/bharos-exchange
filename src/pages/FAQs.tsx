import { useState } from "react"
import { navigate } from "@/lib/router"
import { ArrowLeft, ChevronDown, Search, HelpCircle } from "lucide-react"

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  // General
  {
    category: "General",
    question: "What is Bharos Exchange?",
    answer: "Bharos Exchange is a next-generation blockchain-powered cryptocurrency platform designed to simplify digital finance. It offers a secure crypto exchange, staking rewards, community-driven governance, and a multi-level referral rewards system — all built on transparent smart contracts on the Binance Smart Chain (BSC)."
  },
  {
    category: "General",
    question: "What is BRS Coin?",
    answer: "BRS Coin is the native utility token of the Bharos ecosystem. It is a BEP-20 token on the Binance Smart Chain with a fixed total supply. BRS powers all transactions, membership plans, referral rewards, staking, and governance activities within the platform."
  },
  {
    category: "General",
    question: "Is Bharos Exchange a legitimate platform?",
    answer: "Yes. Bharos Exchange operates with full transparency. Our smart contracts are deployed on the public Binance Smart Chain and can be verified by anyone. All transactions are recorded on-chain, and our tokenomics, team information, and roadmap are publicly available. We follow strict security protocols to protect user funds and data."
  },
  {
    category: "General",
    question: "On which blockchain is BRS Coin built?",
    answer: "BRS Coin is built on the Binance Smart Chain (BSC) as a BEP-20 token. This ensures fast transactions, low gas fees, and compatibility with popular wallets like Trust Wallet and MetaMask."
  },

  // Account & Registration
  {
    category: "Account",
    question: "How do I create an account on Bharos Exchange?",
    answer: "Creating an account is simple. Click the 'Join Now' button on the homepage, fill in your basic details (name, email, phone number, and password), and optionally enter a referral code if you were invited by someone. Once registered, you'll receive a confirmation and can log into your dashboard immediately."
  },
  {
    category: "Account",
    question: "Do I need a referral code to register?",
    answer: "No, a referral code is optional during registration. However, joining through a referral link allows both you and the person who referred you to benefit from our referral rewards program once your membership is activated."
  },
  {
    category: "Account",
    question: "I forgot my password. How can I reset it?",
    answer: "If you've forgotten your password, click the 'Forgot Password' link on the login page. Enter your registered email address, and we'll send you a secure reset link. Follow the instructions in the email to set a new password. For additional help, contact our support team."
  },
  {
    category: "Account",
    question: "How do I secure my account?",
    answer: "We recommend using a strong, unique password that combines uppercase letters, lowercase letters, numbers, and special characters. Never share your login credentials with anyone. Enable all available security features and regularly check your transaction history for any unauthorized activity."
  },

  // Membership & Activation
  {
    category: "Membership",
    question: "What is membership activation and why is it required?",
    answer: "Membership activation is a one-time process that unlocks full platform access — including your personal dashboard, referral program participation, reward eligibility, and all trading features. Activation requires a minimum contribution of 12 USDT, which is used to allocate BRS Coins to your wallet at the current market rate."
  },
  {
    category: "Membership",
    question: "How do I activate my membership?",
    answer: "Go to your Dashboard and click 'Activate Membership'. You'll be shown a unique BRS wallet address. Send a minimum of 12 USDT (BEP-20) to that address. The system automatically detects your payment within 1–5 minutes. Once verified, your membership is instantly activated and BRS Coins are credited to your wallet."
  },
  {
    category: "Membership",
    question: "What happens if my payment isn't detected?",
    answer: "Our automated verification system checks the blockchain every 30 seconds. If your payment isn't detected within 5 minutes, the session will reset automatically. Make sure you're sending USDT on the BEP-20 (Binance Smart Chain) network and that the amount meets the minimum of 12 USDT. If issues persist, contact our support team with your transaction hash."
  },
  {
    category: "Membership",
    question: "Can I upgrade or increase my membership later?",
    answer: "Yes, you can increase your contribution at any time. Simply revisit the activation page and make an additional deposit. BRS Coins will be credited at the current rate. There is no upper limit — higher contributions mean more BRS Coins and greater potential rewards."
  },

  // Referral & Rewards
  {
    category: "Referral",
    question: "How does the referral program work?",
    answer: "Bharos Exchange offers a 12-level deep referral rewards system. When you invite someone using your unique referral link and they activate their membership, you earn a commission. As your network grows across 12 levels, you continue earning passive rewards from the activity of your entire team. Direct referral rewards, matrix bonuses, and trip achievement bonuses are all part of the system."
  },
  {
    category: "Referral",
    question: "Where can I find my referral link?",
    answer: "Your unique referral link is available in your Dashboard under the 'Referral' section. You can copy the link and share it via social media, messaging apps, or email. Every person who registers through your link is connected to your referral network."
  },
  {
    category: "Referral",
    question: "When are referral rewards distributed?",
    answer: "Direct referral rewards are credited when your referred member activates their membership. Matrix and level-based rewards are processed by the admin team and distributed periodically. You can track all your referral earnings in the 'Referral Earnings' section of your dashboard."
  },
  {
    category: "Referral",
    question: "Is there a limit to how many people I can refer?",
    answer: "There is no limit. You can refer as many people as you want. Each direct referral strengthens your network and increases your earning potential across all 12 levels."
  },

  // Wallet & Transactions
  {
    category: "Wallet",
    question: "How do I check my BRS Coin balance?",
    answer: "Log into your dashboard and navigate to the 'Wallet' section. You'll see your total BRS Coin balance, available balance, and a complete history of all deposits, withdrawals, transfers, and rewards credited to your account."
  },
  {
    category: "Wallet",
    question: "Can I transfer BRS Coins to other users?",
    answer: "Yes.You can transfer BRS Coins to any registered Bharos Exchange user directly from the 'Transfer BRS' page. Enter the recipient's User ID and the amount you wish to send. Transfers are instant and recorded on your transaction history."
  },
  {
    category: "Wallet",
    question: "How do I withdraw my earnings?",
    answer: "Navigate to the 'Withdraw' page, enter the amount you wish to withdraw, and provide your external wallet address (BEP-20 compatible). Withdrawal requests are processed by the admin team and typically completed within 24–48 hours. You can track the status under 'Withdraw History'."
  },
  {
    category: "Wallet",
    question: "Are there any transaction fees?",
    answer: "Bharos Exchange keeps fees minimal to maximize value for our community. Standard blockchain gas fees apply for on-chain transactions. Internal platform transfers between users have zero fees. Specific fee details for withdrawals are displayed at the time of the transaction."
  },

  // Security & Technical
  {
    category: "Security",
    question: "How does Bharos Exchange protect my funds?",
    answer: "We employ multiple security layers including encrypted data storage, secure smart contract architecture on the Binance Smart Chain, and regular security audits. User funds are stored in secure wallets with restricted admin access. All transactions are publicly verifiable on the blockchain."
  },
  {
    category: "Security",
    question: "Can I verify the BRS smart contract?",
    answer: "Absolutely. Our BRS token smart contract is deployed on the Binance Smart Chain and is fully visible on BscScan. You can verify the contract address, token supply, holder distribution, and all transactions in real-time using the BSC blockchain explorer."
  },
  {
    category: "Security",
    question: "What should I do if I notice suspicious activity?",
    answer: "If you notice any unauthorized transactions or suspicious activity on your account, immediately change your password and contact our support team via email at support@bharosexchange.com or through our Telegram community. We take every security concern seriously and will investigate promptly."
  },
]

const categories = ["All", "General", "Account", "Membership", "Referral", "Wallet", "Security"]

function FAQs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "All" || faq.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="relative min-h-screen bg-[#0B0919] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0B0919]/95 backdrop-blur-md border-b border-cyan-500/20 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg border border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-500/10 transition-all"
          >
            <ArrowLeft size={20} className="text-cyan-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-500 text-xs">Find answers to common questions</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 mb-6">
            <HelpCircle className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Got Questions?
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about Bharos Exchange, BRS Coin, membership, and our referral program.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-[#0B0919]/60 border border-cyan-500/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400/60 transition-colors"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpenIndex(null) }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                  : "bg-cyan-500/10 text-gray-400 hover:text-white border border-cyan-500/20 hover:border-cyan-400/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-3 mb-14">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No results found for "{searchQuery}"</p>
              <p className="text-sm mt-1">Try searching with different keywords</p>
            </div>
          ) : (
            filteredFaqs.map((faq, i) => (
              <div
                key={i}
                className={`border rounded-xl transition-all duration-300 ${
                  openIndex === i
                    ? "border-cyan-400/40 bg-gradient-to-br from-cyan-500/10 to-blue-600/5"
                    : "border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent hover:border-cyan-500/30"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-white pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-cyan-400 shrink-0 transition-transform duration-300 ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-5 pb-5">
                    <div className="h-px bg-cyan-500/20 mb-4" />
                    <p className="text-gray-400 leading-relaxed text-sm">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Still Need Help */}
        <div className="text-center bg-gradient-to-br from-cyan-500/10 to-blue-600/5 border border-cyan-500/20 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-2">Still Have Questions?</h3>
          <p className="text-gray-400 mb-6 text-sm">
            Can't find what you're looking for? Our support team is ready to assist you.
          </p>
          <button
            onClick={() => navigate("/support")}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02]"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}

export default FAQs
