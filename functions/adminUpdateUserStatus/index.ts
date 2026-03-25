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

    const { user_id, status } = await req.json()

    if (!user_id || !status) {
      return new Response(JSON.stringify({ error: "Missing user_id or status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Update user status
    await lumi.entities.users.update(user_id, { status })

    return new Response(JSON.stringify({
      success: true,
      message: `User status updated to ${status}`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Failed to update user status:", error)
    return new Response(JSON.stringify({ error: "Failed to update user status" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
