import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeInDown, FadeInUp, FadeIn,
  useAnimatedStyle, withRepeat, withTiming, useSharedValue,
  withSequence, Easing, withSpring, interpolate, Extrapolation,
} from 'react-native-reanimated'
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg'
import { colors, spacing, radius, neu, shadows, typography } from '../../lib/theme'

const { width } = Dimensions.get('window')

const tiers = [
  {
    level: 1, name: 'Bronze', color: '#CD7F32',
    members: '3 Direct', reward: '$2/level',
    icon: 'shield-half', progress: 0.6,
    description: 'Start your journey',
  },
  {
    level: 2, name: 'Silver', color: '#C0C0C0',
    members: '3+9', reward: '$30 Bonus',
    icon: 'shield', progress: 0.35,
    description: 'Growing network',
  },
  {
    level: 3, name: 'Gold', color: '#FFD700',
    members: '3+9+27', reward: 'Trip 🌍',
    icon: 'trophy', progress: 0.1,
    description: 'Elite rewards',
  },
]

const earnActivities = [
  {
    icon: 'people', title: 'Earn Rewards',
    sub: 'Get your BRS to earn/advocate commissions',
    color: colors.primary, gradient: colors.gradientPrimary,
  },
  {
    icon: 'layers', title: 'Earn Staking',
    sub: 'Earn BRS add bonus/achievements',
    color: colors.purple, gradient: colors.gradientPurple,
  },
  {
    icon: 'rocket', title: 'Earn Missions',
    sub: 'Earn BRS add bonus/achievements',
    color: colors.cyan, gradient: colors.gradientCyan,
  },
  {
    icon: 'flash', title: 'Earn Activity',
    sub: 'Earn BRS announce for earnings',
    color: colors.orange, gradient: ['#FFAB40', '#FF6D00'] as [string, string],
  },
  {
    icon: 'gift', title: 'Earn BRS',
    sub: 'Earn BRS on reward missions',
    color: colors.green, gradient: colors.gradientGreen,
  },
]

// Animated Progress Ring
function ProgressRing({ progress, size, color }: { progress: number, size: number, color: string }) {
  const strokeWidth = 3
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="rgba(255,255,255,0.08)"
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
  )
}

// Floating BRS Coin for Banner
function FloatingCoin() {
  const float = useSharedValue(0)
  const rotate = useSharedValue(0)

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    )
    rotate.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1, false
    )
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float.value },
      { scaleX: interpolate(Math.cos((rotate.value * Math.PI) / 180), [-1, 1], [0.4, 1], Extrapolation.CLAMP) },
    ],
  }))

  return (
    <Animated.View style={[styles.floatingCoin, style]}>
      <LinearGradient colors={['#FFE44D', '#FFD700', '#D4A800']} style={styles.miniCoin}>
        <Text style={styles.miniCoinText}>B</Text>
      </LinearGradient>
    </Animated.View>
  )
}

export default function RewardsScreen() {
  const [selectedTier, setSelectedTier] = useState(1)

  return (
    <LinearGradient colors={colors.gradientScreen} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ━━━ Header ━━━ */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Rewards</Text>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* ━━━ Hero Banner ━━━ */}
        <Animated.View entering={FadeInUp.delay(100).duration(700)}>
          <LinearGradient
            colors={['#0D3B4F', '#0F4A5E', '#0D3B4F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroGlow1} />
            <View style={styles.heroGlow2} />

            {/* Floating coins */}
            <FloatingCoin />

            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Bharos Rewards{'\n'}Program</Text>
              <Text style={styles.heroSub}>
                Share your progress rewards according and recommend Bharos Coins.
              </Text>

              <TouchableOpacity activeOpacity={0.8} style={styles.earnMoreBtn}>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.earnMoreGrad}
                >
                  <Text style={styles.earnMoreText}>Earn more</Text>
                  <Ionicons name="chevron-forward" size={14} color="#000" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Staking Rewards CTA */}
            <View style={styles.stakingCta}>
              <View style={styles.stakingHeader}>
                <Text style={styles.stakingTitle}>Staking Rewards</Text>
                <Text style={styles.stakingApy}>APY 13.3 APYs</Text>
              </View>
              <TouchableOpacity style={styles.stakingLink}>
                <Text style={styles.stakingLinkText}>Earn more</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <Text style={styles.progressTitle}>Progress Status</Text>
              <View style={styles.progressBarBg}>
                <Animated.View entering={FadeIn.delay(500).duration(800)}>
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: '60%' }]}
                  />
                </Animated.View>
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressVal}>Progress: 300</Text>
                <Text style={styles.progressVal}>Levels: $60</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ━━━ Tiers ━━━ */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <Text style={styles.sectionTitle}>Tiers</Text>
          <View style={styles.tiersRow}>
            {tiers.map((tier, i) => (
              <TouchableOpacity
                key={tier.level}
                onPress={() => setSelectedTier(tier.level)}
                style={[
                  styles.tierCard,
                  selectedTier === tier.level && styles.tierCardSelected,
                ]}
                activeOpacity={0.7}
              >
                <Animated.View entering={FadeInUp.delay(250 + i * 80).duration(500)}>
                  <LinearGradient
                    colors={
                      selectedTier === tier.level
                        ? [`${tier.color}40`, `${tier.color}10`]
                        : [`${tier.color}15`, `${tier.color}05`]
                    }
                    style={styles.tierGrad}
                  >
                    {/* Progress Ring */}
                    <View style={styles.tierRingWrap}>
                      <ProgressRing progress={tier.progress} size={52} color={tier.color} />
                      <View style={styles.tierIconWrap}>
                        <Ionicons name={tier.icon as any} size={22} color={tier.color} />
                      </View>
                    </View>

                    <Text style={styles.tierLabel}>Tier {tier.level}</Text>
                    <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>

                    {selectedTier === tier.level && (
                      <View style={styles.tierSelectedDot}>
                        <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                      </View>
                    )}
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ━━━ Earning Activities ━━━ */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)}>
          <Text style={styles.sectionTitle}>Earning Activities</Text>
          {earnActivities.map((act, i) => (
            <Animated.View key={i} entering={FadeInUp.delay(350 + i * 70).duration(500)}>
              <TouchableOpacity activeOpacity={0.7}>
                <View style={styles.actCard}>
                  <LinearGradient
                    colors={act.gradient}
                    style={styles.actIconCircle}
                  >
                    <Ionicons name={act.icon as any} size={20} color="#000" />
                  </LinearGradient>
                  <View style={styles.actInfo}>
                    <Text style={styles.actTitle}>{act.title}</Text>
                    <Text style={styles.actSub}>{act.sub}</Text>
                  </View>
                  <View style={styles.actArrow}>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
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

  // Hero Banner
  heroBanner: {
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.12)',
    marginBottom: spacing.xxl,
    ...shadows.elevated,
  },
  heroGlow1: {
    position: 'absolute',
    top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.primaryGlow, opacity: 0.2,
  },
  heroGlow2: {
    position: 'absolute',
    bottom: -20, left: '40%' as any,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.goldGlow, opacity: 0.15,
  },
  floatingCoin: {
    position: 'absolute',
    top: 18, right: 20,
  },
  miniCoin: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    ...shadows.glow(colors.gold, 0.4),
  },
  miniCoinText: {
    color: '#7B5800', fontSize: 20, fontWeight: '900',
  },
  heroContent: {
    marginBottom: spacing.xl,
    paddingRight: 60,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
    lineHeight: 19,
  },
  earnMoreBtn: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
  earnMoreGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
  earnMoreText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },

  // Staking CTA
  stakingCta: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  stakingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stakingTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  stakingApy: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  stakingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
  },
  stakingLinkText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Progress
  progressSection: {
    marginTop: spacing.sm,
  },
  progressTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  progressVal: {
    color: colors.textMuted,
    fontSize: 11,
  },

  // Section
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },

  // Tiers
  tiersRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  tierCard: {
    flex: 1,
    ...neu.cardSoft,
    overflow: 'hidden',
  },
  tierCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  tierGrad: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 130,
    justifyContent: 'center',
  },
  tierRingWrap: {
    position: 'relative',
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierIconWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  tierName: {
    fontSize: 14,
    fontWeight: '700',
  },
  tierSelectedDot: {
    marginTop: spacing.xs,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Earning Activities
  actCard: {
    ...neu.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  actIconCircle: {
    ...neu.iconCircle,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actInfo: {
    flex: 1,
  },
  actTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  actSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  actArrow: {
    ...neu.iconCircle,
    width: 28, height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
