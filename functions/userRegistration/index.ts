import { createClient } from "@lumi.new/sdk"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

interface RegistrationRequest {
  email: string
  username: string
  password: string
  referral_code: string
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

    const lumi = createClient({ projectId, apiBaseUrl, authOrigin })

    const body: RegistrationRequest = await req.json()
    console.log(JSON.stringify({ stage: "request_body", data: { email: body.email, username: body.username, hasReferralCode: Boolean(body.referral_code) } }))

    // Validate required fields
    if (!body.email || !body.username || !body.password || !body.referral_code) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Check if referral code exists
    const { list: referrers } = await lumi.entities.users.list({
      filter: { referral_code: body.referral_code }
    })

    if (referrers.length === 0) {
      console.log(JSON.stringify({ stage: "validation_error", error: "Invalid referral code", code: body.referral_code }))
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Check if email or username already exists
    const { list: existingUsers } = await lumi.entities.users.list({
      filter: { $or: [{ email: body.email }, { username: body.username }] }
    })

    if (existingUsers.length > 0) {
      return new Response(JSON.stringify({ error: "Email or username already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    // Generate unique referral code
    const generateReferralCode = (): string => {
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      return `BRS${randomDigits}`
    }

    let newReferralCode = generateReferralCode()
    let codeExists = true

    // Ensure unique referral code
    while (codeExists) {
      const { list: existingCodes } = await lumi.entities.users.list({
        filter: { referral_code: newReferralCode }
      })
      if (existingCodes.length === 0) {
        codeExists = false
      } else {
        newReferralCode = generateReferralCode()
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password)

    // Check if this is the first user
    const allUsersCheck = await lumi.entities.users.list({ limit: 1 })
    const isFirstUser = !allUsersCheck.list || allUsersCheck.list.length === 0

    // Create user
    const now = new Date().toISOString()
    const newUser = await lumi.entities.users.create({
      email: body.email,
      username: body.username,
      password: hashedPassword,
      referral_code: newReferralCode,
      referred_by: body.referral_code,
      status: "pending",
      user_role: isFirstUser ? "ADMIN" : "USER",
      user_id: "",
      mobile_number: "",
      creator: "system",
      createdAt: now,
      updatedAt: now
    })

    // Generate BEP20 wallet address (simplified - in production use proper crypto library)
    const generateBEP20Address = (): string => {
      const chars = "0123456789abcdef"
      let address = "0x"
      for (let i = 0; i < 40; i++) {
        address += chars[Math.floor(Math.random() * chars.length)]
      }
      return address
    }

    // Create wallet for user
    const wallet = await lumi.entities.wallets.create({
      user_id: newUser._id,
      usdt_balance: 0,
      brs_balance: 0,
      bep20_wallet_address: generateBEP20Address(),
      creator: newUser._id,
      createdAt: now,
      updatedAt: now
    })

    console.log(JSON.stringify({ 
      stage: "success", 
      userId: newUser._id, 
      referralCode: newReferralCode,
      walletAddress: wallet.bep20_wallet_address
    }))

    return new Response(JSON.stringify({
      success: true,
      message: "Registration successful. Please deposit 12 USDT to activate your account.",
      data: {
        user_id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        referral_code: newReferralCode,
        wallet_address: wallet.bep20_wallet_address,
        status: "pending"
      }
    }), {
      status: 201,
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
