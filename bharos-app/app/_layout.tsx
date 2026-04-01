import '../global.css'
import { useEffect, useState } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator, Platform } from 'react-native'
import { colors } from '../lib/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { registerForPushNotifications, addNotificationResponseListener } from '../lib/notifications'

export default function RootLayout() {
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const init = async () => {
      // Register push notifications (only on device)
      if (Platform.OS !== 'web') {
        await registerForPushNotifications()
      }

      // Listen for notification taps — navigate
      const sub = addNotificationResponseListener((response) => {
        const data = response.notification.request.content.data
        if (data?.type === 'transaction') {
          router.push('/transactions' as any)
        } else if (data?.type === 'staking') {
          router.push('/(tabs)/staking' as any)
        }
      })

      // Check auth
      const user = await AsyncStorage.getItem('bharos_user')
      if (!user) {
        router.replace('/auth')
      }
      setChecking(false)

      return () => sub.remove()
    }
    setTimeout(() => init(), 500)
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" options={{ animation: 'fade' }} />
        <Stack.Screen name="send" options={{ animation: 'slide_from_right', presentation: 'card' }} />
        <Stack.Screen name="receive" options={{ animation: 'slide_from_right', presentation: 'card' }} />
        <Stack.Screen name="withdraw" options={{ animation: 'slide_from_right', presentation: 'card' }} />
        <Stack.Screen name="transactions" options={{ animation: 'slide_from_right', presentation: 'card' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
    </View>
  )
}
