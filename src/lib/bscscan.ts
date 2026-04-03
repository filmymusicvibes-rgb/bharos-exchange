/**
 * BSC Blockchain — Direct RPC Transaction Verification
 * 
 * Uses dRPC (free, no API key) + Binance RPC for BSC.
 * Auto-detect + manual verify — both work!
 * Free forever, no API key needed.
 */

// 🌐 RPC Endpoints (dRPC for logs, Binance for receipts)
const DRPC_URL = "https://bsc.drpc.org"
const BSC_RPC_URLS = [
  "https://bsc-dataseed.binance.org",
  "https://bsc-dataseed1.binance.org",
  "https://bsc-dataseed2.binance.org"
]

// 🏦 Your receiving wallet address
const RECEIVING_WALLET = "0xcd72fff7f22ec409fcaced1a06aec227da6c1a56"

// Padded for topics filter (32 bytes)
const RECEIVING_WALLET_PADDED = "0x000000000000000000000000cd72fff7f22ec409fcaced1a06aec227da6c1a56"

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
 * Make a JSON-RPC call
 */
async function rpcCall(url: string, method: string, params: any[]): Promise<any> {
  const response = await fetch(url, {
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
    throw new Error(data.error.message || "RPC error")
  }

  return data.result
}

/**
 * Make RPC call with fallback URLs
 */
async function rpcCallWithFallback(method: string, params: any[]): Promise<any> {
  for (const url of [DRPC_URL, ...BSC_RPC_URLS]) {
    try {
      return await rpcCall(url, method, params)
    } catch (err) {
      console.warn(`RPC failed for ${url}:`, err)
      continue
    }
  }
  throw new Error("All RPC endpoints failed")
}

/**
 * 🔍 AUTO-DETECT: Scan recent blocks for USDT transfers TO our wallet
 * Uses dRPC eth_getLogs — FREE, no API key!
 */
export async function detectPayment(
  minAmount: number,
  usedTxHashes: string[]
): Promise<VerifyResult> {

  try {

    // 📡 Get current block number
    const latestBlockHex = await rpcCall(DRPC_URL, "eth_blockNumber", [])
    const latestBlock = parseInt(latestBlockHex, 16)

    // Scan last 600 blocks (~30 minutes on BSC, 3 sec/block)
    const fromBlock = "0x" + (latestBlock - 600).toString(16)
    const toBlock = "0x" + latestBlock.toString(16)

    // 📡 Get USDT Transfer logs TO our wallet
    const logs = await rpcCall(DRPC_URL, "eth_getLogs", [{
      fromBlock: fromBlock,
      toBlock: toBlock,
      address: USDT_CONTRACT,
      topics: [
        TRANSFER_TOPIC,
        null, // from: any sender
        RECEIVING_WALLET_PADDED // to: our wallet
      ]
    }])

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return { verified: false, error: "Waiting for payment..." }
    }

    // 🔍 Find matching transfer (newest first — logs are in block order)
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i]

      const txHash = log.transactionHash?.toLowerCase()

      // Skip already used
      if (usedTxHashes.includes(txHash)) continue

      // Parse amount
      const amountWei = BigInt(log.data)
      const amountUsdt = Math.floor(Number(amountWei) / Math.pow(10, USDT_DECIMALS) * 100) / 100

      // Check amount >= 12 USDT
      if (amountUsdt >= minAmount) {

        // Parse sender
        const fromAddress = "0x" + log.topics[1].slice(26).toLowerCase()

        return {
          verified: true,
          amount: amountUsdt,
          from: fromAddress,
          to: RECEIVING_WALLET,
          txHash: txHash
        }
      }

      // ⚠️ Payment found but below minimum — inform user
      if (amountUsdt > 0 && amountUsdt < minAmount) {
        return {
          verified: false,
          error: `Payment detected: ${amountUsdt} USDT — Minimum required: ${minAmount} USDT. Please send at least ${minAmount} USDT.`
        }
      }
    }

    return { verified: false, error: "Waiting for payment..." }

  } catch (err: any) {
    console.error("Auto-detect error:", err)
    return { verified: false, error: "Scanning... please wait." }
  }

}

/**
 * 🔗 MANUAL VERIFY: Verify a specific TXID (fallback mode)
 */
export async function verifyTransaction(txHash: string): Promise<VerifyResult> {

  if (!txHash || !txHash.startsWith("0x") || txHash.length !== 66) {
    return { verified: false, error: "Invalid TXID format. Must be 66 characters starting with 0x" }
  }

  try {

    const receipt = await rpcCallWithFallback("eth_getTransactionReceipt", [txHash])

    if (!receipt) {
      return {
        verified: false,
        error: "Transaction not found. Wait 1-2 minutes and try again."
      }
    }

    if (receipt.status !== "0x1") {
      return { verified: false, error: "Transaction failed on blockchain." }
    }

    const transferLog = receipt.logs?.find((log: any) =>
      log.address?.toLowerCase() === USDT_CONTRACT &&
      log.topics?.[0] === TRANSFER_TOPIC
    )

    if (!transferLog) {
      return {
        verified: false,
        error: "No USDT (BEP20) transfer found. Make sure you sent USDT on BNB Smart Chain."
      }
    }

    const fromAddress = "0x" + transferLog.topics[1].slice(26).toLowerCase()
    const toAddress = "0x" + transferLog.topics[2].slice(26).toLowerCase()

    const amountWei = BigInt(transferLog.data)
    const amountUsdt = Math.floor(Number(amountWei) / Math.pow(10, USDT_DECIMALS) * 100) / 100

    if (toAddress !== RECEIVING_WALLET) {
      return { verified: false, error: "USDT was sent to wrong address." }
    }

    if (amountUsdt < MIN_AMOUNT) {
      return { verified: false, error: `Amount too low: ${amountUsdt.toFixed(2)} USDT. Minimum: ${MIN_AMOUNT} USDT.` }
    }

    return {
      verified: true,
      amount: amountUsdt,
      from: fromAddress,
      to: toAddress,
      txHash: txHash
    }

  } catch (err: any) {
    console.error("Verification error:", err)
    return { verified: false, error: "Network error. Please try again." }
  }

}
