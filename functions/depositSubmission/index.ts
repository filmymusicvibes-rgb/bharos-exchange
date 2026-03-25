import { createClient } from "@lumi.new/sdk"

interface DepositRequest {
  amount: number
  transaction_hash: string
  screenshot_url: string
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
    const authorization = req.headers.get("Authorization") || ""

    const lumi = createClient({ projectId, apiBaseUrl, authOrigin, authorization })

    // Get authenticated user
    await lumi.auth.refreshUser()
    const currentUser = lumi.auth.user
    
    if (!currentUser) {
      return new Response(JSON.stringify({ error: "Unauthorized. Please log in." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const body: DepositRequest = await req.json()
    console.log(JSON.stringify({ 
      stage: "request_body", 
      data: { 
        user_id: currentUser.userId, 
        amount: body.amount, 
        transaction_hash: body.transaction_hash 
      } 
    }))

    // Validate required fields
    if (!body.amount || !body.transaction_hash || !body.screenshot_url) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Validate amount must be exactly 12 USDT
    if (body.amount !== 12) {
      return new Response(JSON.stringify({ error: "Membership activation requires exactly 12 USDT" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Verify user exists in database
    const { list: users } = await lumi.entities.users.list({
      filter: { user_id: currentUser.userId }
    })

    console.log(JSON.stringify({ 
      stage: "user_lookup", 
      user_id: currentUser.userId, 
      found: users.length > 0 
    }))

    if (users.length === 0) {
      return new Response(JSON.stringify({ 
        status: "error",
        error: "User account not found. Please complete registration first.",
        message: "User account not found. Please complete registration first." 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

    const dbUser = users[0]

    // Check if transaction hash already exists
    const { list: existingDeposits } = await lumi.entities.deposits.list({
      filter: { transaction_hash: body.transaction_hash }
    })

    if (existingDeposits.length > 0) {
      return new Response(JSON.stringify({ error: "Transaction hash already submitted" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Create deposit record
    const now = new Date().toISOString()
    const deposit = await lumi.entities.deposits.create({
      user_id: currentUser.userId,
      amount: body.amount,
      transaction_hash: body.transaction_hash,
      screenshot_url: body.screenshot_url,
      status: "pending",
      admin_notes: "",
      creator: currentUser.userId,
      createdAt: now,
      updatedAt: now
    })

    console.log(JSON.stringify({ 
      stage: "success", 
      depositId: deposit._id, 
      status: "pending" 
    }))

    return new Response(JSON.stringify({
      status: "success",
      success: true,
      message: "Deposit submitted successfully and waiting for admin approval.",
      data: {
        deposit_id: deposit._id,
        user_id: deposit.user_id,
        amount: deposit.amount,
        status: deposit.status,
        createdAt: deposit.createdAt
      }
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error(JSON.stringify({ stage: "error", message: error.message, stack: error.stack }))
    return new Response(JSON.stringify({ 
      status: "error",
      error: error.message || "Internal server error",
      message: error.message || "Internal server error" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
