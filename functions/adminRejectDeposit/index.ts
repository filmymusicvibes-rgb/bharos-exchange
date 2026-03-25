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

    const { deposit_id } = await req.json()

    if (!deposit_id) {
      return new Response(JSON.stringify({ error: "Missing deposit_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Update deposit status
    await lumi.entities.deposits.update(deposit_id, { status: "rejected" })

    return new Response(JSON.stringify({
      success: true,
      message: "Deposit rejected successfully"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Failed to reject deposit:", error)
    return new Response(JSON.stringify({ error: "Failed to reject deposit" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
