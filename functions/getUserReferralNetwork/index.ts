import { createClient } from "@lumi.new/sdk"

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

    // Parse user_id from request body
    const body = await req.json()
    const userId = body.user_id

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Get user's referral code
    const { list: users } = await lumi.entities.users.list({
      filter: { user_id: userId }
    })

    if (users.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

    const user = users[0]
    const referralCode = user.referral_code

    // Get all direct referrals (level 1)
    const { list: directReferrals } = await lumi.entities.users.list({
      filter: { referred_by: referralCode }
    })

    // Get all referral earnings for this user
    const { list: earnings } = await lumi.entities.referral_earnings.list({
      filter: { user_id: userId },
      sort: { createdAt: -1 }
    })

    // Calculate earnings by level
    const earningsByLevel: Record<number, number> = {}
    let totalEarnings = 0

    earnings.forEach((earning: any) => {
      if (!earningsByLevel[earning.level]) {
        earningsByLevel[earning.level] = 0
      }
      earningsByLevel[earning.level] += earning.amount
      totalEarnings += earning.amount
    })

    // Get team size and members by level (all downline members)
    const teamMembers: Set<string> = new Set()
    const membersByLevel: Record<number, number> = {}
    
    async function getDownline(referralCode: string, level: number = 1, maxLevel: number = 12) {
      if (level > maxLevel) return

      const { list: referrals } = await lumi.entities.users.list({
        filter: { referred_by: referralCode }
      })

      // Count members at this level
      if (!membersByLevel[level]) {
        membersByLevel[level] = 0
      }
      membersByLevel[level] += referrals.length

      for (const referral of referrals) {
        teamMembers.add(referral.user_id)
        await getDownline(referral.referral_code, level + 1, maxLevel)
      }
    }

    await getDownline(referralCode)

    console.log(JSON.stringify({ 
      stage: "success", 
      userId, 
      directReferrals: directReferrals.length,
      teamSize: teamMembers.size,
      totalEarnings 
    }))

    return new Response(JSON.stringify({
      success: true,
      data: {
        user_id: userId,
        referral_code: referralCode,
        direct_referrals: directReferrals.length,
        team_size: teamMembers.size,
        total_earnings: totalEarnings,
        earnings_by_level: earningsByLevel,
        recent_earnings: earnings.slice(0, 10),
        members_by_level: membersByLevel,
        level1Users: directReferrals.map((ref: any) => ({
          _id: ref.user_id,
          user_id: ref.user_id,
          referral_code: ref.referral_code,
          username: ref.username,
          email: ref.email,
          mobile_number: ref.mobile_number || '',
          status: ref.status,
          created_at: ref.created_at
        })),
        membersByLevel: membersByLevel
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
