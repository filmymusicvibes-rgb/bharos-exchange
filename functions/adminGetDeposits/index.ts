import { createClient } from "@lumi.new/sdk"

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

    // Build filter
    const filter: any = {}
    if (status) {
      filter.status = status
    }

    console.log(JSON.stringify({ stage: "query", filter, limit, skip }))

    // Get deposits
    const { list: deposits, total } = await lumi.entities.deposits.list({
      filter,
      sort: { createdAt: -1 },
      limit,
      skip
    })

    // Enrich deposits with user information
    const depositsWithUsers = await Promise.all(
      deposits.map(async (deposit: any) => {
        const { list: users } = await lumi.entities.users.list({
          filter: { _id: deposit.user_id }
        })

        return {
          deposit_id: deposit._id,
          user_id: deposit.user_id,
          user_email: users[0]?.email || "Unknown",
          user_username: users[0]?.username || "Unknown",
          amount: deposit.amount,
          transaction_hash: deposit.transaction_hash,
          screenshot_url: deposit.screenshot_url,
          status: deposit.status,
          admin_notes: deposit.admin_notes,
          createdAt: deposit.createdAt,
          updatedAt: deposit.updatedAt
        }
      })
    )

    console.log(JSON.stringify({ stage: "success", totalDeposits: total, returnedDeposits: deposits.length }))

    return new Response(JSON.stringify({
      success: true,
      data: {
        deposits: depositsWithUsers,
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
