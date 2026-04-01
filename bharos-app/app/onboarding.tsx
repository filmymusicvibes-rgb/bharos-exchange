import { useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated'
import Svg, { Circle, Path, Rect, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg'
import { colors, spacing, radius, neu, shadows } from '../lib/theme'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width, height } = Dimensions.get('window')

// SVG Illustrations for each slide
function WalletIllustration() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Defs>
        <SvgGradient id="walletGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.primary} />
          <Stop offset="1" stopColor={colors.primaryDark} />
        </SvgGradient>
        <SvgGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE44D" />
          <Stop offset="1" stopColor="#FFD700" />
        </SvgGradient>
      </Defs>
      {/* Card shape */}
      <Rect x="30" y="55" width="140" height="90" rx="16" fill="url(#walletGrad)" opacity="0.9" />
      <Rect x="45" y="75" width="60" height="8" rx="4" fill="rgba(0,0,0,0.2)" />
      <Rect x="45" y="90" width="40" height="6" rx="3" fill="rgba(0,0,0,0.15)" />
      {/* Coin */}
      <Circle cx="145" cy="60" r="25" fill="url(#goldGrad)" />
      <Circle cx="145" cy="60" r="18" fill="none" stroke="rgba(123,88,0,0.4)" strokeWidth="2" />
      <Path d="M140 53 L140 67 M145 50 L145 70 M150 53 L150 67" stroke="rgba(123,88,0,0.6)" strokeWidth="2" strokeLinecap="round" />
      {/* Stars */}
      <Circle cx="55" cy="45" r="3" fill={colors.gold} opacity="0.5" />
      <Circle cx="170" cy="130" r="2" fill={colors.primary} opacity="0.4" />
      <Circle cx="35" cy="120" r="2.5" fill={colors.cyan} opacity="0.5" />
    </Svg>
  )
}

function TradeIllustration() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Defs>
        <SvgGradient id="chartGrad" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={colors.primary} stopOpacity="0" />
          <Stop offset="1" stopColor={colors.primary} stopOpacity="0.3" />
        </SvgGradient>
      </Defs>
      {/* Chart background */}
      <Rect x="25" y="40" width="150" height="120" rx="12" fill="rgba(0,212,170,0.08)" />
      {/* Grid lines */}
      <Path d="M40 70 L160 70 M40 100 L160 100 M40 130 L160 130" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      {/* Chart area fill */}
      <Path d="M40 130 L60 110 L80 120 L100 80 L120 90 L140 60 L160 70 L160 140 L40 140 Z" fill="url(#chartGrad)" />
      {/* Chart line */}
      <Path d="M40 130 L60 110 L80 120 L100 80 L120 90 L140 60 L160 70" stroke={colors.primary} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dot at end */}
      <Circle cx="160" cy="70" r="5" fill={colors.primary} />
      <Circle cx="160" cy="70" r="8" fill={colors.primary} opacity="0.3" />
      {/* Arrows */}
      <Path d="M80 45 L90 35 L100 45" stroke={colors.green} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M115 45 L125 55 L135 45" stroke={colors.red} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Svg>
  )
}

function SecureIllustration() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      <Defs>
        <SvgGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.primary} />
          <Stop offset="1" stopColor={colors.primaryDark} />
        </SvgGradient>
      </Defs>
      {/* Shield */}
      <Path d="M100 30 L155 55 L155 110 C155 140 130 165 100 175 C70 165 45 140 45 110 L45 55 Z" fill="url(#shieldGrad)" opacity="0.9" />
      <Path d="M100 40 L148 62 L148 108 C148 135 126 158 100 167 C74 158 52 135 52 108 L52 62 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      {/* Checkmark */}
      <Path d="M80 105 L95 120 L125 85" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Lock icon */}
      <Rect x="88" y="130" width="24" height="18" rx="4" fill="rgba(255,255,255,0.2)" />
      <Path d="M94 130 L94 124 C94 118 106 118 106 124 L106 130" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
      {/* Particles */}
      <Circle cx="35" cy="80" r="3" fill={colors.gold} opacity="0.4" />
      <Circle cx="165" cy="90" r="2" fill={colors.cyan} opacity="0.5" />
      <Circle cx="60" cy="170" r="2.5" fill={colors.primary} opacity="0.3" />
    </Svg>
  )
}

const slides = [
  {
    id: '1',
    title: 'Welcome to Bharos',
    subtitle: 'Your Premium\nCrypto Wallet',
    description: 'Store, manage, and grow your BRS tokens with a world-class exchange platform.',
    illustration: WalletIllustration,
    accent: colors.gold,
  },
  {
    id: '2',
    title: 'Trade Like a Pro',
    subtitle: 'Advanced\nTrading Tools',
    description: 'Professional charts, real-time order book, and instant swaps at your fingertips.',
    illustration: TradeIllustration,
    accent: colors.primary,
  },
  {
    id: '3',
    title: 'Secure & Reliable',
    subtitle: 'Bank-Grade\nSecurity',
    description: 'Multi-layer encryption, real-time monitoring, and your keys — your crypto.',
    illustration: SecureIllustration,
    accent: colors.cyan,
  },
]

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
    } else {
      handleDone()
    }
  }

  const handleDone = async () => {
    await AsyncStorage.setItem('bharos_onboarding_done', 'true')
    router.replace('/(tabs)')
  }

  const handleSkip = () => {
    handleDone()
  }

  const renderSlide = ({ item, index }: { item: typeof slides[0], index: number }) => {
    const Illustration = item.illustration
    return (
      <View style={styles.slide}>
        {/* Top glow */}
        <View style={[styles.slideGlow, { backgroundColor: `${item.accent}20` }]} />

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationNeu}>
            <Illustration />
          </View>
        </View>

        {/* Content */}
        <View style={styles.slideContent}>
          <Text style={[styles.slideEyebrow, { color: item.accent }]}>{item.title}</Text>
          <Text style={styles.slideTitle}>{item.subtitle}</Text>
          <Text style={styles.slideDesc}>{item.description}</Text>
        </View>
      </View>
    )
  }

  return (
    <LinearGradient colors={colors.gradientScreen} style={styles.container}>
      {/* Skip button */}
      <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.skipWrap}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={renderSlide}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width)
          setCurrentIndex(idx)
        }}
        bounces={false}
      />

      {/* Bottom Section */}
      <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentIndex === i && [styles.dotActive, { backgroundColor: slides[currentIndex].accent }],
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity activeOpacity={0.8} onPress={handleNext} style={styles.nextBtnWrap}>
          <LinearGradient
            colors={[slides[currentIndex].accent, `${slides[currentIndex].accent}CC`]}
            style={styles.nextBtn}
          >
            {currentIndex < slides.length - 1 ? (
              <>
                <Text style={styles.nextBtnText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </>
            ) : (
              <>
                <Text style={styles.nextBtnText}>Get Started</Text>
                <Ionicons name="rocket" size={18} color="#000" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Skip
  skipWrap: { position: 'absolute', top: 56, right: spacing.xl, zIndex: 10 },
  skipBtn: {
    ...neu.badge,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  skipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },

  // Slide
  slide: { width, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  slideGlow: {
    position: 'absolute', top: height * 0.15,
    width: 250, height: 250, borderRadius: 125, opacity: 0.15,
  },
  illustrationContainer: { marginBottom: spacing.xxxxl },
  illustrationNeu: {
    ...neu.card,
    width: 220, height: 220,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 110,
  },
  slideContent: { paddingHorizontal: spacing.xxxxl, alignItems: 'center' },
  slideEyebrow: {
    fontSize: 13, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  slideTitle: {
    color: colors.white, fontSize: 32, fontWeight: '800',
    textAlign: 'center', lineHeight: 40, letterSpacing: -0.5,
    marginBottom: spacing.lg,
  },
  slideDesc: {
    color: colors.textSecondary, fontSize: 15,
    textAlign: 'center', lineHeight: 24,
    maxWidth: 280,
  },

  // Bottom
  bottom: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    alignItems: 'center', gap: spacing.xxl,
  },
  dotsRow: { flexDirection: 'row', gap: spacing.sm },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotActive: { width: 24, borderRadius: 4 },

  // Next Button
  nextBtnWrap: { width: '100%' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.lg,
    borderRadius: radius.xl, ...shadows.neuSoft,
  },
  nextBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
})
