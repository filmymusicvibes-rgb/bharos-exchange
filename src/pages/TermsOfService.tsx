import { navigate } from "@/lib/router"
import { ArrowLeft, FileText } from "lucide-react"

function TermsOfService() {
  const lastUpdated = "March 30, 2026"

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
              Terms of Service
            </h1>
            <p className="text-gray-500 text-xs">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 mb-6">
            <FileText className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Terms of Service
            </span>
          </h2>
          <p className="text-gray-400">
            Please read these terms carefully before using Bharos Exchange.
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-sm text-cyan-400">
            <FileText className="w-4 h-4" />
            Effective Date: {lastUpdated}
          </div>
        </div>

        {/* Terms Content */}
        <div className="space-y-8 mb-14">

          <TermSection title="1. Introduction & Acceptance of Terms">
            <p>
              Welcome to Bharos Exchange ("Platform", "we", "us", or "our"). These Terms of Service ("Terms") govern your access to and use of the Bharos Exchange platform, including all associated services, features, and functionalities offered through our website and application.
            </p>
            <p>
              By registering an account, accessing, or using any part of the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must discontinue use of the Platform immediately.
            </p>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be communicated through the Platform, and continued use after modifications constitutes acceptance of the updated Terms.
            </p>
          </TermSection>

          <TermSection title="2. Eligibility">
            <p>To use Bharos Exchange, you must:</p>
            <ul>
              <li>Be at least 18 years of age or the legal age of majority in your jurisdiction.</li>
              <li>Have the legal capacity to enter into a binding agreement.</li>
              <li>Not be a resident of any jurisdiction where the use of cryptocurrency platforms is prohibited or restricted by law.</li>
              <li>Provide accurate and truthful information during registration and at all times while using the Platform.</li>
            </ul>
            <p>
              By using the Platform, you represent and warrant that you meet all eligibility requirements. Bharos Exchange reserves the right to refuse service, terminate accounts, or restrict access at our sole discretion.
            </p>
          </TermSection>

          <TermSection title="3. Account Registration & Security">
            <p>
              To access the full features of Bharos Exchange, you must create a user account by providing your name, email address, phone number, and a secure password. You may optionally provide a referral code during registration.
            </p>
            <p>You are solely responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials.</li>
              <li>All activities that occur under your account.</li>
              <li>Immediately notifying us of any unauthorized use or security breach.</li>
            </ul>
            <p>
              Bharos Exchange is not liable for any loss or damage arising from your failure to protect your account information. We strongly recommend using a strong, unique password and enabling all available security features.
            </p>
          </TermSection>

          <TermSection title="4. Membership & Activation">
            <p>
              Access to the Platform's full ecosystem — including trading features, wallet services, referral rewards, and staking — requires membership activation. Activation is completed by making a one-time minimum contribution of 12 USDT (BEP-20) to the designated wallet address provided during the activation process.
            </p>
            <p>
              Upon successful verification of your payment on the Binance Smart Chain, your membership is activated, and BRS Coins are allocated to your account at the prevailing market rate. Activation payments are non-refundable and represent your purchase of BRS Coins within the ecosystem.
            </p>
            <p>
              Members may increase their holdings at any time by making additional deposits. There is no upper limit on contributions.
            </p>
          </TermSection>

          <TermSection title="5. BRS Coin & Digital Assets">
            <p>
              BRS Coin is a BEP-20 utility token deployed on the Binance Smart Chain. It is the native digital asset of the Bharos ecosystem, used for internal transactions, membership, rewards, and governance.
            </p>
            <p>Important disclosures regarding BRS Coin:</p>
            <ul>
              <li>BRS Coin is a utility token and is not classified as a security, investment contract, or financial instrument.</li>
              <li>The value of BRS Coin may fluctuate based on market conditions, platform adoption, and other factors.</li>
              <li>Past performance is not indicative of future results. There is no guarantee of financial return.</li>
              <li>Bharos Exchange does not provide investment advice. Users should conduct their own research and consult financial advisors before participating.</li>
            </ul>
          </TermSection>

          <TermSection title="6. Referral Program">
            <p>
              Bharos Exchange operates a multi-level referral rewards program extending up to 12 levels deep. Registered and activated members may invite others using their unique referral link.
            </p>
            <p>Referral Program terms:</p>
            <ul>
              <li>Referral rewards are earned only when a referred user successfully activates their membership.</li>
              <li>Commission rates and bonus structures are determined by the Platform and may be updated from time to time.</li>
              <li>The Platform reserves the right to modify, suspend, or discontinue the referral program at any time with reasonable notice.</li>
              <li>Any manipulation, fraudulent referrals, or abuse of the referral system will result in immediate account suspension and forfeiture of rewards.</li>
              <li>Referral rewards are credited in BRS Coins and are subject to the Platform's withdrawal policies.</li>
            </ul>
          </TermSection>

          <TermSection title="7. Wallet, Transactions & Withdrawals">
            <p>
              The Platform provides an internal wallet for managing BRS Coin balances, including deposits, withdrawals, internal transfers, and reward credits.
            </p>
            <ul>
              <li>All transactions are recorded on the blockchain and within the Platform's internal ledger.</li>
              <li>Withdrawal requests are processed by the admin team and typically completed within 24–48 business hours.</li>
              <li>Withdrawals are subject to minimum thresholds and applicable network fees.</li>
              <li>The Platform reserves the right to delay or decline withdrawal requests if there is suspicion of fraud, money laundering, or violation of these Terms.</li>
              <li>Users are responsible for ensuring the accuracy of external wallet addresses. Transactions sent to incorrect addresses cannot be reversed or recovered.</li>
            </ul>
          </TermSection>

          <TermSection title="8. Prohibited Activities">
            <p>You agree NOT to engage in any of the following:</p>
            <ul>
              <li>Creating multiple accounts or providing false registration information.</li>
              <li>Manipulating the referral program through fake accounts or self-referrals.</li>
              <li>Attempting to exploit, hack, or interfere with the Platform's security, infrastructure, or smart contracts.</li>
              <li>Using the Platform for money laundering, terrorist financing, or any illegal purpose.</li>
              <li>Engaging in market manipulation, fraudulent transactions, or deceptive practices.</li>
              <li>Reverse-engineering, decompiling, or attempting to extract the source code of the Platform.</li>
              <li>Distributing malware, spam, or malicious content through the Platform.</li>
            </ul>
            <p>
              Violation of these rules may result in immediate account suspension, forfeiture of all balances and rewards, and potential legal action.
            </p>
          </TermSection>

          <TermSection title="9. Intellectual Property">
            <p>
              All content, materials, branding, logos, designs, code, and technology associated with Bharos Exchange are the exclusive intellectual property of Bharos Exchange and its licensors. This includes but is not limited to the Bharos name, BRS Coin branding, website design, smart contracts, and all documentation.
            </p>
            <p>
              You may not copy, reproduce, distribute, modify, or create derivative works from any Platform content without prior written consent from Bharos Exchange.
            </p>
          </TermSection>

          <TermSection title="10. Privacy & Data Protection">
            <p>
              Your privacy is important to us. By using the Platform, you consent to the collection, storage, and processing of your personal data as described in our Privacy Policy. We collect only the minimum information necessary to provide our services, and we implement robust security measures to protect your data.
            </p>
            <p>
              We do not sell, rent, or share your personal information with third parties for marketing purposes. Data may be disclosed only when required by law, to protect our rights, or to ensure platform security.
            </p>
          </TermSection>

          <TermSection title="11. Risk Disclosure">
            <p>
              Cryptocurrency trading and digital asset transactions involve significant risk. By using this Platform, you acknowledge and accept the following risks:
            </p>
            <ul>
              <li><strong>Market Risk:</strong> The value of BRS Coin and other digital assets can be highly volatile and may decrease significantly.</li>
              <li><strong>Regulatory Risk:</strong> Cryptocurrency regulations vary by jurisdiction and may change, potentially affecting your ability to use the Platform.</li>
              <li><strong>Technology Risk:</strong> Blockchain technology, while robust, is subject to potential bugs, network congestion, and unforeseen technical issues.</li>
              <li><strong>Loss Risk:</strong> You may lose some or all of your invested capital. Only participate with funds you can afford to lose.</li>
            </ul>
            <p>
              Bharos Exchange does not provide financial, investment, or legal advice. All decisions regarding the use of the Platform are made at your own discretion and risk.
            </p>
          </TermSection>

          <TermSection title="12. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, Bharos Exchange, its founders, team members, partners, and affiliates shall not be liable for:
            </p>
            <ul>
              <li>Any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</li>
              <li>Loss of profits, data, goodwill, or other intangible losses.</li>
              <li>Service interruptions, technical malfunctions, or unauthorized access to accounts.</li>
              <li>Actions of third parties, including but not limited to hackers, network validators, or external service providers.</li>
            </ul>
            <p>
              Our total aggregate liability shall not exceed the amount you have directly paid to the Platform in the 12 months preceding the claim.
            </p>
          </TermSection>

          <TermSection title="13. Termination">
            <p>
              We may suspend or terminate your account and access to the Platform at any time, with or without notice, for any reason including but not limited to:
            </p>
            <ul>
              <li>Violation of these Terms of Service.</li>
              <li>Suspected fraudulent, abusive, or illegal activity.</li>
              <li>Prolonged inactivity as defined by Platform policies.</li>
              <li>Requests from law enforcement or regulatory authorities.</li>
            </ul>
            <p>
              Upon termination, your right to use the Platform ceases immediately. Any remaining balances may be subject to a withdrawal process in accordance with Platform policies, provided no violations have occurred.
            </p>
          </TermSection>

          <TermSection title="14. Dispute Resolution">
            <p>
              Any disputes arising from or relating to these Terms or your use of the Platform shall first be attempted to be resolved through good-faith negotiation. If a resolution cannot be reached within 30 days, the dispute shall be submitted to binding arbitration in accordance with the applicable laws of the jurisdiction in which Bharos Exchange operates.
            </p>
            <p>
              You agree to waive any right to participate in a class action lawsuit or class-wide arbitration against Bharos Exchange.
            </p>
          </TermSection>

          <TermSection title="15. Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Bharos Exchange is incorporated, without regard to conflict of law principles. Any legal proceedings shall be conducted in the competent courts of that jurisdiction.
            </p>
          </TermSection>

          <TermSection title="16. Contact Information">
            <p>
              If you have any questions, concerns, or feedback regarding these Terms of Service, please contact us through the following channels:
            </p>
            <ul>
              <li><strong>Email:</strong> support@bharosexchange.com</li>
              <li><strong>Telegram:</strong> @bharosexchange</li>
              <li><strong>Support Page:</strong> Visit our <a href="/support" onClick={(e) => { e.preventDefault(); navigate("/support") }} className="text-cyan-400 hover:underline">Support Center</a></li>
            </ul>
          </TermSection>

        </div>

        {/* Bottom Banner */}
        <div className="text-center bg-gradient-to-br from-cyan-500/10 to-blue-600/5 border border-cyan-500/20 rounded-2xl p-8 mb-10">
          <p className="text-gray-400 text-sm mb-4">
            By using Bharos Exchange, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02]"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  )
}

function TermSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border border-cyan-500/20 rounded-2xl p-6 sm:p-8">
      <h3 className="text-xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        {title}
      </h3>
      <div className="space-y-3 text-gray-400 leading-relaxed text-sm [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-gray-300">
        {children}
      </div>
    </div>
  )
}

export default TermsOfService
