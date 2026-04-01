import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeInDown, FadeInUp, FadeIn,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { colors, spacing, radius, neu, glass, shadows, typography } from '../../lib/theme'

const { width } = Dimensions.get('window')

const stakingOptions = [
  {
    token: 'BRS', pair: 'BRS/USDT', apy: '3.35%',
    color: colors.primary, duration: '30 Days',
    minStake: '100 BRS', gradient: colors.gradientPrimary,
  },
  {
    token: 'BRS', pair: 'BRS/USDT', apy: '7.33%',
    color: colors.cyan, duration: '90 Days',
    minStake: '500 BRS', gradient: colors.gradientCyan,
  },
  {
    token: 'BRS', pair: 'BRS/USDT', apy: '13.27%',
    color: colors.gold, duration: '180 Days',
    minStake: '1,000 BRS', gradient: colors.gradientGold,
  },
]

const myStakes = [
  { pair: 'BRS', staked: '695 BRS', apy: '33%', type: 'Staking' },
  { pair: 'BRS', staked: '1,200 BRS', apy: '7.33%', type: 'Flexible' },
]

// Animated APY Ring
function ApyRing({ apy, size, color }: { apy: number, size: number, color: string }) {
  const progress = Math.min(apy / 20, 1) // Scale to 20% max
  const strokeWidth = 3
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference * progress} ${circumference * (1 - progress)}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <LinearGradient
        colors={[`${color}25`, `${color}08`]}
        style={{ width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text style={{ color, fontSize: size * 0.22, fontWeight: '800' }}>{apy}%</Text>
      </LinearGradient>
    </View>
  )
}

export default function StakingScreen() {
  const [tab, setTab] = useState<'active' | 'unstake'>('active')
  const [calcAmount, setCalcAmount] = useState('1000')
  const [calcDuration, setCalcDuration] = useState(90)

  const calculatedReward = ((Number(calcAmount) || 0) * 0.0733 * calcDuration / 365).toFixed(2)

  // Calculator state is managed above

  return (
    <LinearGradient colors={colors.gradientScreen} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ━━━ Header ━━━ */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Staking</Text>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="analytics-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* ━━━ Tab Toggle ━━━ */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)}>
          <View style={styles.tabRow}>
            {(['active', 'unstake'] as const).map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                activeOpacity={0.8}
              >
                {tab === t ? (
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabBtnGrad}
                  >
                    <Text style={styles.tabTextActive}>
                      {t === 'active' ? 'Active' : 'Unstake'}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabBtnInner}>
                    <Text style={styles.tabText}>
                      {t === 'active' ? 'Active' : 'Unstake'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ━━━ Active Stakes Card ━━━ */}
        <Animated.View entering={FadeInUp.delay(150).duration(700)}>
          <LinearGradient
            colors={['#0D3B4F', '#0F4A5E', '#0D3B4F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeCard}
          >
            <View style={styles.activeGlow1} />
            <View style={styles.activeGlow2} />

            <View style={styles.activeHeader}>
              <View>
                <Text style={styles.activeLabel}>Active Stakes</Text>
                <View style={styles.activeAmountRow}>
                  <Text style={styles.activeAmount}>3,027.47 BRS</Text>
                  <TouchableOpacity style={styles.unstakePill}>
                    <Text style={styles.unstakePillText}>Unstake</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.activeStats}>
              <View style={styles.activeStat}>
                <Text style={styles.activeStatLabel}>Total staked</Text>
                <Text style={styles.activeStatValue}>3,027.47 BRS</Text>
              </View>
              <View style={styles.activeStatDivider} />
              <View style={styles.activeStat}>
                <Text style={styles.activeStatLabel}>Upcoming rewards</Text>
                <Text style={[styles.activeStatValue, { color: colors.primary }]}>8.19 BRS</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ━━━ Staking Options ━━━ */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <Text style={styles.sectionTitle}>Staking Options</Text>
        </Animated.View>

        {stakingOptions.map((opt, i) => (
          <Animated.View key={i} entering={FadeInUp.delay(250 + i * 80).duration(600)}>
            <TouchableOpacity activeOpacity={0.7}>
              <View style={styles.optionCard}>
                <View style={styles.optionLeft}>
                  <ApyRing apy={parseFloat(opt.apy)} size={56} color={opt.color} />
                </View>
                <View style={styles.optionCenter}>
                  <View style={styles.optionNameRow}>
                    <LinearGradient colors={opt.gradient} style={styles.optionMiniCoin}>
                      <Text style={styles.optionMiniText}>B</Text>
                    </LinearGradient>
                    <View>
                      <Text style={styles.optionToken}>{opt.token}</Text>
                      <Text style={styles.optionPair}>{opt.pair}</Text>
                    </View>
                  </View>
                  <View style={styles.optionMeta}>
                    <Text style={styles.optionMetaText}>
                      <Ionicons name="time-outline" size={10} color={colors.textMuted} /> {opt.duration}
                    </Text>
                    <Text style={styles.optionMetaText}>Min: {opt.minStake}</Text>
                  </View>
                </View>
                <View style={styles.optionRight}>
                  <Text style={[styles.optionApy, { color: opt.color }]}>{opt.apy}</Text>
                  <Text style={styles.optionApyLabel}>APY</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* ━━━ My Stakes ━━━ */}
        <Animated.View entering={FadeInUp.delay(500).duration(600)}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>My Stakes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.myStakesTabs}>
            {['Devotion', 'Staking', 'Positive'].map((t, i) => (
              <TouchableOpacity
                key={t}
                style={[styles.myStakeTab, i === 1 && styles.myStakeTabActive]}
              >
                <Text style={[styles.myStakeTabText, i === 1 && styles.myStakeTabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {myStakes.map((stake, i) => (
            <Animated.View key={i} entering={FadeInUp.delay(550 + i * 80).duration(500)}>
              <View style={styles.myStakeCard}>
                <LinearGradient colors={colors.gradientGold} style={styles.myStakeIcon}>
                  <Text style={styles.myStakeIconText}>B</Text>
                </LinearGradient>
                <View style={styles.myStakeInfo}>
                  <Text style={styles.myStakeToken}>BRS</Text>
                  <Text style={styles.myStakeType}>{stake.type}</Text>
                </View>
                <View style={styles.myStakeRight}>
                  <Text style={styles.myStakeStaked}>{stake.staked}</Text>
                  <Text style={styles.myStakeApy}>{stake.apy} APY</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.View>

        {/* ━━━ Rewards Calculator ━━━ */}
        <Animated.View entering={FadeInUp.delay(700).duration(600)}>
          <Text style={styles.sectionTitle}>Rewards Calculator</Text>
          <View style={styles.calcCard}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Stake Amount</Text>
              <View style={styles.calcInputWrap}>
                <TextInput
                  style={styles.calcInput}
                  value={calcAmount}
                  onChangeText={setCalcAmount}
                  keyboardType="numeric"
                  placeholder="1000"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.calcSuffix}>BRS</Text>
              </View>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Duration</Text>
              <View style={styles.calcDurations}>
                {[30, 90, 180].map(d => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setCalcDuration(d)}
                    style={[styles.calcDurBtn, calcDuration === d && styles.calcDurBtnActive]}
                  >
                    <Text style={[styles.calcDurText, calcDuration === d && styles.calcDurTextActive]}>
                      {d}D
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.calcDivider} />

            <View style={styles.calcResult}>
              <Text style={styles.calcResultLabel}>Estimated Reward</Text>
              <View style={styles.calcResultRow}>
                <Text style={styles.calcResultValue}>{calculatedReward}</Text>
                <Text style={styles.calcResultUnit}>BRS</Text>
              </View>
              <Text style={styles.calcResultUsd}>
                ≈ ${(Number(calculatedReward) * 3.37).toFixed(2)} USD
              </Text>
            </View>

            <TouchableOpacity activeOpacity={0.8}>
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.stakeNowBtn}
              >
                <Ionicons name="lock-closed" size={16} color="#000" />
                <Text style={styles.stakeNowText}>Stake Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ━━━ Upcoming Rewards ━━━ */}
        <Animated.View entering={FadeInUp.delay(800).duration(600)}>
          <Text style={styles.sectionTitle}>Upcoming Rewards</Text>
          <View style={styles.upcomingCard}>
            {[
              { label: 'Staking Reward', amount: '0.01134 BRS', time: 'In 2 hours' },
              { label: 'Monthly Bonus', amount: '2.50 BRS', time: 'In 3 days' },
              { label: 'Lock Bonus', amount: '5.00 BRS', time: 'Apr 15, 2026' },
            ].map((reward, i) => (
              <View key={i} style={[styles.upcomingRow, i < 2 && styles.upcomingRowBorder]}>
                <View style={styles.upcomingDot}>
                  <View style={[styles.upcomingDotInner, { backgroundColor: i === 0 ? colors.primary : colors.textMuted }]} />
                  {i < 2 && <View style={styles.upcomingLine} />}
                </View>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingLabel}>{reward.label}</Text>
                  <Text style={styles.upcomingTime}>{reward.time}</Text>
                </View>
                <Text style={styles.upcomingAmount}>{reward.amount}</Text>
              </View>
            ))}
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
  headerIconBtn: {
    ...neu.iconCircle,
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },

  // Tabs
  tabRow: {
    ...neu.inset,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
    padding: spacing.xs,
  },
  tabBtn: { flex: 1, borderRadius: radius.md, overflow: 'hidden' },
  tabBtnActive: {},
  tabBtnGrad: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabBtnInner: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: '#000', fontSize: 14, fontWeight: '700' },

  // Active Stakes
  activeCard: {
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.12)',
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    ...shadows.elevated,
  },
  activeGlow1: {
    position: 'absolute', top: -30, right: -30,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.primaryGlow, opacity: 0.2,
  },
  activeGlow2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.cyanGlow, opacity: 0.1,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  activeLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  activeAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  activeAmount: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  unstakePill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unstakePillText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  activeStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  activeStat: { flex: 1, alignItems: 'center' },
  activeStatLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  activeStatValue: { color: colors.white, fontSize: 14, fontWeight: '700' },
  activeStatDivider: {
    width: 1, height: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Section
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  seeAll: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Staking Options
  optionCard: {
    ...neu.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  optionLeft: { marginRight: spacing.md },
  optionCenter: { flex: 1 },
  optionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  optionMiniCoin: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  optionMiniText: { color: '#000', fontSize: 11, fontWeight: '900' },
  optionToken: { color: colors.white, fontSize: 15, fontWeight: '700' },
  optionPair: { color: colors.textMuted, fontSize: 11 },
  optionMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  optionMetaText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  optionRight: { alignItems: 'flex-end' },
  optionApy: { fontSize: 20, fontWeight: '800' },
  optionApyLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },

  // My Stakes
  myStakesTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  myStakeTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  myStakeTabActive: {
    backgroundColor: colors.primarySoft,
  },
  myStakeTabText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  myStakeTabTextActive: { color: colors.primary },

  myStakeCard: {
    ...neu.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  myStakeIcon: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  myStakeIconText: { color: '#000', fontSize: 14, fontWeight: '900' },
  myStakeInfo: { flex: 1 },
  myStakeToken: { color: colors.white, fontSize: 15, fontWeight: '700' },
  myStakeType: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  myStakeRight: { alignItems: 'flex-end' },
  myStakeStaked: { color: colors.white, fontSize: 14, fontWeight: '600' },
  myStakeApy: { color: colors.primary, fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Calculator
  calcCard: {
    ...neu.card,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  calcLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  calcInputWrap: {
    ...neu.inset,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    minWidth: 140,
  },
  calcInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: spacing.sm,
    textAlign: 'right',
  },
  calcSuffix: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  calcDurations: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  calcDurBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  calcDurBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  calcDurText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  calcDurTextActive: { color: colors.primary },
  calcDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: spacing.md,
  },
  calcResult: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  calcResultLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  calcResultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  calcResultValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  calcResultUnit: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  calcResultUsd: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  stakeNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
  stakeNowText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },

  // Upcoming
  upcomingCard: {
    ...neu.card,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  upcomingRowBorder: {},
  upcomingDot: {
    width: 20,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  upcomingDotInner: {
    width: 8, height: 8, borderRadius: 4,
  },
  upcomingLine: {
    width: 1, height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 4,
  },
  upcomingInfo: { flex: 1 },
  upcomingLabel: { color: colors.white, fontSize: 14, fontWeight: '600' },
  upcomingTime: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  upcomingAmount: { color: colors.primary, fontSize: 13, fontWeight: '700' },
})
