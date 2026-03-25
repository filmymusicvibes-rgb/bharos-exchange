import { createClient } from "@lumi.new/sdk"

Deno.serve(async (req: Request) => {
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
    const authorization = req.headers.get("Authorization")

    const lumi = createClient({ projectId, apiBaseUrl, authOrigin, authorization })

    // Get current user
    const user = await lumi.auth.refreshUser()
    if (!user || user.userRole !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Unauthorized: Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      })
    }

    const { user_id, token, amount } = await req.json()

    if (!user_id || !token || amount === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Find wallet
    const walletRes = await lumi.entities.wallets.list({
      filter: { user_id },
      limit: 1
    })

    if (walletRes.list.length === 0) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

    const wallet = walletRes.list[0]
    const updateData: any = {}

    if (token === "USDT") {
      updateData.usdt_balance = amount
    } else if (token === "BRS") {
      updateData.brs_balance = amount
    } else {
      return new Response(JSON.stringify({ error: "Invalid token type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    await lumi.entities.wallets.update(wallet._id, updateData)

    return new Response(JSON.stringify({
      success: true,
      message: `${token} balance updated successfully`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Failed to adjust wallet:", error)
    return new Response(JSON.stringify({ error: "Failed to adjust wallet balance" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
