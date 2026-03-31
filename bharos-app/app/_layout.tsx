import { useEffect, useState } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { colors } from '../lib/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function RootLayout() {
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const user = await AsyncStorage.getItem('bharos_user')
      if (!user) {
        router.replace('/auth')
      }
      setChecking(false)
    }
    // Small delay to let router mount
    setTimeout(checkAuth, 500)
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
        <Stack.Screen
          name="auth"
          options={{ animation: 'fade' }}
        />
      </Stack>
    </View>
  )
}
