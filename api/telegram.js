// Bharos Exchange Telegram Bot — Support + Token Earn System
// Webhook endpoint: https://bharosexchange.com/api/telegram
// Features: FAQ, Daily Check-in, Invite & Earn, Channel Join, Streak Bonus

let getFirestoreAdmin = null
let admin = null
let firebaseReady = false

try {
  const fbModule = await import('./_firebase.js')
  getFirestoreAdmin = fbModule.default
  const adminModule = await import('firebase-admin')
  admin = adminModule.default
  firebaseReady = true
} catch (err) {
  console.warn('Firebase Admin not available, earn features disabled:', err.message)
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '@bharosexchange'
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'BharosExchangeBot'

// ═══════════════════════════════════════════
// FAQ DATA (Keep existing)
// ═══════════════════════════════════════════
const FAQ_DATA = {
  activate: {
    text: "🔐 *How to Activate Your Account*\n\n" +
      "1️⃣ Register on bharosexchange.com\n" +
      "2️⃣ Click 'Activate Membership'\n" +
      "3️⃣ Send 12 USDT to the BEP20 address shown\n" +
      "4️⃣ Stay on the page — auto-verification in 5-30 min\n" +
      "5️⃣ Done! You'll receive 150 BRS coins 🎉\n\n" +
      "⚠️ *Important:* Do NOT close the page during verification!"
  },
  referral: {
    text: "💰 *USDT Referral System*\n\n" +
      "Share your referral link and earn USDT!\n\n" +
      "📊 *12-Level Commission:*\n" +
      "Level 1: $2.00\nLevel 2: $0.80\nLevel 3: $0.75\n" +
      "Level 4: $0.65\nLevel 5: $0.55\nLevel 6-11: $0.25-$0.50\n" +
      "Level 12: $1.00\n\n" +
      "🎁 *Bonus Rewards:*\n" +
      "• 10 Direct Referrals → $20 bonus\n" +
      "• 3+9+27 Matrix → $30 bonus\n\n" +
      "✈️ *FREE TRIP:* 4th Level 81 Active OR Total Team 100 Active Members!"
  },
  brs: {
    text: "🪙 *BRS Token Info*\n\n" +
      "• *Current Price:* $0.005\n" +
      "• *Network:* BSC Mainnet (BEP-20)\n" +
      "• *Total Supply:* 1.5 Billion BRS\n\n" +
      "📈 *Price Phases:*\n" +
      "Phase 1: $0.005 (Current)\nPhase 2: $0.01\nPhase 3: $0.05\n" +
      "Phase 4: $0.50\nPhase 5: $1.50 (Target)\n\n" +
      "🎁 *Earn BRS:*\n• Activation: 150 BRS\n• Bot Daily Check-in: 2 BRS\n• Invite Friends: 2 BRS each"
  },
  withdraw: {
    text: "💸 *How to Withdraw USDT*\n\n" +
      "1️⃣ Dashboard → Withdraw\n2️⃣ Set BEP20 wallet in Profile\n" +
      "3️⃣ Enter amount (min $5 USDT)\n4️⃣ Confirm withdrawal\n" +
      "5️⃣ Admin processes within 24 hours\n\n" +
      "⚠️ *Rules:* Min $5 | 1 per 24hr | BEP-20 only"
  },
  security: {
    text: "🔒 *Is Bharos Exchange Safe?*\n\n" +
      "✅ BRS token on BSC Mainnet — fully on-chain\n" +
      "✅ All transactions transparent on blockchain\n" +
      "✅ Smart contract verified\n✅ Secure wallet-to-wallet payments\n\n" +
      "🌐 bharosexchange.com\n📧 support@bharosexchange.com"
  }
}

// ═══════════════════════════════════════════
// DEFAULT BOT CONFIG (Firestore overrides)
// ═══════════════════════════════════════════
const DEFAULT_CONFIG = {
  botEarnEnabled: false,
  checkinReward: 2,
  inviteReward: 2,
  channelJoinReward: 5,
  streakBonusReward: 2,
  streakBonusDays: 7,
  dailyMaxEarn: 8,
  totalPoolSize: 75000000,
  totalDistributed: 0
}

// ═══════════════════════════════════════════
// HELPER: Send Telegram Message
// ═══════════════════════════════════════════
async function sendMessage(chatId, text, reply_markup = null) {
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: "Markdown",
    disable_web_page_preview: true
  }
  if (reply_markup) body.reply_markup = reply_markup

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

async function answerCallback(callbackId, text = '') {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId, text })
  })
}

// Check if user is member of channel
async function checkChannelMember(userId) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHANNEL_ID, user_id: userId })
    })
    const data = await res.json()
    if (data.ok) {
      const status = data.result.status
      return ['creator', 'administrator', 'member'].includes(status)
    }
    return false
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════
// HELPER: Date utilities
// ═══════════════════════════════════════════
function getTodayIST() {
  const now = new Date()
  // IST = UTC+5:30
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
  return ist.toISOString().split('T')[0] // "2026-04-09"
}

function getYesterdayIST() {
  const now = new Date()
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
  ist.setDate(ist.getDate() - 1)
  return ist.toISOString().split('T')[0]
}

// ═══════════════════════════════════════════
// FIRESTORE: Get/Create user earn profile
// ═══════════════════════════════════════════
async function getUserEarnProfile(db, telegramId) {
  const ref = db.collection('botEarnings').doc(String(telegramId))
  const doc = await ref.get()
  if (doc.exists) return { ref, data: doc.data() }
  return { ref, data: null }
}

async function getBotConfig(db) {
  const ref = db.collection('botConfig').doc('settings')
  const doc = await ref.get()
  if (doc.exists) return doc.data()
  // Create default config
  await ref.set(DEFAULT_CONFIG)
  return DEFAULT_CONFIG
}

// ═══════════════════════════════════════════
// HELPER: Get Team Multiplier based on direct referrals
// ═══════════════════════════════════════════
async function getTeamMultiplier(db, linkedUid) {
  if (!linkedUid) return { multiplier: 1, directCount: 0, label: '1x (No team)' }

  try {
    const userDoc = await db.collection('users').doc(linkedUid).get()
    if (!userDoc.exists) return { multiplier: 1, directCount: 0, label: '1x (Base)' }

    const userData = userDoc.data()

    // Must be activated to earn from bot
    if (userData.status !== 'active') {
      return { multiplier: 0, directCount: 0, label: '❌ Not Activated', notActive: true }
    }

    const myRefCode = userData.referralCode
    if (!myRefCode) return { multiplier: 1, directCount: 0, label: '1x (Base)' }

    // Count direct referrals (Level 1 active members)
    const directSnap = await db.collection('users')
      .where('referredBy', '==', myRefCode)
      .where('status', '==', 'active')
      .get()
    const directCount = directSnap.size

    // Multiplier tiers
    if (directCount >= 27) return { multiplier: 5, directCount, label: '5x 🏆 (27+ team)' }
    if (directCount >= 10) return { multiplier: 3, directCount, label: '3x 🔥 (10+ team)' }
    if (directCount >= 3)  return { multiplier: 2, directCount, label: '2x ⚡ (3+ team)' }
    return { multiplier: 1, directCount, label: '1x (Base)' }
  } catch (err) {
    console.warn('Team multiplier check failed:', err.message)
    return { multiplier: 1, directCount: 0, label: '1x (Base)' }
  }
}

// ═══════════════════════════════════════════
// EARN: Daily Check-in (with Team Multiplier)
// ═══════════════════════════════════════════
async function handleCheckin(db, chatId, telegramId, username, config) {
  const today = getTodayIST()
  const yesterday = getYesterdayIST()
  const { ref, data } = await getUserEarnProfile(db, telegramId)

  if (!data) {
    // First time user — create profile with base reward
    const baseReward = config.checkinReward
    await ref.set({
      telegramId: String(telegramId),
      username: username || '',
      linkedEmail: null,
      linkedUid: null,
      lastCheckin: today,
      currentStreak: 1,
      longestStreak: 1,
      totalCheckins: 1,
      inviteCount: 0,
      totalEarned: baseReward,
      dailyEarned: baseReward,
      lastResetDate: today,
      channelJoined: false,
      isBlocked: false,
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    // Update distributed count
    await db.collection('botConfig').doc('settings').update({
      totalDistributed: admin.firestore.FieldValue.increment(baseReward)
    })

    await sendMessage(chatId,
      "🎉 *Welcome to Bharos Earn!*\n\n" +
      `✅ First check-in done! +${baseReward} BRS earned!\n` +
      "🔥 Streak: Day 1\n\n" +
      "💡 *Tip:* Link your account & build your team for bigger rewards!\n" +
      "🚀 *Team Multiplier:*\n" +
      "• 3+ referrals → 2x earnings\n" +
      "• 10+ referrals → 3x earnings\n" +
      "• 27+ referrals → 5x earnings!\n\n" +
      `📧 Use /link your@email.com to connect your account.`,
      { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "menu" }]] }
    )
    return
  }

  // Check if already checked in today
  if (data.lastCheckin === today) {
    // Get multiplier info for display
    const teamInfo = await getTeamMultiplier(db, data.linkedUid)
    await sendMessage(chatId,
      "⏰ *Already checked in today!*\n\n" +
      `🔥 Current streak: ${data.currentStreak} days\n` +
      `💰 Today's earnings: ${data.dailyEarned} BRS\n` +
      `📊 Total earned: ${data.totalEarned} BRS\n` +
      `🚀 Team Boost: ${teamInfo.label}\n\n` +
      "Come back tomorrow for your next check-in! ⏳",
      { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "menu" }]] }
    )
    return
  }

  // 🚀 Get Team Multiplier
  const teamInfo = await getTeamMultiplier(db, data.linkedUid)

  // ❌ Not activated — show activation prompt
  if (teamInfo.notActive && data.linkedUid) {
    await sendMessage(chatId,
      "🔒 *Account Not Activated!*\n\n" +
      "You need to activate your Bharos Exchange account (12 USDT) to earn from bot!\n\n" +
      "🎁 *Activation Benefits:*\n" +
      "• Get 150 BRS instant reward\n" +
      "• Unlock bot daily earnings\n" +
      "• Earn USDT from referrals\n" +
      "• Team multiplier unlocked!\n\n" +
      "👉 Activate now at bharosexchange.com",
      { inline_keyboard: [
        [{ text: "🌐 Activate Now", url: "https://bharosexchange.com/activate" }],
        [{ text: "🔙 Main Menu", callback_data: "menu" }]
      ]}
    )
    return
  }

  // Check daily limit (multiplied cap)
  const dailyEarned = data.lastResetDate === today ? data.dailyEarned : 0
  const effectiveCap = config.dailyMaxEarn * teamInfo.multiplier
  if (dailyEarned >= effectiveCap) {
    await sendMessage(chatId,
      `🧢 *Daily limit reached!* (${effectiveCap} BRS/day with ${teamInfo.label})\n\nCome back tomorrow! 🌅`,
      { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "menu" }]] }
    )
    return
  }

  // Calculate streak
  const isConsecutive = data.lastCheckin === yesterday
  const newStreak = isConsecutive ? data.currentStreak + 1 : 1
  const longestStreak = Math.max(newStreak, data.longestStreak || 0)

  // Calculate reward with TEAM MULTIPLIER
  let baseReward = config.checkinReward
  let reward = baseReward * teamInfo.multiplier
  let bonusMsg = ''

  // Streak bonus (also multiplied!)
  if (newStreak > 0 && newStreak % config.streakBonusDays === 0) {
    const streakBonus = config.streakBonusReward * teamInfo.multiplier
    reward += streakBonus
    bonusMsg = `\n🎁 *STREAK BONUS!* +${streakBonus} BRS (${config.streakBonusDays}-day streak × ${teamInfo.label})!`
  }

  // Multiplier bonus message
  let multiplierMsg = ''
  if (teamInfo.multiplier > 1) {
    multiplierMsg = `\n🚀 *Team Boost:* ${baseReward} × ${teamInfo.multiplier} = ${reward} BRS (${teamInfo.directCount} direct referrals)`
  }

  // Update profile
  const newDailyEarned = (data.lastResetDate === today ? data.dailyEarned : 0) + reward
  await ref.update({
    lastCheckin: today,
    currentStreak: newStreak,
    longestStreak: longestStreak,
    totalCheckins: admin.firestore.FieldValue.increment(1),
    totalEarned: admin.firestore.FieldValue.increment(reward),
    dailyEarned: newDailyEarned,
    lastResetDate: today,
    teamMultiplier: teamInfo.multiplier,
    teamDirectCount: teamInfo.directCount
  })

  // Credit to linked account if exists
  if (data.linkedUid) {
    await creditBRSToAccount(db, data.linkedUid, reward)
  }

  // Update distributed count
  await db.collection('botConfig').doc('settings').update({
    totalDistributed: admin.firestore.FieldValue.increment(reward)
  })

  const streakEmoji = newStreak >= 7 ? '🔥🔥🔥' : newStreak >= 3 ? '🔥🔥' : '🔥'

  // Build upgrade message
  let upgradeMsg = ''
  if (teamInfo.multiplier < 5) {
    const nextTier = teamInfo.multiplier === 1 ? { need: 3, multi: '2x' } :
                     teamInfo.multiplier === 2 ? { need: 10, multi: '3x' } :
                     { need: 27, multi: '5x' }
    upgradeMsg = `\n\n📈 *Next level:* Get ${nextTier.need} direct referrals → ${nextTier.multi} earnings!`
  } else {
    upgradeMsg = '\n\n🏆 *MAX MULTIPLIER ACHIEVED!* You\'re a top earner!'
  }

  await sendMessage(chatId,
    `✅ *Daily Check-in Done!*\n\n` +
    `💰 +${reward} BRS earned!${multiplierMsg}${bonusMsg}\n` +
    `${streakEmoji} Streak: ${newStreak} days${!isConsecutive && newStreak === 1 ? ' (reset)' : ''}\n` +
    `📊 Total earned: ${(data.totalEarned || 0) + reward} BRS\n` +
    `🚀 Team Boost: ${teamInfo.label}` +
    upgradeMsg + '\n\n' +
    (data.linkedUid ? '✅ BRS credited to your Bharos Exchange account!' :
      '⚠️ Link your account: /link your@email.com'),
    { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "menu" }]] }
  )
}

// ═══════════════════════════════════════════
// EARN: Channel Join Check
// ═══════════════════════════════════════════
async function handleChannelJoin(db, chatId, telegramId, config) {
  const { ref, data } = await getUserEarnProfile(db, telegramId)

  if (!data) {
    await sendMessage(chatId, "❗ Please do /checkin first to create your earn profile!")
    return
  }

  if (data.channelJoined) {
    await sendMessage(chatId,
      "✅ *Already claimed!* You've already received the channel join reward.\n" +
      `📊 Total earned: ${data.totalEarned} BRS`,
      { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "menu" }]] }
    )
    return
  }

  // Verify channel membership
  const isMember = await checkChannelMember(telegramId)

  if (!isMember) {
    await sendMessage(chatId,
      `📢 *Join our Telegram Channel first!*\n\n` +
      `👉 Join: ${TELEGRAM_CHANNEL_ID}\n\n` +
      `After joining, click the button below to claim your ${config.channelJoinReward} BRS reward!`,
      { inline_keyboard: [
        [{ text: `📢 Join Channel`, url: `https://t.me/${TELEGRAM_CHANNEL_ID.replace('@', '')}` }],
        [{ text: `✅ I Joined — Claim ${config.channelJoinReward} BRS`, callback_data: "verify_channel" }],
        [{ text: "🔙 Main Menu", callback_data: "menu" }]
      ]}
    )
    return
  }

  // Verified! Credit reward
  const today = getTodayIST()
  const newDailyEarned = (data.lastResetDate === today ? data.dailyEarned : 0) + config.channelJoinReward

  await ref.update({
    channelJoined: true,
    totalEarned: admin.firestore.FieldValue.increment(config.channelJoinReward),
    dailyEarned: newDailyEarned,
    lastResetDate: today
  })

  if (data.linkedUid) {
    await creditBRSToAccount(db, data.linkedUid, config.channelJoinReward)
  }

  await db.collection('botConfig').doc('settings').update({
    totalDistributed: admin.firestore.FieldValue.increment(config.channelJoinReward)
  })

  await sendMessage(chatId,
    `🎉 *Channel Join Verified!*\n\n` +
    `💰 +${config.channelJoinReward} BRS earned!\n` +
    `📊 Total earned: ${(data.totalEarned || 0) + config.channelJoinReward} BRS\n\n` +
    `Thank you for joining our community! 🙏`,
    { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "menu" }]] }
  )
}

// ═══════════════════════════════════════════
// EARN: Invite Friends
// ═══════════════════════════════════════════
async function handleInviteCommand(db, chatId, telegramId, config) {
  const { data } = await getUserEarnProfile(db, telegramId)

  if (!data) {
    await sendMessage(chatId, "❗ Please do /checkin first to create your earn profile!")
    return
  }

  const inviteLink = `https://t.me/${BOT_USERNAME}?start=invite_${telegramId}`

  await sendMessage(chatId,
    `👥 *Invite Friends — Earn ${config.inviteReward} BRS each!*\n\n` +
    `Share your invite link:\n` +
    `\`${inviteLink}\`\n\n` +
    `📊 *Your Stats:*\n` +
    `• Friends invited: ${data.inviteCount || 0}\n` +
    `• BRS from invites: ${(data.inviteCount || 0) * config.inviteReward}\n\n` +
    `✅ You earn ${config.inviteReward} BRS when your friend does their first /checkin!\n` +
    `⚠️ Friend must be a NEW user of this bot.`,
    { inline_keyboard: [
      [{ text: "📤 Share Invite Link", url: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('🚀 Join Bharos Exchange Bot and earn BRS tokens daily! Free crypto rewards!')}` }],
      [{ text: "🔙 Main Menu", callback_data: "menu" }]
    ]}
  )
}

async function processInviteReward(db, inviterId, config) {
  const inviterRef = db.collection('botEarnings').doc(String(inviterId))
  const inviterDoc = await inviterRef.get()

  if (!inviterDoc.exists) return

  const inviterData = inviterDoc.data()
  if (inviterData.isBlocked) return

  const today = getTodayIST()
  const dailyEarned = (inviterData.lastResetDate === today ? inviterData.dailyEarned : 0)

  if (dailyEarned >= config.dailyMaxEarn) return // Daily limit

  await inviterRef.update({
    inviteCount: admin.firestore.FieldValue.increment(1),
    totalEarned: admin.firestore.FieldValue.increment(config.inviteReward),
    dailyEarned: (inviterData.lastResetDate === today ? inviterData.dailyEarned : 0) + config.inviteReward,
    lastResetDate: today
  })

  if (inviterData.linkedUid) {
    await creditBRSToAccount(db, inviterData.linkedUid, config.inviteReward)
  }

  await db.collection('botConfig').doc('settings').update({
    totalDistributed: admin.firestore.FieldValue.increment(config.inviteReward)
  })

  // Notify inviter
  await sendMessage(inviterData.telegramId,
    `🎉 *Friend Joined!*\n\n` +
    `💰 +${config.inviteReward} BRS earned from invite!\n` +
    `👥 Total invites: ${(inviterData.inviteCount || 0) + 1}\n` +
    `📊 Total earned: ${(inviterData.totalEarned || 0) + config.inviteReward} BRS`
  )
}

// ═══════════════════════════════════════════
// EARN: Balance & Profile
// ═══════════════════════════════════════════
async function handleBalance(db, chatId, telegramId) {
  const { data } = await getUserEarnProfile(db, telegramId)

  if (!data) {
    await sendMessage(chatId,
      "❗ *No earn profile found.*\n\nDo /checkin to start earning BRS tokens!",
      { inline_keyboard: [[{ text: "✅ Start Check-in", callback_data: "do_checkin" }]] }
    )
    return
  }

  // Get team multiplier info
  const teamInfo = await getTeamMultiplier(db, data.linkedUid)

  const streakEmoji = data.currentStreak >= 7 ? '🔥🔥🔥' : data.currentStreak >= 3 ? '🔥🔥' : '🔥'
  const linkedStatus = data.linkedEmail
    ? `✅ Linked: ${data.linkedEmail}`
    : '⚠️ Not linked — use /link your@email.com'

  // Build upgrade hint
  let upgradeHint = ''
  if (teamInfo.multiplier < 5) {
    const nextTier = teamInfo.multiplier === 1 ? { need: 3, multi: '2x' } :
                     teamInfo.multiplier === 2 ? { need: 10, multi: '3x' } :
                     { need: 27, multi: '5x' }
    upgradeHint = `\n📈 *Next:* ${nextTier.need} referrals → ${nextTier.multi} earnings!`
  } else {
    upgradeHint = '\n🏆 *MAX MULTIPLIER!* You\'re a top earner!'
  }

  await sendMessage(chatId,
    `📊 *Your Earn Dashboard*\n\n` +
    `💰 *Total BRS Earned:* ${data.totalEarned || 0} BRS\n` +
    `📅 *Today's Earnings:* ${data.lastResetDate === getTodayIST() ? data.dailyEarned : 0} BRS\n\n` +
    `🚀 *Team Boost:* ${teamInfo.label}\n` +
    `👥 *Direct Referrals:* ${teamInfo.directCount}${upgradeHint}\n\n` +
    `${streakEmoji} *Streak:* ${data.currentStreak || 0} days\n` +
    `🏆 *Longest Streak:* ${data.longestStreak || 0} days\n` +
    `📋 *Total Check-ins:* ${data.totalCheckins || 0}\n` +
    `👥 *Friends Invited:* ${data.inviteCount || 0}\n` +
    `📢 *Channel Joined:* ${data.channelJoined ? '✅ Yes' : '❌ No'}\n\n` +
    `🔗 *Account:* ${linkedStatus}`,
    { inline_keyboard: [
      [{ text: "✅ Check-in Now", callback_data: "do_checkin" }],
      [{ text: "👥 Invite Friends", callback_data: "do_invite" }],
      [{ text: "🔙 Main Menu", callback_data: "menu" }]
    ]}
  )
}

// ═══════════════════════════════════════════
// EARN: Link Account
// ═══════════════════════════════════════════
async function handleLink(db, chatId, telegramId, email) {
  if (!email || !email.includes('@') || !email.includes('.')) {
    await sendMessage(chatId,
      "❗ *Invalid email format!*\n\n" +
      "Usage: `/link your@email.com`\n\n" +
      "Use the same email registered on bharosexchange.com",
      { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "menu" }]] }
    )
    return
  }

  const { ref, data } = await getUserEarnProfile(db, telegramId)

  if (!data) {
    await sendMessage(chatId, "❗ Please do /checkin first to create your earn profile!")
    return
  }

  // Find user by email in Firestore users collection
  const usersSnap = await db.collection('users')
    .where('email', '==', email.toLowerCase().trim())
    .limit(1)
    .get()

  if (usersSnap.empty) {
    await sendMessage(chatId,
      "❌ *Email not found!*\n\n" +
      `No Bharos Exchange account found for: ${email}\n\n` +
      "Make sure you've registered at bharosexchange.com first!",
      { inline_keyboard: [[{ text: "🌐 Register Now", url: "https://bharosexchange.com" }], [{ text: "🔙 Main Menu", callback_data: "menu" }]] }
    )
    return
  }

  const userDoc = usersSnap.docs[0]
  const uid = userDoc.id

  // Check if this email is already linked to another Telegram account
  const existingLink = await db.collection('botEarnings')
    .where('linkedEmail', '==', email.toLowerCase().trim())
    .limit(1)
    .get()

  if (!existingLink.empty && existingLink.docs[0].id !== String(telegramId)) {
    await sendMessage(chatId,
      "❌ *Email already linked!*\n\n" +
      "This email is already linked to another Telegram account.\n" +
      "Each email can only be linked once.",
      { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "menu" }]] }
    )
    return
  }

  // Link account
  await ref.update({
    linkedEmail: email.toLowerCase().trim(),
    linkedUid: uid
  })

  // Credit any un-credited earnings to the account
  if (data.totalEarned > 0 && !data.linkedUid) {
    await creditBRSToAccount(db, uid, data.totalEarned)
  }

  await sendMessage(chatId,
    `✅ *Account Linked Successfully!*\n\n` +
    `📧 Email: ${email}\n` +
    `💰 Total BRS: ${data.totalEarned || 0} BRS credited to your account!\n\n` +
    `From now on, all bot earnings will be instantly credited to your Bharos Exchange dashboard! 🚀`,
    { inline_keyboard: [[{ text: "📊 Check Balance", callback_data: "do_balance" }], [{ text: "🔙 Main Menu", callback_data: "menu" }]] }
  )
}

// ═══════════════════════════════════════════
// HELPER: Credit BRS to Bharos Exchange account
// ═══════════════════════════════════════════
async function creditBRSToAccount(db, uid, amount) {
  try {
    const userRef = db.collection('users').doc(uid)
    await userRef.update({
      brsBalance: admin.firestore.FieldValue.increment(amount)
    })
  } catch (err) {
    console.error('Failed to credit BRS:', err)
  }
}

// ═══════════════════════════════════════════
// KEYBOARDS
// ═══════════════════════════════════════════
const WELCOME_MESSAGE = "👋 *Welcome to Bharos Exchange!*\n\n" +
  "I'm your 24/7 assistant. Choose below:\n\n" +
  "💰 *Earn BRS tokens* — daily check-in & invite friends!\n" +
  "❓ *Get help* — activation, referrals, withdrawals\n\n" +
  "🌐 bharosexchange.com"

const MAIN_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "✅ Daily Check-in", callback_data: "do_checkin" },
      { text: "📊 My Balance", callback_data: "do_balance" }
    ],
    [
      { text: "👥 Invite Friends", callback_data: "do_invite" },
      { text: "📢 Join Channel", callback_data: "do_channel" }
    ],
    [
      { text: "💎 How to Earn (Details)", callback_data: "earn_info" }
    ],
    [
      { text: "━━━━  ❓ Help  ━━━━", callback_data: "help_menu" }
    ],
    [
      { text: "🔐 Activate", callback_data: "faq_activate" },
      { text: "💰 Referral", callback_data: "faq_referral" }
    ],
    [
      { text: "🪙 BRS Info", callback_data: "faq_brs" },
      { text: "💸 Withdraw", callback_data: "faq_withdraw" }
    ],
    [
      { text: "🔒 Security", callback_data: "faq_security" },
      { text: "📧 Support", callback_data: "contact" }
    ],
    [
      { text: "🌐 Open Website", url: "https://bharosexchange.com" }
    ]
  ]
}

// ═══════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'Bharos Exchange Bot Active — v2.0' })
  }

  try {
    let db = null
    let config = { ...DEFAULT_CONFIG, botEarnEnabled: false }

    if (firebaseReady && getFirestoreAdmin) {
      try {
        db = getFirestoreAdmin()
        config = await getBotConfig(db)
      } catch (dbErr) {
        console.warn('Firestore init failed, using defaults:', dbErr.message)
        db = null
      }
    }

    const { message, callback_query } = req.body

    // ─── Handle Callback (Button Clicks) ───
    if (callback_query) {
      const chatId = callback_query.message.chat.id
      const telegramId = callback_query.from.id
      const username = callback_query.from.username || callback_query.from.first_name || ''
      const data = callback_query.data
      await answerCallback(callback_query.id)

      // Earn features
      if (data === 'do_checkin') {
        if (!config.botEarnEnabled) {
          await sendMessage(chatId, "🔒 *Bot Earn feature is coming soon!*\n\nStay tuned — launching in a few days! 🚀",
            { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "menu" }]] }
          )
        } else {
          await handleCheckin(db, chatId, telegramId, username, config)
        }
      } else if (data === 'do_balance') {
        if (!config.botEarnEnabled) {
          await sendMessage(chatId, "🔒 *Bot Earn feature is coming soon!*\nStay tuned! 🚀",
            { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "menu" }]] }
          )
        } else {
          await handleBalance(db, chatId, telegramId)
        }
      } else if (data === 'do_invite') {
        if (!config.botEarnEnabled) {
          await sendMessage(chatId, "🔒 *Invite feature is coming soon!* 🚀",
            { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "menu" }]] }
          )
        } else {
          await handleInviteCommand(db, chatId, telegramId, config)
        }
      } else if (data === 'do_channel' || data === 'verify_channel') {
        if (!config.botEarnEnabled) {
          await sendMessage(chatId, "🔒 *Channel reward is coming soon!* 🚀",
            { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "menu" }]] }
          )
        } else {
          await handleChannelJoin(db, chatId, telegramId, config)
        }
      } else if (data === 'earn_info') {
        // Show full earning structure with team multiplier
        const earnDetails = 
          `💎 *How to Earn BRS — Full Guide*\n\n` +
          `━━━ 🤖 *Bot Earnings* ━━━\n\n` +
          `✅ *Daily Check-in:* ${config.checkinReward} BRS base\n` +
          `👥 *Invite Friend:* ${config.inviteReward} BRS each\n` +
          `📢 *Join Channel:* ${config.channelJoinReward} BRS (one-time)\n` +
          `🔥 *${config.streakBonusDays}-Day Streak:* +${config.streakBonusReward} BRS bonus\n\n` +
          `━━━ 🚀 *Team Multiplier* ━━━\n` +
          `_(Active referrals on Bharos Exchange)_\n\n` +
          `📊 0-2 Referrals → *1x* Base\n` +
          `⚡ 3+ Referrals → *2x* Earnings!\n` +
          `🔥 10+ Referrals → *3x* Earnings!!\n` +
          `🏆 27+ Referrals → *5x* Earnings!!!\n\n` +
          `━━━ 💰 *Max Earnings Table* ━━━\n\n` +
          `🟢 *1x Team:* ~${config.dailyMaxEarn} BRS/day | ~${config.dailyMaxEarn * 30}/month\n` +
          `⚡ *2x Team:* ~${config.dailyMaxEarn * 2} BRS/day | ~${config.dailyMaxEarn * 2 * 30}/month\n` +
          `🔥 *3x Team:* ~${config.dailyMaxEarn * 3} BRS/day | ~${config.dailyMaxEarn * 3 * 30}/month\n` +
          `🏆 *5x Team:* ~${config.dailyMaxEarn * 5} BRS/day | ~${config.dailyMaxEarn * 5 * 30}/month\n\n` +
          `━━━ 📌 *How It Works* ━━━\n\n` +
          `1️⃣ Do /checkin daily → earn BRS\n` +
          `2️⃣ /link your@email.com → connect account\n` +
          `3️⃣ Build team on bharosexchange.com\n` +
          `4️⃣ More active referrals = higher multiplier!\n\n` +
          `⚠️ Only *activated* members (12 USDT paid) count as referrals\n` +
          `🧢 Daily cap: ${config.dailyMaxEarn} BRS × your multiplier`

        await sendMessage(chatId, earnDetails,
          { inline_keyboard: [
            [{ text: "✅ Start Earning", callback_data: "do_checkin" }],
            [{ text: "📊 My Balance", callback_data: "do_balance" }],
            [{ text: "🔙 Main Menu", callback_data: "menu" }]
          ]}
        )
      } else if (data === 'help_menu') {
        await sendMessage(chatId, "❓ *Help — Choose a topic:*", {
          inline_keyboard: [
            [{ text: "🔐 Activate", callback_data: "faq_activate" }, { text: "💰 Referral", callback_data: "faq_referral" }],
            [{ text: "🪙 BRS Info", callback_data: "faq_brs" }, { text: "💸 Withdraw", callback_data: "faq_withdraw" }],
            [{ text: "🔒 Security", callback_data: "faq_security" }, { text: "📧 Support", callback_data: "contact" }],
            [{ text: "🔙 Main Menu", callback_data: "menu" }]
          ]
        })
      }
      // Existing FAQ callbacks
      else if (data === 'contact') {
        await sendMessage(chatId,
          "📞 *Contact Bharos Exchange*\n\n" +
          "📧 Email: support@bharosexchange.com\n" +
          "💬 WhatsApp: [Join Channel](https://whatsapp.com/channel/0029Vb8HgtnHltYGfWReeJ0j)\n" +
          "🌐 Website: [bharosexchange.com](https://bharosexchange.com)\n\n" +
          "Our team will respond within 24 hours! 🙏",
          { inline_keyboard: [[{ text: "🔙 Back to Menu", callback_data: "menu" }]] }
        )
      } else if (data === 'menu') {
        await sendMessage(chatId, WELCOME_MESSAGE, MAIN_KEYBOARD)
      } else if (data.startsWith('faq_')) {
        const key = data.replace('faq_', '')
        const faq = FAQ_DATA[key]
        if (faq) {
          await sendMessage(chatId, faq.text,
            { inline_keyboard: [[{ text: "🔙 Back to Menu", callback_data: "menu" }]] }
          )
        }
      }
      return res.status(200).json({ ok: true })
    }

    // ─── Handle Text Messages ───
    if (message && message.text) {
      const chatId = message.chat.id
      const telegramId = message.from.id
      const username = message.from.username || message.from.first_name || ''
      const text = message.text.trim()
      const textLower = text.toLowerCase()

      // Command: /start (with optional invite parameter)
      if (textLower.startsWith('/start')) {
        const parts = text.split(' ')
        if (parts.length > 1 && parts[1].startsWith('invite_')) {
          // Invited by someone
          const inviterId = parts[1].replace('invite_', '')
          if (inviterId !== String(telegramId) && config.botEarnEnabled) {
            // Store inviter reference for when this user does first checkin
            const { data: existingUser } = await getUserEarnProfile(db, telegramId)
            if (!existingUser) {
              // New user — store inviter reference temporarily
              await db.collection('botEarnings').doc(String(telegramId)).set({
                telegramId: String(telegramId),
                username: username,
                invitedBy: inviterId,
                linkedEmail: null,
                linkedUid: null,
                lastCheckin: null,
                currentStreak: 0,
                longestStreak: 0,
                totalCheckins: 0,
                inviteCount: 0,
                totalEarned: 0,
                dailyEarned: 0,
                lastResetDate: getTodayIST(),
                channelJoined: false,
                isBlocked: false,
                joinedAt: admin.firestore.FieldValue.serverTimestamp()
              })

              // Process invite reward for inviter
              await processInviteReward(db, inviterId, config)
            }
          }
        }
        await sendMessage(chatId, WELCOME_MESSAGE, MAIN_KEYBOARD)
      }
      // Command: /checkin
      else if (textLower === '/checkin') {
        if (!config.botEarnEnabled) {
          await sendMessage(chatId, "🔒 *Bot Earn is coming soon!* Stay tuned! 🚀",
            { inline_keyboard: [[{ text: "🔙 Menu", callback_data: "menu" }]] }
          )
        } else {
          await handleCheckin(db, chatId, telegramId, username, config)
        }
      }
      // Command: /balance
      else if (textLower === '/balance' || textLower === '/earn') {
        if (!config.botEarnEnabled) {
          await sendMessage(chatId, "🔒 *Coming soon!* 🚀",
            { inline_keyboard: [[{ text: "🔙 Menu", callback_data: "menu" }]] }
          )
        } else {
          await handleBalance(db, chatId, telegramId)
        }
      }
      // Command: /invite
      else if (textLower === '/invite') {
        if (!config.botEarnEnabled) {
          await sendMessage(chatId, "🔒 *Coming soon!* 🚀",
            { inline_keyboard: [[{ text: "🔙 Menu", callback_data: "menu" }]] }
          )
        } else {
          await handleInviteCommand(db, chatId, telegramId, config)
        }
      }
      // Command: /link <email>
      else if (textLower.startsWith('/link')) {
        const email = text.split(' ')[1]
        if (!config.botEarnEnabled) {
          await sendMessage(chatId, "🔒 *Coming soon!* 🚀",
            { inline_keyboard: [[{ text: "🔙 Menu", callback_data: "menu" }]] }
          )
        } else {
          await handleLink(db, chatId, telegramId, email)
        }
      }
      // Command: /streak
      else if (textLower === '/streak') {
        await handleBalance(db, chatId, telegramId)
      }
      // Regular text — keyword matching
      else if (textLower === '/menu' || textLower === '/help') {
        await sendMessage(chatId, WELCOME_MESSAGE, MAIN_KEYBOARD)
      } else if (textLower.includes('activate') || textLower.includes('account')) {
        await sendMessage(chatId, FAQ_DATA.activate.text,
          { inline_keyboard: [[{ text: "🔙 Menu", callback_data: "menu" }]] })
      } else if (textLower.includes('referral') || textLower.includes('commission')) {
        await sendMessage(chatId, FAQ_DATA.referral.text,
          { inline_keyboard: [[{ text: "🔙 Menu", callback_data: "menu" }]] })
      } else if (textLower.includes('brs') || textLower.includes('token') || textLower.includes('price')) {
        await sendMessage(chatId, FAQ_DATA.brs.text,
          { inline_keyboard: [[{ text: "🔙 Menu", callback_data: "menu" }]] })
      } else if (textLower.includes('withdraw') || textLower.includes('usdt')) {
        await sendMessage(chatId, FAQ_DATA.withdraw.text,
          { inline_keyboard: [[{ text: "🔙 Menu", callback_data: "menu" }]] })
      } else if (textLower.includes('safe') || textLower.includes('secure') || textLower.includes('scam')) {
        await sendMessage(chatId, FAQ_DATA.security.text,
          { inline_keyboard: [[{ text: "🔙 Menu", callback_data: "menu" }]] })
      } else {
        await sendMessage(chatId,
          "🤔 I didn't understand that.\n\n" +
          "Try these commands:\n" +
          "• /checkin — Daily BRS reward\n" +
          "• /balance — Check your earnings\n" +
          "• /invite — Invite friends\n" +
          "• /link email — Link your account\n" +
          "• /help — Main menu",
          MAIN_KEYBOARD
        )
      }
    }

    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Bot error:', err)
    res.status(200).json({ ok: true })
  }
}
