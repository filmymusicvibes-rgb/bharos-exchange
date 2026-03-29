/**
 * BSC Blockchain — Direct RPC Transaction Verification
 * 
 * Uses BSC public RPC (Binance) — NO API key needed!
 * Verifies USDT (BEP20) transactions directly on blockchain.
 * Free forever, instant, never deprecated.
 */

// 🌐 BSC Public RPC Endpoints (Binance official)
const BSC_RPC_URLS = [
  "https://bsc-dataseed.binance.org",
  "https://bsc-dataseed1.binance.org",
  "https://bsc-dataseed2.binance.org"
]

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
 * Make a JSON-RPC call to BSC node
 * Tries multiple RPC endpoints for reliability
 */
async function rpcCall(method: string, params: any[]): Promise<any> {

  for (const rpcUrl of BSC_RPC_URLS) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: method,
          params: params,
          id: 1
        })
      })

      const data = await response.json()

      if (data.error) {
        console.warn(`RPC error from ${rpcUrl}:`, data.error.message)
        continue
      }

      return data.result

    } catch (err) {
      console.warn(`RPC failed for ${rpcUrl}:`, err)
      continue
    }
  }

  throw new Error("All BSC RPC endpoints failed")
}

/**
 * 🔗 Verify a USDT BEP20 transaction on BSC blockchain
 * Uses direct RPC — instant, free, no API key!
 */
export async function verifyTransaction(txHash: string): Promise<VerifyResult> {

  // 🔒 Validate TXID format
  if (!txHash || !txHash.startsWith("0x") || txHash.length !== 66) {
    return { verified: false, error: "Invalid TXID format. Must be 66 characters starting with 0x" }
  }

  try {

    // 📡 Get transaction receipt from BSC node
    const receipt = await rpcCall("eth_getTransactionReceipt", [txHash])

    if (!receipt) {
      return {
        verified: false,
        error: "Transaction not found. It may still be processing — wait 1-2 minutes and try again."
      }
    }

    // ✅ Check transaction status (0x1 = success)
    if (receipt.status !== "0x1") {
      return { verified: false, error: "Transaction failed on blockchain." }
    }

    // 🔍 Find USDT Transfer event in logs
    const transferLog = receipt.logs?.find((log: any) =>
      log.address?.toLowerCase() === USDT_CONTRACT &&
      log.topics?.[0] === TRANSFER_TOPIC
    )

    if (!transferLog) {
      return {
        verified: false,
        error: "No USDT (BEP20) transfer found in this transaction. Make sure you sent USDT on BNB Smart Chain."
      }
    }

    // 📊 Parse sender and receiver
    const fromAddress = "0x" + transferLog.topics[1].slice(26).toLowerCase()
    const toAddress = "0x" + transferLog.topics[2].slice(26).toLowerCase()

    // 💰 Parse amount (USDT has 18 decimals on BSC)
    const amountWei = BigInt(transferLog.data)
    const amountUsdt = Number(amountWei) / Math.pow(10, USDT_DECIMALS)

    // ✅ Check receiver is our wallet
    if (toAddress !== RECEIVING_WALLET) {
      return {
        verified: false,
        error: "USDT was sent to a different address. Please send to the correct deposit address."
      }
    }

    // ✅ Check amount >= 12 USDT
    if (amountUsdt < MIN_AMOUNT) {
      return {
        verified: false,
        error: `Amount too low: ${amountUsdt.toFixed(2)} USDT. Minimum required: ${MIN_AMOUNT} USDT.`
      }
    }

    // 🎉 ALL VERIFIED!
    return {
      verified: true,
      amount: amountUsdt,
      from: fromAddress,
      to: toAddress,
      txHash: txHash
    }

  } catch (err: any) {
    console.error("BSC verification error:", err)
    return {
      verified: false,
      error: "Network error. Please check your internet and try again."
    }
  }

}
