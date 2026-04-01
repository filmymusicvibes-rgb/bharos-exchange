import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeInDown, FadeInUp, FadeIn, SlideInRight,
  useAnimatedStyle, withRepeat, withTiming, useSharedValue,
  withSequence, Easing,
  interpolate, Extrapolation,
} from 'react-native-reanimated'
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg'
import { colors, spacing, radius, neu, shadows, typography } from '../../lib/theme'
import { router } from 'expo-router'
import { db } from '../../lib/firebase'
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = Dimensions.get('window')
const CARD_WIDTH = width - spacing.xl * 2

// Sparkline data
const brsSparkline = [3.2, 3.25, 3.18, 3.30, 3.28, 3.35, 3.32, 3.40, 3.38, 3.42, 3.45, 3.41, 3.48, 3.44, 3.50, 3.47, 3.52, 3.55, 3.53, 3.57]
const generateSparkline = (seed: number, points = 20) => {
  const data: number[] = []
  let value = seed
  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.48) * seed * 0.08
    data.push(Math.max(value * 0.7, value))
  }
  return data
}
const btcSparkline = generateSparkline(67000, 20)
const ethSparkline = generateSparkline(3400, 20)
const bnbSparkline = generateSparkline(600, 20)

const marketCoins = [
  { symbol: 'BRS', name: 'Bharos Coin', price: 0.0055, change: '+2.55%', color: colors.gold, data: brsSparkline, isPositive: true },
  { symbol: 'BTC', name: 'Bitcoin', price: 67420, change: '+1.23%', color: '#F7931A', data: btcSparkline, isPositive: true },
  { symbol: 'ETH', name: 'Ethereum', price: 3456, change: '-0.85%', color: '#627EEA', data: ethSparkline, isPositive: false },
  { symbol: 'BNB', name: 'BNB', price: 608, change: '+0.67%', color: '#F3BA2F', data: bnbSparkline, isPositive: true },
]

// SVG Sparkline Component
function Sparkline({ data, width: w, height: h, isPositive }: {
  data: number[], width: number, height: number, color: string, isPositive: boolean
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((val - min) / range) * (h - 4) - 2,
  }))
  let pathD = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const cp1x = (points[i - 1].x + points[i].x) / 2
    pathD += ` C ${cp1x} ${points[i - 1].y}, ${cp1x} ${points[i].y}, ${points[i].x} ${points[i].y}`
  }
  const areaD = pathD + ` L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`
  const gradId = `sparkGrad_${isPositive ? 'g' : 'r'}_${Math.random().toString(36).substr(2, 4)}`

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={isPositive ? colors.green : colors.red} stopOpacity="0.20" />
          <Stop offset="1" stopColor={isPositive ? colors.green : colors.red} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <Path d={areaD} fill={`url(#${gradId})`} />
      <Path d={pathD} stroke={isPositive ? colors.green : colors.red} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  )
}

// Animated 3D Coin
function AnimatedCoin() {
  const rotation = useSharedValue(0)
  const float = useSharedValue(0)
  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1, false)
    float.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    )
  }, [])
  const coinStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: float.value },
      { scaleX: interpolate(Math.cos((rotation.value * Math.PI) / 180), [-1, 1], [0.3, 1], Extrapolation.CLAMP) },
      { perspective: 800 },
    ],
  }))

  return (
    <Animated.View style={[styles.coinOuter, coinStyle]}>
      {/* Neumorphic coin base */}
      <View style={styles.coinNeuBase}>
        <LinearGradient
          colors={['#FFE44D', '#FFD700', '#D4A800']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.coin3D}
        >
          <View style={styles.coinInner}>
            <Text style={styles.coinSymbol}>₿</Text>
            <Text style={styles.coinLabel}>BRS</Text>
          </View>
        </LinearGradient>
      </View>
      <View style={styles.coinGlow} />
    </Animated.View>
  )
}

export default function WalletScreen() {
  const [brs, setBrs] = useState(0)
  const [usdt, setUsdt] = useState(0)
  const [status, setStatus] = useState('inactive')
  const [userName, setUserName] = useState('')
  const [transactions, setTransactions] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')

  const loadData = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem('bharos_user')
      if (!email) { setLoading(false); return }
      const snap = await getDoc(doc(db, 'users', email))
      if (snap.exists()) {
        const data: any = snap.data()
        setBrs(Number(data.brsBalance || 0))
        setUsdt(Number(data.usdtBalance || 0))
        setStatus(data.status || 'inactive')
        setUserName(data.userName || email.split('@')[0])
      }
      const txSnap = await getDocs(query(collection(db, 'transactions'), where('userId', '==', email), orderBy('createdAt', 'desc'), limit(5)))
      const txList: any[] = []
      txSnap.forEach(d => txList.push({ id: d.id, ...d.data() }))
      setTransactions(txList)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [])
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false) }

  const brsPrice = 0.0055
  const totalBrsValue = brs * brsPrice

  const quickActions = [
    { icon: 'paper-plane', label: 'Send', gradient: [colors.primary, colors.primaryDark], route: '/send' },
    { icon: 'download', label: 'Receive', gradient: [colors.cyan, colors.cyanDark], route: '/receive' },
    { icon: 'swap-horizontal', label: 'Trade', gradient: [colors.gold, colors.goldDark], route: '/(tabs)/exchange' },
    { icon: 'trending-up', label: 'Earn', gradient: [colors.green, colors.greenDark], route: '/(tabs)/staking' },
  ]

  if (loading) {
    return (
      <LinearGradient colors={colors.gradientScreen} style={styles.loadingContainer}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.loadingInner}>
          <View style={styles.loadingCoinNeu}>
            <LinearGradient colors={colors.gradientGold} style={styles.loadingCoin}>
              <Text style={styles.loadingCoinText}>B</Text>
            </LinearGradient>
          </View>
          <Text style={styles.loadingText}>Loading Portfolio...</Text>
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        </Animated.View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={colors.gradientScreen} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* ━━━ Header ━━━ */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <TouchableOpacity>
            <View style={styles.avatarNeu}>
              <LinearGradient colors={colors.gradientPrimary} style={styles.avatar}>
                <Ionicons name="person" size={18} color="#000" />
              </LinearGradient>
            </View>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerGreeting}>Good Morning</Text>
            <Text style={styles.headerName}>{userName || 'Trader'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconNeu}>
              <Ionicons name="qr-code-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconNeu}>
              <View style={styles.notifDot} />
              <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ━━━ Hero Balance Card (Neumorphic) ━━━ */}
        <Animated.View entering={FadeInUp.delay(100).duration(700)}>
          <View style={styles.heroCardNeu}>
            {/* Inner highlight gradient */}
            <LinearGradient
              colors={['rgba(30,80,110,0.15)', 'transparent', 'rgba(0,0,0,0.10)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Glows */}
            <View style={styles.heroGlow1} />
            <View style={styles.heroGlow2} />

            {/* Live Badge (neumorphic badge) */}
            <View style={styles.liveBadgeNeu}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveBadgeText}>BRS: ${brsPrice.toFixed(4)}</Text>
              <Text style={styles.liveBadgeChange}>(+2.3%)</Text>
            </View>

            {/* Main Balance */}
            <View style={styles.balanceSection}>
              <View style={styles.balanceLeft}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceAmount}>{brs > 0 ? brs.toLocaleString() : '12,500'}</Text>
                <Text style={styles.balanceSub}>BRS</Text>
                <Text style={styles.balanceUsd}>
                  ${(brs > 0 ? totalBrsValue : 68.75).toFixed(4)}
                </Text>
              </View>
              <AnimatedCoin />
            </View>

            {/* Swipe dots */}
            <View style={styles.swipeDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
            </View>

            {/* Sub Balances — Inset neumorphic */}
            <View style={styles.subBalancesNeu}>
              <View style={styles.subItem}>
                <View style={[styles.subDot, { backgroundColor: colors.gold }]} />
                <Text style={styles.subLabel}>BRS</Text>
                <Text style={styles.subValue}>{brs > 0 ? brs.toLocaleString() : '12,500'}</Text>
              </View>
              <View style={styles.subDivider} />
              <View style={styles.subItem}>
                <View style={[styles.subDot, { backgroundColor: colors.green }]} />
                <Text style={styles.subLabel}>USDT</Text>
                <Text style={styles.subValue}>${usdt > 0 ? usdt.toFixed(2) : '1,250.00'}</Text>
              </View>
              <View style={styles.subDivider} />
              <View style={styles.subItem}>
                <View style={[styles.subDot, { backgroundColor: status === 'active' ? colors.green : colors.orange }]} />
                <Text style={styles.subLabel}>Status</Text>
                <Text style={[styles.subValue, { color: status === 'active' ? colors.green : colors.orange }]}>
                  {status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ━━━ Quick Actions (Neumorphic Pillows) ━━━ */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.quickActions}>
          {quickActions.map((action, i) => (
            <TouchableOpacity key={action.label} style={styles.actionItem} activeOpacity={0.7} onPress={() => router.push(action.route as any)}>
              <Animated.View entering={FadeInUp.delay(250 + i * 60).duration(500)}>
                <View style={styles.actionNeuCircle}>
                  <LinearGradient colors={action.gradient as [string, string]} style={styles.actionGrad}>
                    <Ionicons name={action.icon as any} size={22} color="#000" />
                  </LinearGradient>
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ━━━ Market Overview ━━━ */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Market Overview</Text>
            <TouchableOpacity onPress={() => router.push('/transactions' as any)}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>

          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.marketScroll}
            decelerationRate="fast"
            snapToInterval={width * 0.6 + spacing.md}
          >
            {marketCoins.map((coin, i) => (
              <Animated.View key={coin.symbol} entering={SlideInRight.delay(350 + i * 80).duration(500)}>
                <TouchableOpacity activeOpacity={0.8}>
                  <View style={styles.marketCardNeu}>
                    <View style={styles.marketHeader}>
                      <View style={styles.marketCoinIconNeu}>
                        <LinearGradient colors={[coin.color, `${coin.color}99`]} style={styles.marketCoinIcon}>
                          <Text style={styles.marketCoinLetter}>{coin.symbol[0]}</Text>
                        </LinearGradient>
                      </View>
                      <View style={styles.marketInfo}>
                        <Text style={styles.marketSymbol}>{coin.symbol}</Text>
                        <Text style={styles.marketName}>{coin.name}</Text>
                      </View>
                      <View style={[styles.changeBadgeNeu, { backgroundColor: coin.isPositive ? colors.greenSoft : colors.redSoft }]}>
                        <Text style={[styles.changeText, { color: coin.isPositive ? colors.green : colors.red }]}>{coin.change}</Text>
                      </View>
                    </View>
                    <View style={styles.sparklineContainer}>
                      <Sparkline data={coin.data} width={width * 0.5} height={55} color={coin.color} isPositive={coin.isPositive} />
                    </View>
                    <Text style={styles.marketPrice}>
                      ${coin.price < 1 ? coin.price.toFixed(4) : coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.marketTimeframes}>
                      {['1D', '1W', '1M', '3M', '1Y', 'All'].map(tf => (
                        <TouchableOpacity
                          key={tf}
                          style={[styles.marketTf, selectedTimeframe === tf && styles.marketTfActive]}
                          onPress={() => setSelectedTimeframe(tf)}
                        >
                          <Text style={[styles.marketTfText, selectedTimeframe === tf && styles.marketTfTextActive]}>{tf}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ━━━ Transaction History (Neumorphic cards) ━━━ */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity onPress={() => router.push('/transactions' as any)}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <>
              {[
                { desc: 'BRS Coin', sub: 'Apr 20, 2026', amount: -50000, currency: 'BRS' },
                { desc: 'BRS Coin', sub: 'Apr 20, 2026', amount: -10000, currency: 'BRS' },
                { desc: 'BRS/USDT', sub: 'Nov 10, 2025', amount: -20000, currency: 'BRS' },
                { desc: 'BRS Coin', sub: 'Apr 20, 2026', amount: -5000, currency: 'BRS' },
              ].map((tx, i) => (
                <Animated.View key={i} entering={FadeInUp.delay(450 + i * 80).duration(500)}>
                  <View style={styles.txCardNeu}>
                    <View style={styles.txCoinIconNeu}>
                      <LinearGradient colors={colors.gradientGold} style={styles.txCoinIcon}>
                        <Text style={styles.txCoinLetter}>B</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txDesc}>{tx.desc}</Text>
                      <Text style={styles.txSub}>{tx.sub}</Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: tx.amount > 0 ? colors.green : colors.red }]}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} {tx.currency}
                      </Text>
                      <Text style={styles.txUsd}>${Math.abs(tx.amount * brsPrice).toFixed(2)}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </>
          ) : (
            transactions.map((tx, i) => (
              <Animated.View key={tx.id} entering={FadeInUp.delay(450 + i * 80).duration(500)}>
                <View style={styles.txCardNeu}>
                  <View style={[styles.txIcon, { backgroundColor: tx.amount > 0 ? colors.greenSoft : colors.redSoft }]}>
                    <Ionicons name={tx.amount > 0 ? 'arrow-down' : 'arrow-up'} size={18} color={tx.amount > 0 ? colors.green : colors.red} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txDesc} numberOfLines={1}>{tx.description || 'Transaction'}</Text>
                    <Text style={styles.txSub}>{tx.currency || 'BRS'}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: tx.amount > 0 ? colors.green : colors.red }]}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 56 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingInner: { alignItems: 'center' },
  loadingCoinNeu: {
    ...neu.iconCircle,
    borderRadius: 36,
    width: 72, height: 72,
    justifyContent: 'center', alignItems: 'center',
  },
  loadingCoin: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  loadingCoinText: { color: '#000', fontSize: 28, fontWeight: '900' },
  loadingText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600', marginTop: spacing.xl, letterSpacing: 0.5 },

  // ━━━ Header ━━━
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxl },
  avatarNeu: {
    ...neu.iconCircle,
    borderRadius: 22,
    width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, marginLeft: spacing.md },
  headerGreeting: { color: colors.textTertiary, fontSize: 12, fontWeight: '500' },
  headerName: { color: colors.white, fontSize: 18, fontWeight: '700', marginTop: 1 },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  headerIconNeu: {
    ...neu.iconCircle,
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  notifDot: {
    position: 'absolute', top: 7, right: 8,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.red, zIndex: 1,
  },

  // ━━━ Hero Card (NEUMORPHIC) ━━━
  heroCardNeu: {
    ...neu.card,
    padding: spacing.xxl,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  heroGlow1: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: colors.primaryGlow, opacity: 0.15,
  },
  heroGlow2: {
    position: 'absolute', bottom: -30, left: -30,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.goldGlow, opacity: 0.12,
  },
  liveBadgeNeu: {
    ...neu.badge,
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  livePulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  liveBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  liveBadgeChange: { color: colors.green, fontSize: 11, fontWeight: '600' },

  balanceSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  balanceLeft: {},
  balanceLabel: { color: colors.textTertiary, fontSize: 13, fontWeight: '500', letterSpacing: 0.5 },
  balanceAmount: { color: colors.white, fontSize: 38, fontWeight: '800', letterSpacing: -1, marginTop: spacing.xs },
  balanceSub: { color: colors.textTertiary, fontSize: 16, fontWeight: '600', marginTop: -2 },
  balanceUsd: { color: colors.primary, fontSize: 15, fontWeight: '600', marginTop: spacing.xs },

  // Coin
  coinOuter: { alignItems: 'center' },
  coinNeuBase: {
    ...neu.iconCircle,
    borderRadius: 40,
    width: 80, height: 80,
    justifyContent: 'center', alignItems: 'center',
  },
  coin3D: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  coinInner: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  coinSymbol: { color: '#7B5800', fontSize: 26, fontWeight: '900' },
  coinLabel: { color: '#7B5800', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginTop: -3 },
  coinGlow: { position: 'absolute', bottom: -10, width: 50, height: 12, borderRadius: 25, backgroundColor: 'rgba(255,215,0,0.2)' },

  swipeDots: { flexDirection: 'row', alignSelf: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive: { backgroundColor: colors.primary, width: 18, borderRadius: 4 },

  // Sub balances (INSET NEUMORPHIC)
  subBalancesNeu: {
    ...neu.inset,
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
  },
  subItem: { flex: 1, alignItems: 'center', gap: 2 },
  subDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 2 },
  subLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  subValue: { color: colors.white, fontSize: 12, fontWeight: '700' },
  subDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.06)' },

  // ━━━ Quick Actions (NEUMORPHIC PILLOWS) ━━━
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xxxl },
  actionItem: { alignItems: 'center', width: (CARD_WIDTH) / 4 - spacing.sm },
  actionNeuCircle: {
    ...neu.iconCircle,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center',
  },
  actionGrad: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: spacing.sm, textAlign: 'center' },

  // ━━━ Section ━━━
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  seeAll: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  // ━━━ Market Cards (NEUMORPHIC) ━━━
  marketScroll: { paddingRight: spacing.xl, gap: spacing.md },
  marketCardNeu: {
    ...neu.card,
    width: width * 0.6,
    padding: spacing.lg,
  },
  marketHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  marketCoinIconNeu: {
    ...neu.iconCircle,
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  marketCoinIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  marketCoinLetter: { color: '#000', fontSize: 13, fontWeight: '900' },
  marketInfo: { flex: 1, marginLeft: spacing.sm },
  marketSymbol: { color: colors.white, fontSize: 14, fontWeight: '700' },
  marketName: { color: colors.textMuted, fontSize: 10 },
  changeBadgeNeu: {
    ...neu.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 1,
  },
  changeText: { fontSize: 11, fontWeight: '700' },
  sparklineContainer: { marginVertical: spacing.sm, alignItems: 'center' },
  marketPrice: { color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: spacing.sm },
  marketTimeframes: { flexDirection: 'row', gap: spacing.xs },
  marketTf: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.xs },
  marketTfActive: { backgroundColor: colors.primarySoft },
  marketTfText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  marketTfTextActive: { color: colors.primary },

  // ━━━ Transactions (NEUMORPHIC) ━━━
  txCardNeu: {
    ...neu.cardSoft,
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  txCoinIconNeu: {
    ...neu.iconCircle,
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  txCoinIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  txCoinLetter: { color: '#000', fontSize: 14, fontWeight: '900' },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  txInfo: { flex: 1 },
  txDesc: { color: colors.white, fontSize: 14, fontWeight: '600' },
  txSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txUsd: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
})
