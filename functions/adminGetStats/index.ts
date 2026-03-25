import { createClient } from "@lumi.new/sdk"

Deno.serve(async (req: Request) => {
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

    // Fetch statistics
    const [usersRes, walletsRes, depositsRes, withdrawalsRes] = await Promise.all([
      lumi.entities.users.list({ limit: 1000 }),
      lumi.entities.wallets.list({ limit: 1000 }),
      lumi.entities.deposits.list({ limit: 1000 }),
      lumi.entities.withdrawals.list({ limit: 1000 })
    ])

    const totalUsers = usersRes.list.length
    const activeMembers = usersRes.list.filter((u: any) => u.status === "active").length
    const pendingDeposits = depositsRes.list.filter((d: any) => d.status === "pending").length
    const totalBRSDistributed = walletsRes.list.reduce((sum: number, w: any) => sum + (w.brs_balance || 0), 0)
    const pendingWithdrawals = withdrawalsRes.list.filter((w: any) => w.status === "pending").length

    return new Response(JSON.stringify({
      success: true,
      data: {
        totalUsers,
        activeMembers,
        pendingDeposits,
        totalBRSDistributed,
        pendingWithdrawals
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Failed to fetch admin stats:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch statistics" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
