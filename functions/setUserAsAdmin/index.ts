import { createClient } from '@lumi.new/sdk'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const projectId = Deno.env.get('PROJECT_ID')
    const apiBaseUrl = Deno.env.get('API_BASE_URL')
    const authOrigin = Deno.env.get('AUTH_ORIGIN')
    const lumi = createClient({ projectId, apiBaseUrl, authOrigin })

    const { email } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 })
    }

    // Find user by email
    const users = await lumi.entities.users.list({
      filter: { email },
      limit: 1
    })

    if (!users.list || users.list.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
    }

    const user = users.list[0]

    // Update user role to ADMIN
    await lumi.entities.users.update(user._id, {
      user_role: 'ADMIN',
      updatedAt: new Date().toISOString()
    })

    // Also update Lumi platform user role
    if (user.user_id) {
      await lumi.auth.updateUserRole(user.user_id, 'ADMIN')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${email} has been set as ADMIN`,
        user_id: user._id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error setting admin:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to set user as admin', details: error.message }),
      { status: 500 }
    )
  }
})
