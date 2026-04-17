// Vercel Serverless Function — Notify Admin via Telegram on Withdrawal Request
// Endpoint: /api/notify-admin

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID // Admin's personal Telegram chat ID

export default async function handler(req, res) {
  // Allow GET for health check
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'Notify Admin API Active' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type, userId, amount, address } = req.body

    if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
      console.warn('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID env vars')
      return res.status(200).json({ ok: false, message: 'Telegram not configured' })
    }

    let message = ''

    if (type === 'withdrawal') {
      message = 
        `🔔 *NEW WITHDRAWAL REQUEST!*\n\n` +
        `👤 *User:* ${userId}\n` +
        `💰 *Amount:* ${amount} USDT\n` +
        `📋 *Wallet:* \`${address}\`\n` +
        `⏰ *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\n` +
        `⚡ *Action Required:* Open Admin Panel to approve/reject.\n` +
        `🌐 bharosexchange.com/admin`
    } else if (type === 'brs_withdrawal') {
      message =
        `🔔 *NEW BRS WITHDRAWAL REQUEST!*\n\n` +
        `👤 *User:* ${userId}\n` +
        `🪙 *Amount:* ${amount} BRS\n` +
        `📋 *Wallet:* \`${address}\`\n` +
        `⏰ *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\n` +
        `⚡ *Action Required:* Open Admin Panel to approve/reject.`
    } else {
      message = 
        `🔔 *ADMIN ALERT*\n\n` +
        `${req.body.message || 'New activity detected'}\n` +
        `⏰ ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
    }

    // Send Telegram message to admin
    const telegramRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      })
    })

    const telegramData = await telegramRes.json()
    
    return res.status(200).json({ ok: telegramData.ok })
  } catch (err) {
    console.error('Notify admin error:', err)
    return res.status(200).json({ ok: false, error: err.message })
  }
}
