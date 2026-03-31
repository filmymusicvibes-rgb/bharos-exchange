import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { colors, spacing, radius, glass } from '../../lib/theme'
import { db } from '../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'

const menuItems = [
  { icon: 'settings-outline', title: 'Account Settings', color: colors.cyan },
  { icon: 'shield-checkmark-outline', title: 'Security', color: colors.green },
  { icon: 'wallet-outline', title: 'Wallet Address', color: colors.gold },
  { icon: 'people-outline', title: 'Referral Network', color: colors.purple },
  { icon: 'document-text-outline', title: 'Transaction History', color: colors.orange },
  { icon: 'help-circle-outline', title: 'Need Help? Contact Support', color: colors.cyan },
]

export default function ProfileScreen() {
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('inactive')
  const [referralCode, setReferralCode] = useState('')

  useEffect(() => {
    const load = async () => {
      const em = await AsyncStorage.getItem('bharos_user')
      if (!em) return
      setEmail(em)

      const snap = await getDoc(doc(db, 'users', em))
      if (snap.exists()) {
        const data: any = snap.data()
        setUserName(data.userName || em.split('@')[0])
        setStatus(data.status || 'inactive')
        setReferralCode(data.referralCode || '')
      }
    }
    load()
  }, [])

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={styles.title}>Profile</Text>
        </Animated.View>

        {/* Avatar Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(700)}>
          <LinearGradient
            colors={['#132F5E', '#0F2847']}
            style={styles.avatarCard}
          >
            <View style={styles.avatarGlow} />

            <View style={styles.avatarWrap}>
              <LinearGradient
                colors={colors.gradientCyan as [string, string]}
                style={styles.avatarBorder}
              >
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>
                    {userName.charAt(0).toUpperCase() || 'B'}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileSub}>BHAROS COIN User</Text>

            {/* Verification Status */}
            <View style={styles.verifyCard}>
              <LinearGradient
                colors={colors.gradientGold as [string, string]}
                style={styles.verifyBadge}
              >
                <Text style={styles.verifyBadgeText}>BRS</Text>
              </LinearGradient>
              <View style={styles.verifyRow}>
                <Text style={styles.verifyLabel}>KYC Verification Status</Text>
                <View style={styles.verifiedTag}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.green} />
                  <Text style={styles.verifiedText}>
                    {status === 'active' ? 'Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
              <View style={styles.verifyProgress}>
                <View style={[styles.verifyFill, { width: status === 'active' ? '100%' : '30%' }]} />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* KYC Steps */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View style={[glass.card, styles.kycCard]}>
            <Text style={styles.kycTitle}>KYC Verification</Text>

            {[
              { label: 'Identity Verification', status: 'Completed', done: true },
              { label: 'Address Verification', status: 'Pending', done: false },
              { label: 'Selfie Check', status: 'Completed', done: true },
            ].map((item, i) => (
              <View key={i} style={styles.kycRow}>
                <View style={[styles.kycDot, item.done && styles.kycDotDone]}>
                  {item.done && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={styles.kycLabel}>{item.label}:</Text>
                <Text style={[
                  styles.kycStatus,
                  { color: item.done ? colors.green : colors.orange }
                ]}>
                  {item.status}
                </Text>
              </View>
            ))}

            <TouchableOpacity activeOpacity={0.8} style={{ marginTop: spacing.lg }}>
              <LinearGradient
                colors={colors.gradientCyan as [string, string]}
                style={styles.uploadBtn}
              >
                <Ionicons name="cloud-upload" size={18} color="#000" />
                <Text style={styles.uploadText}>Upload Documents</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)}>
          {menuItems.map((item, i) => (
            <Animated.View
              key={i}
              entering={FadeInUp.delay(350 + i * 60).duration(500)}
            >
              <TouchableOpacity activeOpacity={0.7}>
                <View style={[glass.card, styles.menuCard]}>
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInUp.delay(700).duration(500)}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.logoutBtn}
            onPress={async () => {
              await AsyncStorage.removeItem('bharos_user')
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.red} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 60 },
  title: { color: colors.white, fontSize: 28, fontWeight: '700', marginBottom: spacing.xxl },

  // Avatar Card
  avatarCard: {
    borderRadius: radius.xxl, padding: spacing.xxl,
    alignItems: 'center', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.12)',
    marginBottom: spacing.xxl,
  },
  avatarGlow: {
    position: 'absolute', top: -40, left: '50%', marginLeft: -50,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.cyanGlow, opacity: 0.3,
  },
  avatarWrap: { marginBottom: spacing.lg },
  avatarBorder: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: colors.cyan, fontSize: 28, fontWeight: '800' },
  profileName: { color: colors.white, fontSize: 22, fontWeight: '700' },
  profileSub: { color: colors.textSecondary, fontSize: 13, marginTop: 4, letterSpacing: 1 },

  // Verify
  verifyCard: {
    width: '100%', marginTop: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: radius.lg, padding: spacing.lg,
  },
  verifyBadge: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: spacing.md,
  },
  verifyBadgeText: { color: '#000', fontSize: 14, fontWeight: '900' },
  verifyRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  verifyLabel: { color: colors.textSecondary, fontSize: 12 },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { color: colors.green, fontSize: 12, fontWeight: '600' },
  verifyProgress: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3, overflow: 'hidden',
  },
  verifyFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: colors.gold,
  },

  // KYC
  kycCard: { padding: spacing.xl, marginBottom: spacing.xxl },
  kycTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: spacing.lg },
  kycRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.md, gap: spacing.sm,
  },
  kycDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  kycDotDone: { backgroundColor: colors.green },
  kycLabel: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  kycStatus: { fontSize: 13, fontWeight: '600' },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  uploadText: { color: '#000', fontSize: 14, fontWeight: '800' },

  // Menu
  menuCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, marginBottom: spacing.md,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  menuTitle: { color: colors.white, fontSize: 15, fontWeight: '600', flex: 1 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  logoutText: { color: colors.red, fontSize: 15, fontWeight: '600' },
})
