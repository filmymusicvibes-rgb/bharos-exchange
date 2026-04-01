import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

// Register for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied')
    return null
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'bharos-exchange',
    })
    token = tokenData.data
    await AsyncStorage.setItem('bharos_push_token', token)
  } catch (err) {
    console.log('Error getting push token:', err)
  }

  // Android channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('transactions', {
      name: 'Transactions',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D4AA',
      sound: 'default',
    })

    await Notifications.setNotificationChannelAsync('price-alerts', {
      name: 'Price Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#FFD700',
    })

    await Notifications.setNotificationChannelAsync('staking', {
      name: 'Staking Rewards',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#00D4AA',
    })
  }

  return token
}

// Schedule a local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  channelId?: string,
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
      ...(Platform.OS === 'android' && channelId ? { channelId } : {}),
    },
    trigger: null, // Immediate
  })
}

// Pre-built notification templates
export const NotificationTemplates = {
  transactionSent: (amount: number, address: string) =>
    scheduleLocalNotification(
      '💸 BRS Sent Successfully',
      `${amount.toLocaleString()} BRS sent to ${address}`,
      { type: 'transaction', action: 'sent' },
      'transactions'
    ),

  transactionReceived: (amount: number, from: string) =>
    scheduleLocalNotification(
      '💰 BRS Received!',
      `You received ${amount.toLocaleString()} BRS from ${from}`,
      { type: 'transaction', action: 'received' },
      'transactions'
    ),

  withdrawalProcessed: (amount: number) =>
    scheduleLocalNotification(
      '✅ Withdrawal Complete',
      `${amount.toLocaleString()} BRS withdrawal has been processed`,
      { type: 'withdrawal' },
      'transactions'
    ),

  stakingReward: (amount: number) =>
    scheduleLocalNotification(
      '🎁 Staking Reward',
      `You earned ${amount.toFixed(2)} BRS from staking!`,
      { type: 'staking' },
      'staking'
    ),

  priceAlert: (price: number, direction: 'up' | 'down') =>
    scheduleLocalNotification(
      direction === 'up' ? '📈 BRS Price Up!' : '📉 BRS Price Down!',
      `BRS is now $${price.toFixed(4)} — ${direction === 'up' ? 'Great time to sell!' : 'Good entry point!'}`,
      { type: 'price_alert' },
      'price-alerts'
    ),

  welcomeBonus: () =>
    scheduleLocalNotification(
      '🎉 Welcome to Bharos Exchange!',
      'Start trading BRS now. Complete KYC to unlock all features.',
      { type: 'welcome' }
    ),

  dailyReminder: () =>
    scheduleLocalNotification(
      '🌟 Daily Check-in Reward!',
      'Check in today to earn bonus BRS tokens.',
      { type: 'daily' }
    ),
}

// Listen for incoming notifications
export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback)
}

// Listen for notification taps
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback)
}
