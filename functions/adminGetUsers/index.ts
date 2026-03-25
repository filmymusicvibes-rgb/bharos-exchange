import { createClient } from "@lumi.new/sdk"

interface QueryParams {
  status?: string
  limit?: number
  skip?: number
  search?: string
}

Deno.serve(async (req) => {
  console.log(JSON.stringify({ stage: "start", method: req.method, url: req.url }))

  if (req.method !== "GET") {
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

    // Parse query parameters
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const skip = parseInt(url.searchParams.get("skip") || "0")
    const search = url.searchParams.get("search")

    // Build filter
    const filter: any = {}
    if (status) {
      filter.status = status
    }
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { referral_code: { $regex: search, $options: "i" } }
      ]
    }

    console.log(JSON.stringify({ stage: "query", filter, limit, skip }))

    // Get users
    const { list: users, total } = await lumi.entities.users.list({
      filter,
      sort: { createdAt: -1 },
      limit,
      skip
    })

    // Get wallet data for each user
    const usersWithWallets = await Promise.all(
      users.map(async (user: any) => {
        const { list: wallets } = await lumi.entities.wallets.list({
          filter: { user_id: user._id }
        })

        return {
          user_id: user._id,
          email: user.email,
          username: user.username,
          referral_code: user.referral_code,
          referred_by: user.referred_by,
          status: user.status,
          createdAt: user.createdAt,
          wallet: wallets[0] || null
        }
      })
    )

    console.log(JSON.stringify({ stage: "success", totalUsers: total, returnedUsers: users.length }))

    return new Response(JSON.stringify({
      success: true,
      data: {
        users: usersWithWallets,
        total,
        limit,
        skip
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
