import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated'
import { colors, spacing, radius, neu, glass, shadows } from '../../lib/theme'
import { db } from '../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { checkBiometricSupport, setBiometricEnabled } from '../../lib/biometrics'
import { getLanguage, setLanguage, availableLanguages, Language } from '../../lib/i18n'

const menuSections = [
  {
    title: 'Account',
    items: [
      { icon: 'settings-outline', title: 'Account Settings', color: colors.primary, hasArrow: true },
      { icon: 'shield-checkmark-outline', title: 'Security', color: colors.green, hasArrow: true },
      { icon: 'wallet-outline', title: 'Wallet Address', color: colors.gold, hasArrow: true },
    ],
  },
  {
    title: 'Network',
    items: [
      { icon: 'people-outline', title: 'Referral Network', color: colors.purple, hasArrow: true },
      { icon: 'document-text-outline', title: 'Transaction History', color: colors.orange, hasArrow: true },
      { icon: 'bar-chart-outline', title: 'Earnings Report', color: colors.cyan, hasArrow: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', title: 'Help Center', color: colors.primary, hasArrow: true },
      { icon: 'chatbubble-outline', title: 'Live Chat Support', color: colors.green, hasArrow: true },
      { icon: 'book-outline', title: 'Terms & Privacy', color: colors.textSecondary, hasArrow: true },
    ],
  },
]

export default function ProfileScreen() {
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('inactive')
  const [referralCode, setReferralCode] = useState('')
  const [biometricEnabled, setBiometricState] = useState(false)
  const [biometricType, setBiometricType] = useState('Fingerprint')
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const [showLangPicker, setShowLangPicker] = useState(false)

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

      // Load biometric status
      const bioStatus = await checkBiometricSupport()
      setBiometricAvailable(bioStatus.isAvailable)
      setBiometricState(bioStatus.isEnabled)
      setBiometricType(bioStatus.biometricType)

      // Load language
      const lang = await getLanguage()
      setCurrentLang(lang)

      // Notification pref
      const notifPref = await AsyncStorage.getItem('bharos_notifications')
      setNotificationsEnabled(notifPref !== 'false')
    }
    load()
  }, [])

  const handleBiometricToggle = async (val: boolean) => {
    setBiometricState(val)
    await setBiometricEnabled(val)
    Alert.alert(
      val ? '🔐 Biometric Enabled' : '🔓 Biometric Disabled',
      val ? `${biometricType} authentication is now active.` : 'Standard login will be used.'
    )
  }

  const handleLanguageChange = async (lang: Language) => {
    setCurrentLang(lang)
    await setLanguage(lang)
    setShowLangPicker(false)
    Alert.alert('🌍 Language Changed', `App language set to ${availableLanguages.find(l => l.code === lang)?.name}`)
  }

  const handleNotificationToggle = async (val: boolean) => {
    setNotificationsEnabled(val)
    await AsyncStorage.setItem('bharos_notifications', val ? 'true' : 'false')
  }

  return (
    <LinearGradient colors={colors.gradientScreen} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ━━━ Header ━━━ */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Text style={styles.title}>Account</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* ━━━ Profile Card ━━━ */}
        <Animated.View entering={FadeInUp.delay(100).duration(700)}>
          <LinearGradient
            colors={['#0D3B4F', '#0F4A5E', '#0D3B4F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCard}
          >
            <View style={styles.profileGlow1} />
            <View style={styles.profileGlow2} />

            {/* Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarOuter}>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.avatarRing}
                >
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarLetter}>
                      {userName.charAt(0).toUpperCase() || 'B'}
                    </Text>
                  </View>
                </LinearGradient>
                {/* Online indicator */}
                <View style={styles.onlineDot} />
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userName || 'Bharos User'}</Text>
                <Text style={styles.profileEmail}>{email || 'user@bharos.com'}</Text>
                <View style={styles.statusRow}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: status === 'active' ? colors.greenSoft : colors.orangeSoft }
                  ]}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: status === 'active' ? colors.green : colors.orange }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: status === 'active' ? colors.green : colors.orange }
                    ]}>
                      {status === 'active' ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* KYC + Referral */}
            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.green} />
                </View>
                <Text style={styles.statLabel}>KYC</Text>
                <Text style={[styles.statValue, { color: status === 'active' ? colors.green : colors.orange }]}>
                  {status === 'active' ? 'Verified' : 'Pending'}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.profileStatItem}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="people" size={16} color={colors.primary} />
                </View>
                <Text style={styles.statLabel}>Referral</Text>
                <Text style={styles.statValue}>{referralCode || 'N/A'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.profileStatItem}>
                <View style={styles.statIconWrap}>
                  <Ionicons name="star" size={16} color={colors.gold} />
                </View>
                <Text style={styles.statLabel}>Tier</Text>
                <Text style={[styles.statValue, { color: colors.gold }]}>Bronze</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ━━━ KYC Verification ━━━ */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <View style={styles.kycCard}>
            <View style={styles.kycHeader}>
              <Text style={styles.kycTitle}>KYC Verification</Text>
              <View style={styles.kycProgress}>
                <View style={styles.kycProgressBar}>
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.kycProgressFill, { width: status === 'active' ? '100%' : '66%' }]}
                  />
                </View>
                <Text style={styles.kycProgressText}>
                  {status === 'active' ? '3/3' : '2/3'}
                </Text>
              </View>
            </View>

            {[
              { label: 'Identity Verification', done: true },
              { label: 'Selfie Check', done: true },
              { label: 'Address Verification', done: status === 'active' },
            ].map((item, i) => (
              <View key={i} style={styles.kycRow}>
                <View style={[styles.kycDot, item.done && styles.kycDotDone]}>
                  {item.done ? (
                    <Ionicons name="checkmark" size={11} color="#000" />
                  ) : (
                    <View style={styles.kycDotPending} />
                  )}
                </View>
                <Text style={styles.kycLabel}>{item.label}</Text>
                <Text style={[
                  styles.kycStatus,
                  { color: item.done ? colors.green : colors.orange }
                ]}>
                  {item.done ? 'Completed' : 'Pending'}
                </Text>
              </View>
            ))}

            {status !== 'active' && (
              <TouchableOpacity activeOpacity={0.8} style={{ marginTop: spacing.lg }}>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.uploadBtn}
                >
                  <Ionicons name="cloud-upload" size={16} color="#000" />
                  <Text style={styles.uploadText}>Upload Documents</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ━━━ Preferences ━━━ */}
        <Animated.View entering={FadeInUp.delay(250).duration(600)}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.menuGroup}>
            {/* Biometric */}
            <View style={[styles.menuRow, styles.menuRowBorder]}>
              <View style={[styles.menuIcon, { backgroundColor: `${colors.cyan}12` }]}>
                <Ionicons name="finger-print" size={20} color={colors.cyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>{biometricType} Login</Text>
                <Text style={styles.menuSub}>{biometricAvailable ? 'Available' : 'Not available on web'}</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: 'rgba(255,255,255,0.08)', true: colors.primarySoft }}
                thumbColor={biometricEnabled ? colors.primary : colors.textMuted}
                disabled={!biometricAvailable}
              />
            </View>

            {/* Language */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.menuRow, styles.menuRowBorder]}
              onPress={() => setShowLangPicker(!showLangPicker)}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${colors.gold}12` }]}>
                <Ionicons name="language" size={20} color={colors.gold} />
              </View>
              <Text style={[styles.menuTitle, { flex: 1 }]}>Language</Text>
              <Text style={styles.langBadge}>
                {availableLanguages.find(l => l.code === currentLang)?.flag}{' '}
                {availableLanguages.find(l => l.code === currentLang)?.nativeName}
              </Text>
              <Ionicons name={showLangPicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Language Picker */}
            {showLangPicker && (
              <View style={styles.langPicker}>
                {availableLanguages.map(lang => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langOption, currentLang === lang.code && styles.langOptionActive]}
                    onPress={() => handleLanguageChange(lang.code)}
                  >
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.langName, currentLang === lang.code && { color: colors.primary }]}>{lang.name}</Text>
                      <Text style={styles.langNative}>{lang.nativeName}</Text>
                    </View>
                    {currentLang === lang.code && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Notifications */}
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: `${colors.orange}12` }]}>
                <Ionicons name="notifications" size={20} color={colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>Push Notifications</Text>
                <Text style={styles.menuSub}>{notificationsEnabled ? 'Receiving alerts' : 'Disabled'}</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: 'rgba(255,255,255,0.08)', true: colors.orangeSoft }}
                thumbColor={notificationsEnabled ? colors.orange : colors.textMuted}
              />
            </View>
          </View>
        </Animated.View>

        {/* ━━━ Menu Sections ━━━ */}
        {menuSections.map((section, si) => (
          <Animated.View key={si} entering={FadeInUp.delay(350 + si * 100).duration(600)}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.menuGroup}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  style={[styles.menuRow, i < section.items.length - 1 && styles.menuRowBorder]}
                  onPress={() => {
                    if (item.title === 'Transaction History') router.push('/transactions' as any)
                  }}
                >
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}12` }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* ━━━ Logout ━━━ */}
        <Animated.View entering={FadeInUp.delay(700).duration(500)}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.logoutBtn}
            onPress={async () => {
              await AsyncStorage.removeItem('bharos_user')
            }}
          >
            <View style={styles.logoutInner}>
              <Ionicons name="log-out-outline" size={20} color={colors.red} />
              <Text style={styles.logoutText}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* App version */}
        <Text style={styles.version}>Bharos Exchange v2.0.0</Text>

        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 56 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: { color: colors.white, fontSize: 22, fontWeight: '700' },
  settingsBtn: {
    ...neu.iconCircle,
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },

  // Profile Card
  profileCard: {
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.12)',
    marginBottom: spacing.xxl,
    ...shadows.elevated,
  },
  profileGlow1: {
    position: 'absolute', top: -30, right: -30,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.primaryGlow, opacity: 0.2,
  },
  profileGlow2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.goldGlow, opacity: 0.1,
  },

  // Avatar
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarOuter: {
    position: 'relative',
    marginRight: spacing.lg,
  },
  avatarRing: {
    width: 68, height: 68, borderRadius: 34,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  profileInfo: { flex: 1 },
  profileName: { color: colors.white, fontSize: 20, fontWeight: '700' },
  profileEmail: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  statusRow: { marginTop: spacing.sm },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs + 1,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  statusText: {
    fontSize: 11, fontWeight: '700',
  },

  // Profile Stats
  profileStats: {
    ...neu.inset,
    flexDirection: 'row',
    padding: spacing.lg,
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  statIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 2,
  },
  statLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  statValue: { color: colors.white, fontSize: 12, fontWeight: '700' },
  statDivider: {
    width: 1, backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // KYC
  kycCard: {
    ...neu.card,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  kycHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  kycTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  kycProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  kycProgressBar: {
    width: 60, height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, overflow: 'hidden',
  },
  kycProgressFill: {
    height: '100%', borderRadius: 2,
  },
  kycProgressText: {
    color: colors.textMuted, fontSize: 10, fontWeight: '600',
  },
  kycRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm, gap: spacing.md,
  },
  kycDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  kycDotDone: { backgroundColor: colors.primary },
  kycDotPending: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.orange,
  },
  kycLabel: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  kycStatus: { fontSize: 12, fontWeight: '600' },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  uploadText: { color: '#000', fontSize: 14, fontWeight: '700' },

  // Menu
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  menuGroup: {
    ...neu.card,
    padding: spacing.sm,
    marginBottom: spacing.xl,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  menuTitle: { color: colors.white, fontSize: 14, fontWeight: '600', flex: 1 },
  menuSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },

  // Language
  langBadge: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginRight: spacing.xs },
  langPicker: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  langOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
    marginBottom: spacing.xxs,
  },
  langOptionActive: {
    backgroundColor: 'rgba(0,212,170,0.08)',
  },
  langFlag: { fontSize: 22 },
  langName: { color: colors.white, fontSize: 14, fontWeight: '600' as const },
  langNative: { color: colors.textMuted, fontSize: 11 },

  // Logout
  logoutBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.redSoft,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.2)',
  },
  logoutText: { color: colors.red, fontSize: 15, fontWeight: '600' },

  // Version
  version: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
})
