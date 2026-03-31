import { Tabs } from 'expo-router'
import { View, StyleSheet, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius } from '../../lib/theme'
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated'

const AnimatedIcon = Animated.createAnimatedComponent(View)

function TabIcon({
  name,
  focused,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap
  focused: boolean
  color: string
}) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.15 : 1, { damping: 12 }) }],
    opacity: withSpring(focused ? 1 : 0.6),
  }))

  return (
    <AnimatedIcon style={[styles.iconWrap, animStyle]}>
      {focused && <View style={styles.glowDot} />}
      <Ionicons name={name} size={24} color={color} />
    </AnimatedIcon>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(10,22,40,0.95)' },
              ]}
            />
          )
        ),
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="wallet" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exchange"
        options={{
          title: 'Exchange',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="trending-up" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="gift" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="staking"
        options={{
          title: 'Staking',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="layers" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="person" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 88 : 68,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,229,255,0.1)',
    backgroundColor: 'transparent',
    elevation: 0,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 32,
  },
  glowDot: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
})
