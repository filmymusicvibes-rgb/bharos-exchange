import { Tabs } from 'expo-router'
import { View, StyleSheet, Platform, Dimensions } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, radius, spacing } from '../../lib/theme'
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'

const AnimatedView = Animated.createAnimatedComponent(View)
const { width: SCREEN_WIDTH } = Dimensions.get('window')

function TabIcon({
  name,
  nameOutline,
  focused,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap
  nameOutline: keyof typeof Ionicons.glyphMap
  focused: boolean
  color: string
}) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(focused ? 1.1 : 1, { damping: 14, stiffness: 200 }) },
      { translateY: withSpring(focused ? -2 : 0, { damping: 14, stiffness: 200 }) },
    ],
  }))

  return (
    <AnimatedView style={[styles.iconWrap, animStyle]}>
      {focused && (
        <View style={styles.activeGlow}>
          <LinearGradient
            colors={[`${colors.primary}40`, 'transparent']}
            style={styles.activeGlowGrad}
          />
        </View>
      )}
      <Ionicons
        name={focused ? name : nameOutline}
        size={22}
        color={focused ? colors.primary : color}
      />
      {focused && <View style={styles.activeDot} />}
    </AnimatedView>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={90}
              tint="dark"
              style={[StyleSheet.absoluteFill, styles.tabBarBlur]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.tabBarAndroid,
              ]}
            />
          )
        ),
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="wallet" nameOutline="wallet-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exchange"
        options={{
          title: 'Exchange',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="trending-up" nameOutline="trending-up-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="gift" nameOutline="gift-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="staking"
        options={{
          title: 'Staking',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="layers" nameOutline="layers-outline" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="person" nameOutline="person-outline" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 12,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: radius.xxl,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    paddingBottom: 0,
    paddingTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.1)',
    overflow: 'hidden',
  },
  tabBarBlur: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  tabBarAndroid: {
    backgroundColor: 'rgba(7,26,43,0.96)',
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.08)',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  tabItem: {
    paddingTop: 4,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 28,
    position: 'relative',
  },
  activeGlow: {
    position: 'absolute',
    top: -6,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  activeGlowGrad: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
})
