import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { colors, spacing, radius, glass, shadows } from '../../lib/theme'

const stakingOptions = [
  { token: 'BRS', pair: 'BRS/USDT', apy: '3.35%', color: colors.cyan },
  { token: 'BRS', pair: 'BRS/USDT', apy: '7.33%', color: colors.green },
  { token: 'BRS', pair: 'BRS/USDT', apy: '13.27%', color: colors.gold },
]

export default function StakingScreen() {
  const [tab, setTab] = useState<'active' | 'unstake'>('active')

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={styles.title}>Staking</Text>
        </Animated.View>

        {/* Tab Toggle */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.tabRow}>
          {(['active', 'unstake'] as const).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'active' ? 'Active' : 'Unstake'}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Staking Options */}
        <Animated.View entering={FadeInUp.delay(150).duration(600)}>
          <Text style={styles.sectionTitle}>Staking Options</Text>
        </Animated.View>

        {stakingOptions.map((opt, i) => (
          <Animated.View key={i} entering={FadeInUp.delay(200 + i * 100).duration(600)}>
            <View style={[glass.card, styles.optionCard]}>
              <View style={styles.optionRow}>
                <View style={styles.optionLeft}>
                  <LinearGradient
                    colors={colors.gradientGold as [string, string]}
                    style={styles.optionIcon}
                  >
                    <Text style={styles.optionIconText}>B</Text>
                  </LinearGradient>
                  <View>
                    <Text style={styles.optionToken}>{opt.token}</Text>
                    <Text style={styles.optionPair}>{opt.pair}</Text>
                  </View>
                </View>
                <View style={styles.optionRight}>
                  <Text style={[styles.optionApy, { color: opt.color }]}>{opt.apy}</Text>
                  <Text style={styles.optionApyLabel}>APYs</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ))}

        {/* My Stakes Summary */}
        <Animated.View entering={FadeInUp.delay(500).duration(600)}>
          <Text style={styles.sectionTitle}>My Stakes</Text>
          <LinearGradient
            colors={['#132F5E', '#0F2847']}
            style={styles.stakeCard}
          >
            <View style={styles.stakeGlow} />

            <View style={styles.stakeHeader}>
              <View>
                <Text style={styles.stakeLabel}>Total staked BRS</Text>
                <Text style={styles.stakeAmount}>6,0276 BRS</Text>
              </View>
              <View style={styles.stakeBadge}>
                <Ionicons name="lock-closed" size={16} color={colors.cyan} />
              </View>
            </View>

            <View style={styles.stakeStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Staking</Text>
                <Text style={styles.statValue}>0.01134 BRS</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Rewards</Text>
                <Text style={styles.statValue}>0.00 BRS</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Upcoming</Text>
                <Text style={styles.statValue}>0.0002 BRS</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.stakeActions}>
              <TouchableOpacity style={styles.stakeBtn} activeOpacity={0.8}>
                <LinearGradient
                  colors={colors.gradientCyan as [string, string]}
                  style={styles.stakeBtnGrad}
                >
                  <Text style={styles.stakeBtnText}>Stake</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.stakeBtn} activeOpacity={0.8}>
                <View style={styles.unstakeBtn}>
                  <Text style={styles.unstakeBtnText}>Unstake</Text>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Rewards Calculator */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)}>
          <View style={[glass.card, styles.calcCard]}>
            <Text style={styles.calcTitle}>Rewards Calculator</Text>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Used APY</Text>
              <View style={styles.calcInput}>
                <Text style={styles.calcValue}>100</Text>
              </View>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Reward Rewards</Text>
              <View style={styles.calcInput}>
                <Text style={styles.calcValue}>1000</Text>
              </View>
            </View>
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
  title: { color: colors.white, fontSize: 28, fontWeight: '700', marginBottom: spacing.xl },

  // Tab
  tabRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl },
  tabBtn: {
    flex: 1, paddingVertical: spacing.md, alignItems: 'center',
    borderRadius: radius.lg, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabBtnActive: {
    backgroundColor: colors.cyanSoft,
    borderColor: colors.cyan,
  },
  tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: colors.cyan },

  sectionTitle: {
    color: colors.white, fontSize: 18, fontWeight: '700',
    marginBottom: spacing.lg, marginTop: spacing.md,
  },

  // Options
  optionCard: {
    padding: spacing.lg, marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionIcon: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  optionIconText: { color: '#000', fontSize: 14, fontWeight: '900' },
  optionToken: { color: colors.white, fontSize: 15, fontWeight: '700' },
  optionPair: { color: colors.textMuted, fontSize: 12 },
  optionRight: { alignItems: 'flex-end' },
  optionApy: { fontSize: 18, fontWeight: '800' },
  optionApyLabel: { color: colors.textMuted, fontSize: 11 },

  // Stake Card
  stakeCard: {
    borderRadius: radius.xxl, padding: spacing.xxl,
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.12)',
    overflow: 'hidden', marginBottom: spacing.xxl,
  },
  stakeGlow: {
    position: 'absolute', top: -30, right: -30,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.cyanGlow, opacity: 0.25,
  },
  stakeHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.xl,
  },
  stakeLabel: { color: colors.textSecondary, fontSize: 13 },
  stakeAmount: { color: colors.white, fontSize: 24, fontWeight: '700', marginTop: 4 },
  stakeBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.cyanSoft,
    justifyContent: 'center', alignItems: 'center',
  },

  stakeStats: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statItem: { alignItems: 'center' },
  statLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  statValue: { color: colors.white, fontSize: 13, fontWeight: '600' },

  stakeActions: { flexDirection: 'row', gap: spacing.md },
  stakeBtn: { flex: 1 },
  stakeBtnGrad: {
    paddingVertical: spacing.md, borderRadius: radius.lg,
    alignItems: 'center',
  },
  stakeBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },
  unstakeBtn: {
    paddingVertical: spacing.md, borderRadius: radius.lg,
    alignItems: 'center', borderWidth: 1.5,
    borderColor: colors.cyan,
  },
  unstakeBtnText: { color: colors.cyan, fontSize: 14, fontWeight: '800' },

  // Calculator
  calcCard: { padding: spacing.xl },
  calcTitle: { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: spacing.lg },
  calcRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.lg,
  },
  calcLabel: { color: colors.textSecondary, fontSize: 13 },
  calcInput: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: radius.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  calcValue: { color: colors.white, fontSize: 15, fontWeight: '600' },
})
