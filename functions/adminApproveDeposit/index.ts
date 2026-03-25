import { createClient } from "@lumi.new/sdk"

interface ApprovalRequest {
  deposit_id: string
  admin_notes?: string
}

// Commission structure for 12 levels
const COMMISSION_STRUCTURE = [
  2,     // Level 1
  0.80,  // Level 2
  0.75,  // Level 3
  0.65,  // Level 4
  0.55,  // Level 5
  0.50,  // Level 6
  0.45,  // Level 7
  0.40,  // Level 8
  0.35,  // Level 9
  0.30,  // Level 10
  0.25,  // Level 11
  1.00   // Level 12
]

async function traverseReferralChain(lumi: any, userId: string, levels: number = 12): Promise<string[]> {
  const chain: string[] = []
  let currentUserId = userId

  for (let i = 0; i < levels; i++) {
    // Get current user
    const { list: users } = await lumi.entities.users.list({
      filter: { _id: currentUserId }
    })

    if (users.length === 0) break

    const user = users[0]

    // Find referrer by referral code
    if (user.referred_by && user.referred_by !== "SYSTEM") {
      const { list: referrers } = await lumi.entities.users.list({
        filter: { referral_code: user.referred_by }
      })

      if (referrers.length > 0) {
        chain.push(referrers[0]._id)
        currentUserId = referrers[0]._id
      } else {
        break
      }
    } else {
      break
    }
  }

  return chain
}

Deno.serve(async (req) => {
  console.log(JSON.stringify({ stage: "start", method: req.method, url: req.url }))

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const projectId = Deno.env.get("PROJECT_ID")
    const apiBaseUrl = Deno.env.get("API_BASE_URL")
    const authOrigin = Deno.env.get("AUTH_ORIGIN")

    const lumi = createClient({ projectId, apiBaseUrl, authOrigin })

    const body: ApprovalRequest = await req.json()
    console.log(JSON.stringify({ stage: "request_body", depositId: body.deposit_id }))

    // Get deposit details
    const { list: deposits } = await lumi.entities.deposits.list({
      filter: { _id: body.deposit_id }
    })

    if (deposits.length === 0) {
      return new Response(JSON.stringify({ error: "Deposit not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

    const deposit = deposits[0]

    if (deposit.status === "approved") {
      return new Response(JSON.stringify({ error: "Deposit already approved" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Update deposit status
    const now = new Date().toISOString()
    await lumi.entities.deposits.update(deposit._id, {
      status: "approved",
      admin_notes: body.admin_notes || "Approved",
      updatedAt: now
    })

    // Update user status to active
    await lumi.entities.users.update(deposit.user_id, {
      status: "active",
      updatedAt: now
    })

    // Credit 150 BRS tokens to user's wallet
    const { list: wallets } = await lumi.entities.wallets.list({
      filter: { user_id: deposit.user_id }
    })

    if (wallets.length > 0) {
      const wallet = wallets[0]
      await lumi.entities.wallets.update(wallet._id, {
        brs_balance: wallet.brs_balance + 150,
        updatedAt: now
      })
    }

    // Process referral commissions
    const referralChain = await traverseReferralChain(lumi, deposit.user_id, 12)
    console.log(JSON.stringify({ stage: "referral_chain", chain: referralChain, levels: referralChain.length }))

    const commissions: any[] = []

    for (let i = 0; i < referralChain.length && i < COMMISSION_STRUCTURE.length; i++) {
      const referrerId = referralChain[i]
      const commissionAmount = COMMISSION_STRUCTURE[i]
      const level = i + 1

      // Get referrer's wallet
      const { list: referrerWallets } = await lumi.entities.wallets.list({
        filter: { user_id: referrerId }
      })

      if (referrerWallets.length > 0) {
        const referrerWallet = referrerWallets[0]

        // Add commission to wallet
        await lumi.entities.wallets.update(referrerWallet._id, {
          usdt_balance: referrerWallet.usdt_balance + commissionAmount,
          updatedAt: now
        })

        // Record commission
        const earning = await lumi.entities.referral_earnings.create({
          user_id: referrerId,
          from_user: deposit.user_id,
          level,
          amount: commissionAmount,
          currency: "USDT",
          transaction_type: "activation",
          creator: "system",
          createdAt: now,
          updatedAt: now
        })

        commissions.push({
          level,
          referrer_id: referrerId,
          amount: commissionAmount,
          earning_id: earning._id
        })

        console.log(JSON.stringify({ 
          stage: "commission_distributed", 
          level, 
          referrerId, 
          amount: commissionAmount 
        }))
      }
    }

    console.log(JSON.stringify({ 
      stage: "success", 
      depositId: deposit._id, 
      userId: deposit.user_id,
      totalCommissions: commissions.length
    }))

    return new Response(JSON.stringify({
      success: true,
      message: "Deposit approved and account activated successfully.",
      data: {
        deposit_id: deposit._id,
        user_id: deposit.user_id,
        brs_credited: 150,
        commissions_distributed: commissions
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error(JSON.stringify({ stage: "error", message: error.message, stack: error.stack }))
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
