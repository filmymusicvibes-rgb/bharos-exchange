/**
 * BSCScan API — Blockchain Transaction Verification
 * 
 * Verifies USDT (BEP20) transactions on BSC mainnet.
 * Free API — no fees, no middleman, no KYC.
 * 
 * Two modes:
 * 1. Auto-detect: Polls for incoming USDT transfers matching a unique amount
 * 2. Manual verify: Verifies a specific TXID (fallback)
 */

// 🔑 BSCScan API Key (Etherscan API V2 — works for BSC + 60 chains)
const BSCSCAN_API_KEY: string = "87BKX1SYMDVD86CP49C8IU2FA9VQNFM8EQ"

// 🏦 Your receiving wallet address
const RECEIVING_WALLET = "0xCD72FfF7F22eC409FCAcED1A06AEC227da6C1A56".toLowerCase()

// 💰 USDT BEP20 Contract on BSC
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955".toLowerCase()

// 🔐 Transfer event signature (keccak256 of Transfer(address,address,uint256))
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

// 💵 Minimum USDT required
const MIN_AMOUNT = 12

// USDT on BSC has 18 decimals
const USDT_DECIMALS = 18

export interface VerifyResult {
  verified: boolean
  amount?: number
  from?: string
  to?: string
  txHash?: string
  error?: string
}

/**
 * 🔍 AUTO-DETECT: Poll for incoming USDT transfers of 12 USDT
 * Matches any recent unclaimed 12 USDT transfer to our wallet
 */
export async function detectPayment(
  minAmount: number,
  usedTxHashes: string[]
): Promise<VerifyResult> {

  try {

    // 📡 Get recent BEP20 token transfers TO our wallet
    const url = `https://api.etherscan.io/v2/api?chainid=56&module=account&action=tokentx&contractaddress=${USDT_CONTRACT}&address=${RECEIVING_WALLET}&page=1&offset=20&sort=desc&apikey=${BSCSCAN_API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== "1" || !data.result || !Array.isArray(data.result)) {
      return { verified: false, error: "Waiting for payment..." }
    }

    // 🔍 Find matching transaction (newest first)
    for (const tx of data.result) {

      // Only incoming transfers TO our wallet
      if (tx.to?.toLowerCase() !== RECEIVING_WALLET) continue

      // Must be USDT contract
      if (tx.contractAddress?.toLowerCase() !== USDT_CONTRACT) continue

      // Skip already used transactions
      if (usedTxHashes.includes(tx.hash?.toLowerCase())) continue

      // Parse amount
      const amountWei = BigInt(tx.value || "0")
      const amountUsdt = Number(amountWei) / Math.pow(10, USDT_DECIMALS)

      // Match: amount must be >= 12 USDT
      if (amountUsdt >= minAmount) {

        // ✅ MATCH FOUND!
        return {
          verified: true,
          amount: amountUsdt,
          from: tx.from?.toLowerCase(),
          to: tx.to?.toLowerCase(),
          txHash: tx.hash
        }
      }
    }

    // No match yet — keep polling
    return { verified: false, error: "Waiting for payment..." }

  } catch (err: any) {
    console.error("BSCScan detect error:", err)
    return { verified: false, error: "Network error. Retrying..." }
  }

}

/**
 * 🔗 MANUAL VERIFY: Verify a specific TXID (fallback mode)
 */
export async function verifyTransaction(txHash: string): Promise<VerifyResult> {

  if (!txHash || !txHash.startsWith("0x") || txHash.length < 10) {
    return { verified: false, error: "Invalid transaction hash format" }
  }

  try {

    const url = `https://api.etherscan.io/v2/api?chainid=56&module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${BSCSCAN_API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.error || !data.result) {
      return {
        verified: false,
        error: data.error?.message || "Transaction not found. Check TXID or wait for confirmation."
      }
    }

    const receipt = data.result

    if (receipt.status !== "0x1") {
      return { verified: false, error: "Transaction failed on blockchain" }
    }

    const transferLog = receipt.logs?.find((log: any) =>
      log.address?.toLowerCase() === USDT_CONTRACT &&
      log.topics?.[0] === TRANSFER_TOPIC
    )

    if (!transferLog) {
      return {
        verified: false,
        error: "No USDT transfer found in this transaction."
      }
    }

    const fromAddress = "0x" + transferLog.topics[1].slice(26).toLowerCase()
    const toAddress = "0x" + transferLog.topics[2].slice(26).toLowerCase()

    const amountWei = BigInt(transferLog.data)
    const amountUsdt = Number(amountWei) / Math.pow(10, USDT_DECIMALS)

    if (toAddress !== RECEIVING_WALLET) {
      return { verified: false, error: "USDT was sent to wrong address." }
    }

    if (amountUsdt < MIN_AMOUNT) {
      return { verified: false, error: `Amount too low: $${amountUsdt.toFixed(2)} USDT.` }
    }

    return {
      verified: true,
      amount: amountUsdt,
      from: fromAddress,
      to: toAddress,
      txHash: txHash
    }

  } catch (err: any) {
    console.error("BSCScan verification error:", err)
    return { verified: false, error: "Network error. Please try again." }
  }

}

/**
 * 🎲 Generate a unique payment amount for a user
 * Base amount (12) + unique decimal suffix (0.001 to 0.999)
 */
export function generateUniqueAmount(existingAmounts: number[]): number {
  
  let attempts = 0
  
  while (attempts < 100) {
    // Generate random suffix: 0.001 to 0.999
    const suffix = Math.floor(Math.random() * 999) + 1 // 1 to 999
    const amount = 12 + suffix / 1000 // 12.001 to 12.999
    const rounded = Math.round(amount * 1000) / 1000

    // Check it's not already in use
    if (!existingAmounts.includes(rounded)) {
      return rounded
    }

    attempts++
  }

  // Fallback: use timestamp-based suffix
  const fallback = 12 + (Date.now() % 999 + 1) / 1000
  return Math.round(fallback * 1000) / 1000

}

/**
 * Check if BSCScan API key is configured
 */
export function isApiKeyConfigured(): boolean {
  return BSCSCAN_API_KEY !== "YourApiKeyToken" && BSCSCAN_API_KEY.length > 5
}
