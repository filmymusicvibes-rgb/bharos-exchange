import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeInDown, FadeInUp, FadeIn,
  useAnimatedStyle, withSpring, useSharedValue,
  withTiming, SlideInRight,
} from 'react-native-reanimated'
import Svg, { Rect, Line, Path, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText } from 'react-native-svg'
import { colors, spacing, radius, neu, shadows, typography } from '../../lib/theme'

const { width } = Dimensions.get('window')
const CHART_WIDTH = width - spacing.xl * 2 - spacing.lg * 2
const CHART_HEIGHT = 200

// Simulated OHLC candlestick data (BRS at $0.0055 range)
const candleData = [
  { o: 0.0048, h: 0.0052, l: 0.0046, c: 0.0050, v: 23000 },
  { o: 0.0050, h: 0.0054, l: 0.0049, c: 0.0053, v: 25000 },
  { o: 0.0053, h: 0.0055, l: 0.0050, c: 0.0051, v: 18000 },
  { o: 0.0051, h: 0.0056, l: 0.0050, c: 0.0055, v: 28000 },
  { o: 0.0055, h: 0.0057, l: 0.0053, c: 0.0054, v: 15000 },
  { o: 0.0054, h: 0.0058, l: 0.0052, c: 0.0057, v: 35000 },
  { o: 0.0057, h: 0.0059, l: 0.0055, c: 0.0056, v: 20000 },
  { o: 0.0056, h: 0.0060, l: 0.0054, c: 0.0059, v: 42000 },
  { o: 0.0059, h: 0.0061, l: 0.0057, c: 0.0058, v: 18000 },
  { o: 0.0058, h: 0.0062, l: 0.0056, c: 0.0061, v: 30000 },
  { o: 0.0061, h: 0.0063, l: 0.0059, c: 0.0060, v: 22000 },
  { o: 0.0060, h: 0.0064, l: 0.0058, c: 0.0063, v: 38000 },
  { o: 0.0063, h: 0.0065, l: 0.0061, c: 0.0062, v: 25000 },
  { o: 0.0062, h: 0.0066, l: 0.0060, c: 0.0064, v: 32000 },
  { o: 0.0064, h: 0.0067, l: 0.0062, c: 0.0063, v: 28000 },
  { o: 0.0063, h: 0.0066, l: 0.0061, c: 0.0065, v: 35000 },
  { o: 0.0065, h: 0.0068, l: 0.0063, c: 0.0064, v: 20000 },
  { o: 0.0064, h: 0.0067, l: 0.0062, c: 0.0066, v: 40000 },
  { o: 0.0066, h: 0.0069, l: 0.0064, c: 0.0065, v: 22000 },
  { o: 0.0065, h: 0.0070, l: 0.0063, c: 0.0055, v: 45000 },
]

// Order book data
const orderBookBids = [
  { price: 0.005490, amount: 2050, total: 11.25 },
  { price: 0.005480, amount: 1750, total: 9.59 },
  { price: 0.005470, amount: 3150, total: 17.23 },
  { price: 0.005460, amount: 1450, total: 7.92 },
  { price: 0.005450, amount: 2900, total: 15.81 },
  { price: 0.005440, amount: 1100, total: 5.98 },
  { price: 0.005430, amount: 800, total: 4.34 },
]

const orderBookAsks = [
  { price: 0.005500, amount: 1850, total: 10.18 },
  { price: 0.005510, amount: 2350, total: 12.95 },
  { price: 0.005520, amount: 1650, total: 9.11 },
  { price: 0.005530, amount: 3050, total: 16.87 },
  { price: 0.005540, amount: 1200, total: 6.65 },
  { price: 0.005550, amount: 950, total: 5.27 },
  { price: 0.005560, amount: 1500, total: 8.34 },
]

// Candlestick Chart Component
function CandlestickChart() {
  const allPrices = candleData.flatMap(d => [d.h, d.l])
  const minPrice = Math.min(...allPrices)
  const maxPrice = Math.max(...allPrices)
  const priceRange = maxPrice - minPrice
  const maxVol = Math.max(...candleData.map(d => d.v))

  const candleWidth = (CHART_WIDTH - 10) / candleData.length
  const gap = candleWidth * 0.25
  const bodyWidth = candleWidth - gap

  const yScale = (price: number) => {
    return CHART_HEIGHT - 20 - ((price - minPrice) / priceRange) * (CHART_HEIGHT - 40)
  }

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 40} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 40}`}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const price = minPrice + priceRange * frac
        const y = yScale(price)
        return (
          <Line key={i} x1={0} y1={y} x2={CHART_WIDTH} y2={y}
            stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="4 4" />
        )
      })}

      {/* Price labels */}
      {[0, 0.5, 1].map((frac, i) => {
        const price = minPrice + priceRange * frac
        const y = yScale(price)
        return (
          <SvgText key={`label-${i}`} x={CHART_WIDTH - 2} y={y - 3}
            fill="rgba(255,255,255,0.35)" fontSize={8} textAnchor="end">
            ${price.toFixed(4)}
          </SvgText>
        )
      })}

      {/* Volume bars */}
      {candleData.map((d, i) => {
        const x = i * candleWidth + gap / 2
        const volHeight = (d.v / maxVol) * 30
        const isGreen = d.c >= d.o
        return (
          <Rect key={`vol-${i}`}
            x={x} y={CHART_HEIGHT + 10 - volHeight}
            width={bodyWidth} height={volHeight}
            rx={1}
            fill={isGreen ? 'rgba(0,230,118,0.15)' : 'rgba(255,71,87,0.15)'}
          />
        )
      })}

      {/* Candles */}
      {candleData.map((d, i) => {
        const x = i * candleWidth + gap / 2
        const centerX = x + bodyWidth / 2
        const openY = yScale(d.o)
        const closeY = yScale(d.c)
        const highY = yScale(d.h)
        const lowY = yScale(d.l)
        const isGreen = d.c >= d.o
        const bodyTop = Math.min(openY, closeY)
        const bodyHeight = Math.max(Math.abs(closeY - openY), 1.5)
        const candleColor = isGreen ? colors.green : colors.red

        return (
          <Animated.View key={`candle-${i}`}>
            {/* Wick */}
            <Line
              x1={centerX} y1={highY} x2={centerX} y2={lowY}
              stroke={candleColor} strokeWidth={1}
            />
            {/* Body */}
            <Rect
              x={x} y={bodyTop}
              width={bodyWidth} height={bodyHeight}
              rx={1.5}
              fill={isGreen ? candleColor : candleColor}
              opacity={isGreen ? 1 : 0.85}
            />
          </Animated.View>
        )
      })}
    </Svg>
  )
}

export default function ExchangeScreen() {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [timeframe, setTimeframe] = useState('1D')
  const [orderView, setOrderView] = useState<'book' | 'trades'>('book')

  const timeframes = ['1H', '1D', '1W', '1M', '1Y', 'All']
  const currentPrice = 0.0055
  const priceChange = '+4.56%'

  return (
    <LinearGradient colors={colors.gradientScreen} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ━━━ Header ━━━ */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Exchange</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ━━━ Trading Pair ━━━ */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)}>
          <View style={styles.pairCard}>
            <View style={styles.pairLeft}>
              <LinearGradient colors={colors.gradientGold} style={styles.pairIcon}>
                <Text style={styles.pairIconText}>B</Text>
              </LinearGradient>
              <View>
                <View style={styles.pairNameRow}>
                  <Text style={styles.pairName}>BRS/USDT</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                </View>
                <Text style={styles.pairSub}>Bharos Coin</Text>
              </View>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          {/* Price Display */}
          <View style={styles.priceDisplay}>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>${currentPrice.toFixed(4)}</Text>
              <View style={styles.changePill}>
                <Ionicons name="caret-up" size={12} color={colors.green} />
                <Text style={styles.changeAmount}>{priceChange}</Text>
              </View>
            </View>
            <View style={styles.ohlcRow}>
              <Text style={styles.ohlcItem}>
                H <Text style={styles.ohlcValue}>$3.90</Text>
              </Text>
              <Text style={styles.ohlcItem}>
                L <Text style={styles.ohlcValue}>$3.05</Text>
              </Text>
              <Text style={styles.ohlcItem}>
                O <Text style={styles.ohlcValue}>$3.10</Text>
              </Text>
              <Text style={styles.ohlcItem}>
                Vol <Text style={styles.ohlcValue}>2.5M</Text>
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ━━━ Candlestick Chart ━━━ */}
        <Animated.View entering={FadeInUp.delay(200).duration(700)}>
          <View style={styles.chartCard}>
            {/* Timeframe selector */}
            <View style={styles.timeRow}>
              {timeframes.map(tf => (
                <TouchableOpacity
                  key={tf}
                  onPress={() => setTimeframe(tf)}
                  style={[styles.timeBtn, timeframe === tf && styles.timeBtnActive]}
                >
                  <Text style={[styles.timeText, timeframe === tf && styles.timeTextActive]}>
                    {tf}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart */}
            <View style={styles.chartContainer}>
              <CandlestickChart />
            </View>
          </View>
        </Animated.View>

        {/* ━━━ Order Book ━━━ */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)}>
          <View style={styles.orderBookCard}>
            <View style={styles.obHeader}>
              <Text style={styles.obTitle}>Order Book</Text>
              <View style={styles.obTabs}>
                {(['book', 'trades'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setOrderView(t)}
                    style={[styles.obTab, orderView === t && styles.obTabActive]}
                  >
                    <Text style={[styles.obTabText, orderView === t && styles.obTabTextActive]}>
                      {t === 'book' ? 'Order Book' : 'Trades'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Column headers */}
            <View style={styles.obColumns}>
              <Text style={styles.obColText}>Price</Text>
              <Text style={styles.obColText}>Amount</Text>
              <Text style={styles.obColText}>Total</Text>
            </View>

            {/* Asks (top, red) */}
            {[...orderBookAsks].reverse().map((ask, i) => (
              <View key={`ask-${i}`} style={styles.obRow}>
                <View style={[styles.obDepthBar, styles.obDepthAsk, {
                  width: `${(ask.total / 12) * 100}%`
                }]} />
                <Text style={[styles.obPrice, { color: colors.red }]}>
                  {ask.price.toFixed(6)}
                </Text>
                <Text style={styles.obAmount}>{ask.amount.toLocaleString()}</Text>
                <Text style={styles.obTotal}>{ask.total.toFixed(2)}</Text>
              </View>
            ))}

            {/* Spread / Current Price */}
            <View style={styles.obSpread}>
              <Text style={styles.obSpreadPrice}>${currentPrice.toFixed(4)}</Text>
              <Text style={styles.obSpreadLabel}>Spread: $0.0001</Text>
            </View>

            {/* Bids (bottom, green) */}
            {orderBookBids.map((bid, i) => (
              <View key={`bid-${i}`} style={styles.obRow}>
                <View style={[styles.obDepthBar, styles.obDepthBid, {
                  width: `${(bid.total / 12) * 100}%`
                }]} />
                <Text style={[styles.obPrice, { color: colors.green }]}>
                  {bid.price.toFixed(6)}
                </Text>
                <Text style={styles.obAmount}>{bid.amount.toLocaleString()}</Text>
                <Text style={styles.obTotal}>{bid.total.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ━━━ Buy / Sell Toggle ━━━ */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <View style={styles.bsToggle}>
            <TouchableOpacity
              onPress={() => setMode('buy')}
              style={[styles.bsBtn, mode === 'buy' && styles.bsBtnBuyActive]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={mode === 'buy' ? (colors.gradientGreen) : ['transparent', 'transparent']}
                style={styles.bsBtnGrad}
              >
                <Text style={[styles.bsBtnText, mode === 'buy' && styles.bsBtnTextActive]}>
                  Buy
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode('sell')}
              style={[styles.bsBtn, mode === 'sell' && styles.bsBtnSellActive]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={mode === 'sell' ? (colors.gradientRed) : ['transparent', 'transparent']}
                style={styles.bsBtnGrad}
              >
                <Text style={[styles.bsBtnText, mode === 'sell' && styles.bsBtnTextActive]}>
                  Sell
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ━━━ Order Form ━━━ */}
        <Animated.View entering={FadeInUp.delay(500).duration(600)}>
          <View style={styles.orderForm}>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>From</Text>
              <View style={styles.formInputWrap}>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                <TouchableOpacity style={styles.tokenBadge}>
                  <Text style={styles.tokenBadgeText}>
                    {mode === 'buy' ? 'USDT' : 'BRS'}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.formBalance}>
                Balance: {mode === 'buy' ? '$1,250.00' : '12,500 BRS'}
              </Text>
            </View>

            {/* Swap indicator */}
            <View style={styles.swapRow}>
              <View style={styles.swapLine} />
              <TouchableOpacity style={styles.swapBtn}>
                <Ionicons name="swap-vertical" size={18} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.swapLine} />
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>To</Text>
              <View style={styles.formInputWrap}>
                <Text style={styles.formOutput}>
                  {amount ? (Number(amount) / currentPrice).toFixed(2) : '0.00'}
                </Text>
                <TouchableOpacity style={styles.tokenBadge}>
                  <Text style={styles.tokenBadgeText}>
                    {mode === 'buy' ? 'BRS' : 'USDT'}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Summary */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price:</Text>
              <Text style={styles.summaryValue}>${currentPrice.toFixed(4)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total:</Text>
              <Text style={[styles.summaryValue, { color: colors.primary, fontSize: 16 }]}>
                ${((Number(amount) || 0)).toFixed(2)} USDT
              </Text>
            </View>

            {/* CTA Button */}
            <TouchableOpacity activeOpacity={0.8} style={styles.ctaWrap}>
              <LinearGradient
                colors={mode === 'buy' ? colors.gradientGreen : colors.gradientRed}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaBtn}
              >
                <Text style={styles.ctaText}>
                  {mode === 'buy' ? 'Buy Now' : 'Sell Now'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

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
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  backBtn: {
    ...neu.iconCircle,
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    flex: 1,
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerIconBtn: {
    ...neu.iconCircle,
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },

  // Pair
  pairCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pairLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pairIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  pairIconText: { color: '#000', fontSize: 18, fontWeight: '900' },
  pairNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pairName: { color: colors.white, fontSize: 18, fontWeight: '700' },
  pairSub: { color: colors.textMuted, fontSize: 12 },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,230,118,0.12)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.full,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.green,
  },
  liveText: { color: colors.green, fontSize: 11, fontWeight: '700' },

  // Price Display
  priceDisplay: {
    marginBottom: spacing.xl,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
  },
  currentPrice: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.sm,
  },
  changeAmount: { color: colors.green, fontSize: 13, fontWeight: '700' },
  ohlcRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  ohlcItem: {
    color: colors.textMuted,
    fontSize: 11,
  },
  ohlcValue: {
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Chart
  chartCard: {
    ...neu.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  timeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
  },
  timeBtnActive: {
    backgroundColor: colors.primarySoft,
  },
  timeText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  timeTextActive: { color: colors.primary },
  chartContainer: {
    alignItems: 'center',
  },

  // Order Book
  orderBookCard: {
    ...neu.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  obHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  obTitle: { color: colors.white, fontSize: 16, fontWeight: '700' },
  obTabs: { flexDirection: 'row', gap: spacing.xs },
  obTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.sm,
  },
  obTabActive: { backgroundColor: colors.primarySoft },
  obTabText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  obTabTextActive: { color: colors.primary },
  obColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  obColText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    flex: 1,
  },
  obRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: spacing.xs,
    position: 'relative',
    overflow: 'hidden',
  },
  obDepthBar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  obDepthBid: { backgroundColor: 'rgba(0,230,118,0.08)' },
  obDepthAsk: { backgroundColor: 'rgba(255,71,87,0.08)' },
  obPrice: { fontSize: 12, fontWeight: '600', flex: 1 },
  obAmount: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  obTotal: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  obSpread: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,212,170,0.06)',
    marginVertical: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  obSpreadPrice: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  obSpreadLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },

  // Buy/Sell Toggle
  bsToggle: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  bsBtn: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  bsBtnBuyActive: {},
  bsBtnSellActive: {},
  bsBtnGrad: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bsBtnText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bsBtnTextActive: { color: '#fff' },

  // Order Form
  orderForm: {
    ...neu.card,
    padding: spacing.xl,
  },
  formRow: {
    marginBottom: spacing.sm,
  },
  formLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  formInputWrap: {
    ...neu.inset,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  formInput: {
    flex: 1,
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: spacing.md,
  },
  formOutput: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: spacing.md,
  },
  formBalance: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
  },
  tokenBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  swapLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  swapBtn: {
    ...neu.iconCircle,
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  summaryLabel: { color: colors.textTertiary, fontSize: 13 },
  summaryValue: { color: colors.white, fontSize: 14, fontWeight: '700' },
  ctaWrap: { marginTop: spacing.xl },
  ctaBtn: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
})
