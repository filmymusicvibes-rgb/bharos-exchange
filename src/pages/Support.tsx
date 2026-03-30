import { useState } from "react"
import { navigate } from "@/lib/router"
import { ArrowLeft, Mail, MessageCircle, Shield, HelpCircle, Clock, Send, ChevronRight, Headphones } from "lucide-react"

function Support() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setName("")
    setEmail("")
    setSubject("")
    setMessage("")
    setTimeout(() => setSubmitted(false), 5000)
  }

  const supportCategories = [
    {
      icon: <Shield className="w-7 h-7" />,
      title: "Account & Security",
      description: "Login issues, password reset, two-factor authentication, and account verification.",
    },
    {
      icon: <MessageCircle className="w-7 h-7" />,
      title: "Transactions & Payments",
      description: "Deposit or withdrawal queries, payment status, transaction history, and fee details.",
    },
    {
      icon: <HelpCircle className="w-7 h-7" />,
      title: "Membership & Activation",
      description: "Membership plan details, activation process, upgrades, and membership benefits.",
    },
    {
      icon: <Clock className="w-7 h-7" />,
      title: "Referral & Rewards",
      description: "Referral link issues, commission tracking, reward distribution, and team structure.",
    },
  ]

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
              Support Center
            </h1>
            <p className="text-gray-500 text-xs">We're here to help</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero Section */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 mb-6">
            <Headphones className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              How Can We Help You?
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Our support team is available 24/7 to assist you. Browse our help categories below 
            or reach out to us directly through our contact channels.
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <a 
            href="mailto:support@bharosexchange.com"
            className="group flex items-center gap-4 p-5 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border border-cyan-500/20 rounded-2xl hover:border-cyan-400/50 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
              <Mail className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Email Support</h3>
              <p className="text-gray-400 text-sm">support@bharosexchange.com</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
          </a>

          <a 
            href="https://t.me/bharosexchange"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 p-5 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border border-cyan-500/20 rounded-2xl hover:border-cyan-400/50 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
              <Send className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Telegram Community</h3>
              <p className="text-gray-400 text-sm">@bharosexchange</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
          </a>
        </div>

        {/* Help Categories */}
        <div className="mb-14">
          <h3 className="text-2xl font-bold text-white mb-6">Help Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {supportCategories.map((cat, i) => (
              <div
                key={i}
                className="group p-6 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border border-cyan-500/20 rounded-2xl hover:border-cyan-400/50 transition-all duration-300"
              >
                <div className="text-cyan-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                  {cat.icon}
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{cat.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border border-cyan-500/20 rounded-2xl p-6 sm:p-8 mb-14">
          <h3 className="text-2xl font-bold text-white mb-2">Send Us a Message</h3>
          <p className="text-gray-400 mb-6 text-sm">Fill out the form below and our team will get back to you within 24 hours.</p>

          {submitted && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
              ✅ Thank you! Your message has been received. We'll respond within 24 hours.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Your full name"
                  className="w-full px-4 py-3 bg-[#0B0919]/60 border border-cyan-500/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400/60 transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-[#0B0919]/60 border border-cyan-500/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0B0919]/60 border border-cyan-500/20 rounded-xl text-white focus:outline-none focus:border-cyan-400/60 transition-colors appearance-none"
              >
                <option value="" className="bg-[#0B0919]">Select a topic</option>
                <option value="account" className="bg-[#0B0919]">Account & Security</option>
                <option value="transaction" className="bg-[#0B0919]">Transactions & Payments</option>
                <option value="membership" className="bg-[#0B0919]">Membership & Activation</option>
                <option value="referral" className="bg-[#0B0919]">Referral & Rewards</option>
                <option value="technical" className="bg-[#0B0919]">Technical Issue</option>
                <option value="other" className="bg-[#0B0919]">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Describe your issue or question in detail..."
                className="w-full px-4 py-3 bg-[#0B0919]/60 border border-cyan-500/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400/60 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02]"
            >
              Submit Request
            </button>
          </form>
        </div>

        {/* Response Time Info */}
        <div className="text-center pb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-sm text-cyan-400">
            <Clock className="w-4 h-4" />
            Average response time: Under 24 hours
          </div>
        </div>
      </div>
    </div>
  )
}

export default Support
