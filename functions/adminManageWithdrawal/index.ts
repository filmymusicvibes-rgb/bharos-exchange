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

    const { withdrawal_id, action } = await req.json()

    if (!withdrawal_id || !action || !["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const status = action === "approve" ? "approved" : "rejected"
    await lumi.entities.withdrawals.update(withdrawal_id, { status })

    return new Response(JSON.stringify({
      success: true,
      message: `Withdrawal ${status} successfully`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Failed to manage withdrawal:", error)
    return new Response(JSON.stringify({ error: "Failed to process withdrawal" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
