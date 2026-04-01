import AsyncStorage from '@react-native-async-storage/async-storage'
import { NotificationTemplates } from './notifications'

const PRICE_ALERTS_KEY = 'bharos_price_alerts'
const PRICE_HISTORY_KEY = 'bharos_price_history'

export interface PriceAlert {
  id: string
  targetPrice: number
  direction: 'above' | 'below'
  triggered: boolean
  createdAt: number
}

// BRS Price constants
export const BRS_PRICE = 0.0055
export const BRS_24H_CHANGE = '+2.55%'
export const BRS_24H_HIGH = 0.0070
export const BRS_24H_LOW = 0.0046
export const BRS_MARKET_CAP = 5500000 // $5.5M
export const BRS_VOLUME_24H = 1250000 // $1.25M
export const BRS_CIRCULATING_SUPPLY = 1000000000 // 1B tokens
export const BRS_TOTAL_SUPPLY = 10000000000 // 10B tokens

// Get current BRS price (simulated — replace with real API later)
export function getCurrentPrice(): number {
  // Slight variation for realism
  const variance = (Math.random() - 0.5) * 0.0002
  return BRS_PRICE + variance
}

// Format price display
export function formatPrice(price: number, decimals?: number): string {
  if (price < 0.01) return `$${price.toFixed(decimals || 4)}`
  if (price < 1) return `$${price.toFixed(decimals || 4)}`
  if (price < 1000) return `$${price.toFixed(decimals || 2)}`
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Format BRS amount with proper USD conversion
export function formatBrsToUsd(brsAmount: number, price?: number): string {
  const p = price || BRS_PRICE
  const usd = brsAmount * p
  if (usd < 0.01) return `$${usd.toFixed(6)}`
  if (usd < 1) return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(2)}`
}

// Price alerts management
export async function getPriceAlerts(): Promise<PriceAlert[]> {
  try {
    const data = await AsyncStorage.getItem(PRICE_ALERTS_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

export async function addPriceAlert(targetPrice: number, direction: 'above' | 'below'): Promise<PriceAlert> {
  const alerts = await getPriceAlerts()
  const alert: PriceAlert = {
    id: Date.now().toString(),
    targetPrice,
    direction,
    triggered: false,
    createdAt: Date.now(),
  }
  alerts.push(alert)
  await AsyncStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(alerts))
  return alert
}

export async function removePriceAlert(id: string): Promise<void> {
  const alerts = await getPriceAlerts()
  const filtered = alerts.filter(a => a.id !== id)
  await AsyncStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(filtered))
}

// Check and trigger alerts
export async function checkPriceAlerts(currentPrice: number): Promise<void> {
  const alerts = await getPriceAlerts()
  let updated = false

  for (const alert of alerts) {
    if (alert.triggered) continue

    const shouldTrigger =
      (alert.direction === 'above' && currentPrice >= alert.targetPrice) ||
      (alert.direction === 'below' && currentPrice <= alert.targetPrice)

    if (shouldTrigger) {
      alert.triggered = true
      updated = true
      await NotificationTemplates.priceAlert(
        currentPrice,
        alert.direction === 'above' ? 'up' : 'down'
      )
    }
  }

  if (updated) {
    await AsyncStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(alerts))
  }
}

// Price history (for sparkline charts)
export async function addPriceToHistory(price: number): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(PRICE_HISTORY_KEY)
    const history: number[] = data ? JSON.parse(data) : []
    history.push(price)
    if (history.length > 100) history.splice(0, history.length - 100)
    await AsyncStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(history))
  } catch {}
}

export async function getPriceHistory(): Promise<number[]> {
  try {
    const data = await AsyncStorage.getItem(PRICE_HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}
