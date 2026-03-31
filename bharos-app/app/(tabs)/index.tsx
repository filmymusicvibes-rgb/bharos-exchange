import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeInDown, FadeInUp, useAnimatedStyle,
  withRepeat, withTiming, useSharedValue,
  withSequence, Easing,
} from 'react-native-reanimated'
import { colors, spacing, radius, glass, shadows } from '../../lib/theme'
import { db } from '../../lib/firebase'
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = Dimensions.get('window')

export default function WalletScreen() {
  const [brs, setBrs] = useState(0)
  const [usdt, setUsdt] = useState(0)
  const [status, setStatus] = useState('inactive')
  const [userName, setUserName] = useState('')
  const [transactions, setTransactions] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  // Coin rotation animation
  const coinRotation = useSharedValue(0)
  const pulseScale = useSharedValue(1)

  useEffect(() => {
    coinRotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1, false
    )
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1, true
    )
  }, [])

  const coinStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${coinRotation.value}deg` },
      { scale: pulseScale.value },
    ],
  }))

  const loadData = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem('bharos_user')
      if (!email) return

      const snap = await getDoc(doc(db, 'users', email))
      if (snap.exists()) {
        const data: any = snap.data()
        setBrs(Number(data.brsBalance || 0))
        setUsdt(Number(data.usdtBalance || 0))
        setStatus(data.status || 'inactive')
        setUserName(data.userName || email.split('@')[0])
      }

      // Load recent transactions
      const txSnap = await getDocs(
        query(
          collection(db, 'transactions'),
          where('userId', '==', email),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
      )
      const txList: any[] = []
      txSnap.forEach(d => txList.push({ id: d.id, ...d.data() }))
      setTransactions(txList)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const totalValue = (brs * 0.005) + usdt

  const quickActions = [
    { icon: 'arrow-up-circle', label: 'Send', color: colors.cyan },
    { icon: 'arrow-down-circle', label: 'Receive', color: colors.green },
    { icon: 'cart', label: 'Buy', color: colors.gold },
    { icon: 'remove-circle', label: 'Sell', color: colors.red },
  ]

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View entering={FadeInUp.duration(600)}>
          <Text style={styles.loadingText}>Loading...</Text>
        </Animated.View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.cyan}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={[
              styles.statusDot,
              { backgroundColor: status === 'active' ? colors.green : colors.orange }
            ]} />
            <Text style={styles.statusText}>
              {status === 'active' ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </Animated.View>

        {/* Main Balance Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(700)}>
          <LinearGradient
            colors={['#0F2847', '#132F5E', '#0F2847']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            {/* Glow effects */}
            <View style={styles.glowTopRight} />
            <View style={styles.glowBottomLeft} />

            <Text style={styles.balanceLabel}>Total Balance</Text>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceCurrency}>$</Text>
              <Text style={styles.balanceAmount}>{totalValue.toFixed(2)}</Text>
              <Text style={styles.balanceSuffix}>USD</Text>
            </View>

            {/* Animated Coin */}
            <Animated.View style={[styles.coinContainer, coinStyle]}>
              <LinearGradient
                colors={['#FFD700', '#FF8F00']}
                style={styles.coinGradient}
              >
                <Text style={styles.coinText}>BRS</Text>
              </LinearGradient>
            </Animated.View>

            {/* BRS + USDT sub-balances */}
            <View style={styles.subBalances}>
              <View style={styles.subBalance}>
                <View style={[styles.subIcon, { backgroundColor: colors.goldSoft }]}>
                  <Ionicons name="logo-bitcoin" size={14} color={colors.gold} />
                </View>
                <View>
                  <Text style={styles.subAmount}>{brs.toLocaleString()} BRS</Text>
                  <Text style={styles.subValue}>≈ ${(brs * 0.005).toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.subDivider} />

              <View style={styles.subBalance}>
                <View style={[styles.subIcon, { backgroundColor: colors.greenSoft }]}>
                  <Ionicons name="cash" size={14} color={colors.green} />
                </View>
                <View>
                  <Text style={styles.subAmount}>${usdt.toFixed(2)} USDT</Text>
                  <Text style={styles.subValue}>BEP-20</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(600)}
          style={styles.actionsRow}
        >
          {quickActions.map((action, i) => (
            <TouchableOpacity key={action.label} style={styles.actionBtn} activeOpacity={0.7}>
              <View style={[styles.actionCircle, { backgroundColor: `${action.color}15` }]}>
                <Ionicons
                  name={action.icon as any}
                  size={26}
                  color={action.color}
                />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Price Ticker */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)}>
          <View style={[glass.card, styles.tickerCard]}>
            <View style={styles.tickerRow}>
              <View style={styles.tickerLeft}>
                <LinearGradient
                  colors={colors.gradientGold as [string, string]}
                  style={styles.tickerIcon}
                >
                  <Text style={styles.tickerIconText}>B</Text>
                </LinearGradient>
                <View>
                  <Text style={styles.tickerName}>BRS / USDT</Text>
                  <Text style={styles.tickerSub}>Bharos Coin</Text>
                </View>
              </View>
              <View style={styles.tickerRight}>
                <Text style={styles.tickerPrice}>$0.005</Text>
                <View style={styles.tickerChange}>
                  <Ionicons name="caret-up" size={12} color={colors.green} />
                  <Text style={styles.tickerPercent}>+4.5%</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={[glass.card, styles.emptyCard]}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((tx, i) => (
              <Animated.View
                key={tx.id}
                entering={FadeInUp.delay(450 + i * 80).duration(500)}
              >
                <View style={[glass.card, styles.txCard]}>
                  <View style={[
                    styles.txIcon,
                    {
                      backgroundColor: tx.amount > 0
                        ? colors.greenSoft
                        : colors.redSoft
                    }
                  ]}>
                    <Ionicons
                      name={tx.amount > 0 ? 'arrow-down' : 'arrow-up'}
                      size={18}
                      color={tx.amount > 0 ? colors.green : colors.red}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txDesc} numberOfLines={1}>
                      {tx.description || 'Transaction'}
                    </Text>
                    <Text style={styles.txCurrency}>{tx.currency || 'BRS'}</Text>
                  </View>
                  <Text style={[
                    styles.txAmount,
                    { color: tx.amount > 0 ? colors.green : colors.red }
                  ]}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency}
                  </Text>
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.cyan,
    fontSize: 18,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  userName: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgGlass,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.bgGlassBorder,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Balance Card
  balanceCard: {
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.15)',
    ...shadows.card,
  },
  glowTopRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.cyanGlow,
    opacity: 0.3,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.goldGlow,
    opacity: 0.3,
  },
  balanceLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  balanceCurrency: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '300',
    marginRight: 2,
  },
  balanceAmount: {
    color: colors.white,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
  },
  balanceSuffix: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },

  // Coin
  coinContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  coinGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow('#FFD700'),
  },
  coinText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Sub balances
  subBalances: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  subBalance: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  subDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: spacing.md,
  },
  subIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subAmount: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  subValue: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  actionBtn: {
    alignItems: 'center',
    width: (width - spacing.xl * 2) / 4 - spacing.sm,
  },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Ticker
  tickerCard: {
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  tickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tickerIconText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
  },
  tickerName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  tickerSub: {
    color: colors.textMuted,
    fontSize: 12,
  },
  tickerRight: {
    alignItems: 'flex-end',
  },
  tickerPrice: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  tickerChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tickerPercent: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '600',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '600',
  },

  // Transactions
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  txCurrency: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Empty
  emptyCard: {
    padding: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.md,
  },
})
