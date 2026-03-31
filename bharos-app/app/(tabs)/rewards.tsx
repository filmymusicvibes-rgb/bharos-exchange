import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { colors, spacing, radius, glass } from '../../lib/theme'

const tiers = [
  { level: 1, name: 'Bronze', color: '#CD7F32', members: '3 Direct', reward: '$2/level', icon: 'shield-half' },
  { level: 2, name: 'Silver', color: '#C0C0C0', members: '3+9', reward: '$30 Bonus', icon: 'shield' },
  { level: 3, name: 'Gold', color: '#FFD700', members: '3+9+27', reward: 'Trip 🌍', icon: 'trophy' },
]

const earnActivities = [
  { icon: 'people', title: 'Earn Rewards', sub: 'Earn ₿ estimate in your earnings', color: colors.cyan },
  { icon: 'layers', title: 'Earn Staking', sub: 'Earn ₿ add bonus/achievements', color: colors.purple },
  { icon: 'gift', title: 'Earn Rewards', sub: 'Earn ₿ rewards for earnings', color: colors.green },
  { icon: 'flash', title: 'Earn Activity', sub: 'Earn ₿ announce for earnings', color: colors.orange },
]

export default function RewardsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={styles.title}>Rewards</Text>
        </Animated.View>

        {/* Staking Rewards Banner */}
        <Animated.View entering={FadeInUp.delay(100).duration(700)}>
          <LinearGradient
            colors={['#132F5E', '#0F2847']}
            style={styles.banner}
          >
            <View style={styles.bannerGlow} />
            <Text style={styles.bannerTitle}>Bharos Rewards Program</Text>
            <Text style={styles.bannerSub}>
              Share your progress rewards according and recommend Bharos Coins.
            </Text>

            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progress Status</Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={colors.gradientCyan as [string, string]}
                  style={[styles.progressFill, { width: '60%' }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressVal}>Progress: 300</Text>
                <Text style={styles.progressVal}>Levels: $60</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Tiers */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <Text style={styles.sectionTitle}>Tiers</Text>
          <View style={styles.tiersRow}>
            {tiers.map((tier, i) => (
              <TouchableOpacity key={tier.level} style={styles.tierCard} activeOpacity={0.8}>
                <LinearGradient
                  colors={[`${tier.color}30`, `${tier.color}08`]}
                  style={styles.tierGrad}
                >
                  <Ionicons name={tier.icon as any} size={28} color={tier.color} />
                  <Text style={styles.tierName}>Tier {tier.level}</Text>
                  <Text style={[styles.tierLevel, { color: tier.color }]}>{tier.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Earning Activities */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)}>
          <Text style={styles.sectionTitle}>Earning Activities</Text>
          {earnActivities.map((act, i) => (
            <Animated.View
              key={i}
              entering={FadeInUp.delay(350 + i * 80).duration(500)}
            >
              <TouchableOpacity activeOpacity={0.7}>
                <View style={[glass.card, styles.activityCard]}>
                  <View style={[styles.actIcon, { backgroundColor: `${act.color}15` }]}>
                    <Ionicons name={act.icon as any} size={22} color={act.color} />
                  </View>
                  <View style={styles.actInfo}>
                    <Text style={styles.actTitle}>{act.title}</Text>
                    <Text style={styles.actSub}>{act.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
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

  // Banner
  banner: {
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.12)',
  },
  bannerGlow: {
    position: 'absolute',
    top: -20, right: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.cyanGlow, opacity: 0.3,
  },
  bannerTitle: { color: colors.white, fontSize: 20, fontWeight: '700' },
  bannerSub: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.sm, lineHeight: 20 },

  progressRow: { marginTop: spacing.xl },
  progressLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: spacing.sm },
  progressBar: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  progressVal: { color: colors.textMuted, fontSize: 11 },

  // Tiers
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: spacing.lg },
  tiersRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl },
  tierCard: { flex: 1 },
  tierGrad: {
    borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tierName: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tierLevel: { fontSize: 14, fontWeight: '700' },

  // Activities
  activityCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, marginBottom: spacing.md,
  },
  actIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  actInfo: { flex: 1 },
  actTitle: { color: colors.white, fontSize: 15, fontWeight: '600' },
  actSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
})
