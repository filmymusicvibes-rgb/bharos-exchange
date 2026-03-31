// 🎨 Bharos Exchange — Design System
// Premium dark theme with glassmorphism

export const colors = {
  // Core
  bg: '#0A1628',
  bgSecondary: '#0F2847',
  bgCard: '#132F5E',
  bgGlass: 'rgba(255,255,255,0.06)',
  bgGlassLight: 'rgba(255,255,255,0.10)',
  bgGlassBorder: 'rgba(255,255,255,0.12)',

  // Accent
  cyan: '#00E5FF',
  cyanDark: '#00B8D4',
  cyanGlow: 'rgba(0,229,255,0.3)',
  cyanSoft: 'rgba(0,229,255,0.15)',

  // Gold (BRS)
  gold: '#FFD700',
  goldDark: '#B8860B',
  goldGlow: 'rgba(255,215,0,0.3)',
  goldSoft: 'rgba(255,215,0,0.12)',

  // Status
  green: '#00C853',
  greenGlow: 'rgba(0,200,83,0.3)',
  greenSoft: 'rgba(0,200,83,0.12)',
  red: '#FF1744',
  redSoft: 'rgba(255,23,68,0.12)',
  orange: '#FF9100',
  purple: '#B388FF',

  // Text
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.40)',

  // Gradients
  gradientCyan: ['#00E5FF', '#0091EA'],
  gradientGold: ['#FFD700', '#FF8F00'],
  gradientGreen: ['#00E676', '#00C853'],
  gradientPurple: ['#B388FF', '#7C4DFF'],
  gradientDark: ['#0A1628', '#0F2847'],
  gradientCard: ['rgba(15,40,71,0.8)', 'rgba(10,22,40,0.9)'],
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
}

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
}

export const shadows = {
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  }),
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
}

export const glass = {
  card: {
    backgroundColor: colors.bgGlass,
    borderWidth: 1,
    borderColor: colors.bgGlassBorder,
    borderRadius: radius.xl,
  },
  light: {
    backgroundColor: colors.bgGlassLight,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.lg,
  },
}
