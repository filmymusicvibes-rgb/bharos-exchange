/**
 * BSCScan API — Blockchain Transaction Verification
 * 
 * Verifies USDT (BEP20) transactions on BSC mainnet.
 * Free API — no fees, no middleman, no KYC.
 * 
 * Two modes:
 * 1. Auto-detect: Polls for incoming USDT transfers >= 12 USDT
 * 2. Manual verify: Verifies a specific TXID (fallback)
 */

// 🔑 BSCScan API Key
const BSCSCAN_API_KEY: string = "87BKX1SYMDVD86CP49C8IU2FA9VQNFM8EQ"

// 🏦 Your receiving wallet address
const RECEIVING_WALLET = "0xcd72fff7f22ec409fcaced1a06aec227da6c1a56"

// 💰 USDT BEP20 Contract on BSC
const USDT_CONTRACT = "0x55d398326f99059ff775485246999027b3197955"

// 🔐 Transfer event signature
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
 * 🔍 AUTO-DETECT: Poll for incoming USDT transfers >= 12 USDT
 * Uses original BSCScan API (proven reliable for BSC)
 */
export async function detectPayment(
  minAmount: number,
  usedTxHashes: string[]
): Promise<VerifyResult> {

  try {

    // 📡 Original BSCScan API — most reliable for BSC
    const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${USDT_CONTRACT}&address=${RECEIVING_WALLET}&page=1&offset=20&sort=desc&apikey=${BSCSCAN_API_KEY}`

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
      const amountUsdt = Number(amountWei) / Math.pow(10, Number(tx.tokenDecimal || USDT_DECIMALS))

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

    // Original BSCScan API
    const url = `https://api.bscscan.com/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${BSCSCAN_API_KEY}`

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
 * Check if BSCScan API key is configured
 */
export function isApiKeyConfigured(): boolean {
  return BSCSCAN_API_KEY !== "YourApiKeyToken" && BSCSCAN_API_KEY.length > 5
}
