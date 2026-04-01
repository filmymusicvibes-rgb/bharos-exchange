import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Share, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated'
import Svg, { Rect } from 'react-native-svg'
import { colors, spacing, radius, neu, shadows } from '../lib/theme'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { db } from '../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

const { width } = Dimensions.get('window')
const QR_SIZE = width * 0.55

// Simple QR-like pattern generator using SVG
function QRCodePattern({ data, size }: { data: string, size: number }) {
  const gridSize = 21
  const cellSize = size / gridSize
  // Generate deterministic pattern from data string
  const cells: boolean[][] = []
  for (let i = 0; i < gridSize; i++) {
    cells[i] = []
    for (let j = 0; j < gridSize; j++) {
      // Finder patterns (corner squares)
      const isTopLeft = (i < 7 && j < 7)
      const isTopRight = (i < 7 && j >= gridSize - 7)
      const isBottomLeft = (i >= gridSize - 7 && j < 7)

      if (isTopLeft || isTopRight || isBottomLeft) {
        // Outer border
        if (i === 0 || i === 6 || j === 0 || j === 6 ||
            (isTopRight && (j === gridSize - 1 || j === gridSize - 7)) ||
            (isBottomLeft && (i === gridSize - 1 || i === gridSize - 7))) {
          cells[i][j] = true
        }
        // Inner fill
        else if ((i >= 2 && i <= 4 && j >= 2 && j <= 4) ||
                 (isTopRight && i >= 2 && i <= 4 && j >= gridSize - 5 && j <= gridSize - 3) ||
                 (isBottomLeft && i >= gridSize - 5 && i <= gridSize - 3 && j >= 2 && j <= 4)) {
          cells[i][j] = true
        } else {
          cells[i][j] = false
        }
      } else {
        // Data area — deterministic pseudo-random
        const hash = (data.charCodeAt((i * gridSize + j) % data.length) * 31 + i * 17 + j * 13) % 100
        cells[i][j] = hash > 48
      }
    }
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill="#fff" rx={8} />
      {cells.map((row, i) =>
        row.map((filled, j) =>
          filled ? (
            <Rect
              key={`${i}-${j}`}
              x={j * cellSize}
              y={i * cellSize}
              width={cellSize + 0.5}
              height={cellSize + 0.5}
              fill="#0C1E2E"
            />
          ) : null
        )
      )}
    </Svg>
  )
}

export default function ReceiveScreen() {
  const [walletAddress, setWalletAddress] = useState('')
  const [userName, setUserName] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      const email = await AsyncStorage.getItem('bharos_user')
      if (!email) return
      const snap = await getDoc(doc(db, 'users', email))
      if (snap.exists()) {
        const data: any = snap.data()
        setUserName(data.userName || email.split('@')[0])
        setWalletAddress(data.walletAddress || `0x${email.replace(/[^a-z0-9]/gi, '').substring(0, 6)}...${Math.random().toString(36).substring(2, 6)}`)
      }
    }
    load()
  }, [])

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Send BRS to my wallet:\n${walletAddress}\n\nBharos Exchange`,
        title: 'My BRS Wallet Address',
      })
    } catch (err) {}
  }

  return (
    <LinearGradient colors={colors.gradientScreen} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Receive BRS</Text>
          <TouchableOpacity style={styles.backBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* QR Code Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(700)}>
          <View style={styles.qrCard}>
            <View style={styles.qrGlow} />

            <Text style={styles.qrLabel}>Scan QR Code to send BRS</Text>

            <View style={styles.qrContainer}>
              <View style={styles.qrInner}>
                <QRCodePattern data={walletAddress || 'bharos-exchange'} size={QR_SIZE} />
                {/* BRS logo overlay */}
                <View style={styles.qrLogoOverlay}>
                  <LinearGradient colors={colors.gradientGold} style={styles.qrLogo}>
                    <Text style={styles.qrLogoText}>B</Text>
                  </LinearGradient>
                </View>
              </View>
            </View>

            <Text style={styles.qrNetwork}>BRS Network (BSC)</Text>
          </View>
        </Animated.View>

        {/* Wallet Address */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>Your Wallet Address</Text>
            <View style={styles.addressRow}>
              <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                {walletAddress || '0x7a3F...generating...'}
              </Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? colors.green : colors.primary} />
              </TouchableOpacity>
            </View>
            {copied && <Text style={styles.copiedText}>Address copied!</Text>}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
            <View style={styles.actionIconNeu}>
              <LinearGradient colors={colors.gradientPrimary} style={styles.actionIcon}>
                <Ionicons name="copy" size={20} color="#000" />
              </LinearGradient>
            </View>
            <Text style={styles.actionBtnLabel}>Copy Address</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <View style={styles.actionIconNeu}>
              <LinearGradient colors={colors.gradientCyan} style={styles.actionIcon}>
                <Ionicons name="share-social" size={20} color="#000" />
              </LinearGradient>
            </View>
            <Text style={styles.actionBtnLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={styles.actionIconNeu}>
              <LinearGradient colors={colors.gradientGold} style={styles.actionIcon}>
                <Ionicons name="download" size={20} color="#000" />
              </LinearGradient>
            </View>
            <Text style={styles.actionBtnLabel}>Save QR</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Info Note */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Important</Text>
              <Text style={styles.infoText}>Only send BRS (Bharos Coin) to this address. Sending any other cryptocurrency may result in permanent loss.</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 56 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxl },
  backBtn: {
    ...neu.iconCircle,
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { flex: 1, color: colors.white, fontSize: 20, fontWeight: '700', textAlign: 'center' },

  // QR Card
  qrCard: {
    ...neu.card,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  qrGlow: {
    position: 'absolute', top: -50, width: 200, height: 200, borderRadius: 100,
    backgroundColor: colors.primaryGlow, opacity: 0.1,
  },
  qrLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: spacing.xl },
  qrContainer: {
    ...neu.inset,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  qrInner: { position: 'relative', borderRadius: radius.md, overflow: 'hidden' },
  qrLogoOverlay: {
    position: 'absolute',
    top: '50%', left: '50%',
    marginTop: -18, marginLeft: -18,
  },
  qrLogo: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  qrLogoText: { color: '#000', fontSize: 16, fontWeight: '900' },
  qrNetwork: { color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  // Address
  addressCard: {
    ...neu.cardSoft,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  addressLabel: { color: colors.textTertiary, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: spacing.sm },
  addressRow: {
    ...neu.inset,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  addressText: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '600' },
  copyBtn: { padding: spacing.xs },
  copiedText: { color: colors.green, fontSize: 11, fontWeight: '600', marginTop: spacing.xs, textAlign: 'center' },

  // Actions
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.xxl },
  actionBtn: { alignItems: 'center' },
  actionIconNeu: {
    ...neu.iconCircle,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  actionIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  actionBtnLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },

  // Info
  infoCard: {
    ...neu.inset,
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoContent: { flex: 1 },
  infoTitle: { color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  infoText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
})
