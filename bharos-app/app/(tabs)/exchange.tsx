import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeInDown, FadeInUp,
  useAnimatedStyle, withSpring, useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { colors, spacing, radius, glass } from '../../lib/theme'

const { width } = Dimensions.get('window')

// Simulated chart data
const chartData = [35, 42, 38, 50, 45, 60, 55, 70, 65, 80, 75, 85, 90, 88, 92]

export default function ExchangeScreen() {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [timeframe, setTimeframe] = useState('1D')

  const timeframes = ['1H', '1D', '1W', '1M', '1Y', 'All']

  const maxVal = Math.max(...chartData)
  const minVal = Math.min(...chartData)
  const chartHeight = 180

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.title}>Exchange</Text>
          <TouchableOpacity style={styles.historyBtn}>
            <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Price Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(700)}>
          <View style={[glass.card, styles.priceCard]}>
            <View style={styles.pairRow}>
              <LinearGradient
                colors={colors.gradientGold as [string, string]}
                style={styles.pairIcon}
              >
                <Text style={styles.pairIconText}>B</Text>
              </LinearGradient>
              <View>
                <Text style={styles.pairName}>BRS / USDT</Text>
                <Text style={styles.pairSub}>Bharos Coin</Text>
              </View>
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.price}>$1.25</Text>
              <View style={styles.changeTag}>
                <Ionicons name="caret-up" size={14} color={colors.green} />
                <Text style={styles.changeText}>+4.5%</Text>
              </View>
            </View>

            <View style={styles.priceSubRow}>
              <Text style={styles.priceDetail}>
                Amount: <Text style={{ color: colors.white }}>100 BRS</Text>
              </Text>
              <Text style={styles.priceDetail}>
                Total: <Text style={{ color: colors.white }}>$125.00 USDT</Text>
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Chart */}
        <Animated.View entering={FadeInUp.delay(200).duration(700)}>
          <View style={[glass.card, styles.chartCard]}>
            {/* Timeframe selector */}
            <View style={styles.timeRow}>
              {timeframes.map(tf => (
                <TouchableOpacity
                  key={tf}
                  onPress={() => setTimeframe(tf)}
                  style={[
                    styles.timeBtn,
                    timeframe === tf && styles.timeBtnActive,
                  ]}
                >
                  <Text style={[
                    styles.timeText,
                    timeframe === tf && styles.timeTextActive,
                  ]}>
                    {tf}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Simple Chart Visualization */}
            <View style={styles.chart}>
              {chartData.map((val, i) => {
                const height = ((val - minVal) / (maxVal - minVal)) * chartHeight
                return (
                  <View key={i} style={styles.barContainer}>
                    <LinearGradient
                      colors={[colors.cyan, colors.cyanDark]}
                      style={[styles.bar, { height: Math.max(height, 4) }]}
                    />
                  </View>
                )
              })}
            </View>

            {/* Chart labels */}
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabel}>Low: $0.80</Text>
              <Text style={styles.chartLabel}>High: $1.35</Text>
              <Text style={styles.chartLabel}>Vol: 2.5M</Text>
            </View>
          </View>
        </Animated.View>

        {/* Buy / Sell Toggle */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              onPress={() => setMode('buy')}
              style={[styles.toggleBtn, mode === 'buy' && styles.toggleActive]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={mode === 'buy' ? ['#00E676', '#00C853'] : ['transparent', 'transparent']}
                style={styles.toggleGrad}
              >
                <Text style={[
                  styles.toggleText,
                  mode === 'buy' && styles.toggleTextActive,
                ]}>
                  BUY
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('sell')}
              style={[styles.toggleBtn, mode === 'sell' && styles.toggleActive]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={mode === 'sell' ? ['#FF1744', '#D50000'] : ['transparent', 'transparent']}
                style={styles.toggleGrad}
              >
                <Text style={[
                  styles.toggleText,
                  mode === 'sell' && styles.toggleTextActive,
                ]}>
                  SELL
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Order Form */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <View style={[glass.card, styles.orderCard]}>
            <Text style={styles.orderTitle}>Order Summary</Text>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={styles.inputSuffix}>BRS</Text>
              </View>
            </View>

            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Price:</Text>
              <Text style={styles.orderValue}>$1.25</Text>
            </View>

            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Total:</Text>
              <Text style={[styles.orderValue, { color: colors.cyan, fontSize: 18 }]}>
                ${((Number(amount) || 100) * 1.25).toFixed(2)} USDT
              </Text>
            </View>

            <TouchableOpacity activeOpacity={0.8}>
              <LinearGradient
                colors={mode === 'buy'
                  ? colors.gradientGreen as [string, string]
                  : ['#FF1744', '#D50000']
                }
                style={styles.confirmBtn}
              >
                <Text style={styles.confirmText}>
                  Confirm {mode === 'buy' ? 'Trade' : 'Sale'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 60 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: { color: colors.white, fontSize: 28, fontWeight: '700' },
  historyBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgGlass,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.bgGlassBorder,
  },

  // Price card
  priceCard: { padding: spacing.xl, marginBottom: spacing.xl },
  pairRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pairIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  pairIconText: { color: '#000', fontSize: 18, fontWeight: '900' },
  pairName: { color: colors.white, fontSize: 16, fontWeight: '700' },
  pairSub: { color: colors.textMuted, fontSize: 12 },
  liveTag: {
    flexDirection: 'row', alignItems: 'center',
    marginLeft: 'auto', gap: 4,
    backgroundColor: 'rgba(0,200,83,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.green,
  },
  liveText: { color: colors.green, fontSize: 11, fontWeight: '700' },
  priceRow: {
    flexDirection: 'row', alignItems: 'baseline',
    marginTop: spacing.lg, gap: spacing.md,
  },
  price: { color: colors.white, fontSize: 36, fontWeight: '700' },
  changeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  changeText: { color: colors.green, fontSize: 13, fontWeight: '700' },
  priceSubRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  priceDetail: { color: colors.textMuted, fontSize: 12 },

  // Chart
  chartCard: { padding: spacing.lg, marginBottom: spacing.xl },
  timeRow: {
    flexDirection: 'row', gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  timeBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  timeBtnActive: {
    backgroundColor: colors.cyanSoft,
  },
  timeText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  timeTextActive: { color: colors.cyan },

  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 180,
    gap: 4,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 3,
    minWidth: 4,
  },
  chartLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  chartLabel: { color: colors.textMuted, fontSize: 11 },

  // Toggle
  toggleRow: {
    flexDirection: 'row', gap: spacing.md,
    marginBottom: spacing.xl,
  },
  toggleBtn: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  toggleActive: {},
  toggleGrad: {
    paddingVertical: spacing.md,
    alignItems: 'center', borderRadius: radius.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  toggleText: {
    color: colors.textMuted, fontSize: 16, fontWeight: '800',
    letterSpacing: 2,
  },
  toggleTextActive: { color: '#fff' },

  // Order
  orderCard: { padding: spacing.xl },
  orderTitle: {
    color: colors.white, fontSize: 18, fontWeight: '700',
    marginBottom: spacing.lg,
  },
  inputRow: { marginBottom: spacing.lg },
  inputLabel: {
    color: colors.textSecondary, fontSize: 13,
    fontWeight: '600', marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1, color: colors.white, fontSize: 18,
    fontWeight: '600', paddingVertical: spacing.md,
  },
  inputSuffix: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  orderLabel: { color: colors.textSecondary, fontSize: 14 },
  orderValue: { color: colors.white, fontSize: 16, fontWeight: '700' },

  confirmBtn: {
    paddingVertical: spacing.lg, borderRadius: radius.lg,
    alignItems: 'center', marginTop: spacing.lg,
  },
  confirmText: {
    color: '#fff', fontSize: 16, fontWeight: '800',
    letterSpacing: 1,
  },
})
