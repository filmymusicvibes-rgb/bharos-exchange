import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { colors, spacing, radius, glass } from '../lib/theme'
import { db } from '../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const login = async () => {
    setError('')
    setLoading(true)

    try {
      const cleanEmail = email.trim().toLowerCase()

      if (!cleanEmail) {
        setError('Please enter your email')
        setLoading(false)
        return
      }

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', cleanEmail)
      const snap = await getDoc(userRef)

      if (!snap.exists()) {
        setError('User not found — please sign up on web first')
        setLoading(false)
        return
      }

      // Save login
      await AsyncStorage.setItem('bharos_user', cleanEmail)

      // Navigate to home
      router.replace('/(tabs)')

    } catch (err: any) {
      setError(err.message || 'Login failed')
    }

    setLoading(false)
  }

  return (
    <View style={styles.container}>
      {/* Background glows */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Logo */}
        <Animated.View entering={FadeInDown.duration(700)} style={styles.logoWrap}>
          <LinearGradient
            colors={colors.gradientGold as [string, string]}
            style={styles.logo}
          >
            <Text style={styles.logoText}>BRS</Text>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.titleBrand}>Bharos Exchange</Text>
        </Animated.View>

        {/* Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(700)}>
          <View style={styles.card}>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity onPress={login} disabled={loading} activeOpacity={0.8}>
              <LinearGradient
                colors={colors.gradientCyan as [string, string]}
                style={styles.loginBtn}
              >
                <Text style={styles.loginText}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Info */}
            <Text style={styles.infoText}>
              New user? Sign up on bharos-exchange.vercel.app
            </Text>

          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  glowTop: {
    position: 'absolute', top: -60, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: colors.cyanGlow, opacity: 0.15,
  },
  glowBottom: {
    position: 'absolute', bottom: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: colors.goldGlow, opacity: 0.15,
  },

  // Logo
  logoWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { color: '#000', fontSize: 20, fontWeight: '900', letterSpacing: 1 },

  // Title
  title: {
    color: colors.textSecondary, fontSize: 18,
    textAlign: 'center',
  },
  titleBrand: {
    color: colors.cyan, fontSize: 28, fontWeight: '800',
    textAlign: 'center', marginBottom: spacing.xxl,
  },

  // Card
  card: {
    backgroundColor: colors.bgGlass,
    borderWidth: 1,
    borderColor: colors.bgGlassBorder,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
  },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.redSoft,
    padding: spacing.md, borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  errorText: { color: colors.red, fontSize: 13, flex: 1 },

  // Input
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    flex: 1, color: colors.white,
    fontSize: 15, paddingVertical: 14,
  },

  // Button
  loginBtn: {
    paddingVertical: 16, borderRadius: radius.lg,
    alignItems: 'center', marginTop: spacing.sm,
  },
  loginText: {
    color: '#000', fontSize: 16, fontWeight: '800',
  },

  // Info
  infoText: {
    color: colors.textMuted, fontSize: 12,
    textAlign: 'center', marginTop: spacing.lg,
  },
})
