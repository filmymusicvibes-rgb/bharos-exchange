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

    // Parse user_id from query params
    const url = new URL(req.url)
    const userId = url.searchParams.get("user_id")

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Get user's wallet
    const { list: wallets } = await lumi.entities.wallets.list({
      filter: { user_id: userId }
    })

    if (wallets.length === 0) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

    const wallet = wallets[0]

    // Generate QR code URL for BEP20 address (using a QR code API service)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${wallet.bep20_wallet_address}`

    console.log(JSON.stringify({ 
      stage: "success", 
      userId, 
      walletId: wallet._id,
      bep20Address: wallet.bep20_wallet_address
    }))

    return new Response(JSON.stringify({
      success: true,
      data: {
        wallet_id: wallet._id,
        user_id: wallet.user_id,
        usdt_balance: wallet.usdt_balance,
        brs_balance: wallet.brs_balance,
        bep20_wallet_address: wallet.bep20_wallet_address,
        qr_code_url: qrCodeUrl,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt
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
