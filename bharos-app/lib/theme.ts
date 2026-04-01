// 🎨 Bharos Exchange — Premium Design System v3.0
// DARK NEUMORPHISM + Glassmorphism Hybrid
// Soft extruded surfaces, embossed cards, inset inputs, pillow buttons

export const colors = {
  // Core Background — Deep teal-navy palette
  bg: '#0C1E2E',
  bgSecondary: '#0F2A3D',
  bgTertiary: '#0D3B4F',
  bgCard: '#112D42',
  bgElevated: '#143850',
  bgSurface: '#0E2636',       // Neumorphic surface base
  bgSurfaceLight: '#153A4E',  // Lighter surface for raised elements
  bgSurfaceDark: '#081520',   // Darker surface for inset elements

  // Neumorphic Shadow Colors
  neuLightShadow: 'rgba(30,80,110,0.40)',  // Light shadow (top-left glow)
  neuDarkShadow: 'rgba(0,5,12,0.65)',      // Dark shadow (bottom-right depth)
  neuInsetLight: 'rgba(40,90,120,0.20)',    // Inner highlight
  neuInsetDark: 'rgba(0,0,0,0.35)',         // Inner shadow
  neuHighlight: 'rgba(100,180,220,0.08)',   // Top edge highlight
  neuBorderLight: 'rgba(80,150,200,0.12)',  // Subtle raised border

  // Glass morphism
  bgGlass: 'rgba(255,255,255,0.03)',
  bgGlassLight: 'rgba(255,255,255,0.06)',
  bgGlassMedium: 'rgba(255,255,255,0.10)',
  bgGlassBorder: 'rgba(255,255,255,0.06)',
  bgGlassBorderLight: 'rgba(255,255,255,0.12)',

  // Primary Accent — Teal/Mint
  primary: '#00D4AA',
  primaryDark: '#00A88A',
  primaryLight: '#33DDBB',
  primaryGlow: 'rgba(0,212,170,0.35)',
  primarySoft: 'rgba(0,212,170,0.12)',
  primaryMuted: 'rgba(0,212,170,0.06)',

  // Secondary Accent — Cyan
  cyan: '#00E5FF',
  cyanDark: '#00B8D4',
  cyanGlow: 'rgba(0,229,255,0.3)',
  cyanSoft: 'rgba(0,229,255,0.12)',

  // Gold (BRS Brand)
  gold: '#FFD700',
  goldDark: '#D4A800',
  goldLight: '#FFE44D',
  goldGlow: 'rgba(255,215,0,0.35)',
  goldSoft: 'rgba(255,215,0,0.10)',

  // Status Colors
  green: '#00E676',
  greenDark: '#00C853',
  greenGlow: 'rgba(0,230,118,0.3)',
  greenSoft: 'rgba(0,230,118,0.10)',
  red: '#FF4757',
  redDark: '#E83E4E',
  redGlow: 'rgba(255,71,87,0.3)',
  redSoft: 'rgba(255,71,87,0.10)',
  orange: '#FFAB40',
  orangeSoft: 'rgba(255,171,64,0.10)',
  purple: '#B388FF',
  purpleSoft: 'rgba(179,136,255,0.10)',
  blue: '#448AFF',
  blueSoft: 'rgba(68,138,255,0.10)',

  // Text Hierarchy
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.70)',
  textTertiary: 'rgba(255,255,255,0.50)',
  textMuted: 'rgba(255,255,255,0.35)',
  textDisabled: 'rgba(255,255,255,0.20)',

  // Gradients
  gradientPrimary: ['#00D4AA', '#00A88A'] as [string, string],
  gradientCyan: ['#00E5FF', '#0091EA'] as [string, string],
  gradientGold: ['#FFD700', '#FF8F00'] as [string, string],
  gradientGreen: ['#00E676', '#00C853'] as [string, string],
  gradientRed: ['#FF4757', '#E83E4E'] as [string, string],
  gradientPurple: ['#B388FF', '#7C4DFF'] as [string, string],
  gradientHero: ['#0E2636', '#112D42', '#0E2636'] as [string, string, string],
  gradientCard: ['rgba(17,45,66,0.95)', 'rgba(14,38,54,0.98)'] as [string, string],
  gradientDark: ['#0C1E2E', '#0F2A3D'] as [string, string],
  gradientScreen: ['#081520', '#0C1E2E', '#0F2A3D'] as [string, string, string],
}

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
}

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 999,
}

export const typography = {
  display: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1.5 },
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -1 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
  h3: { fontSize: 20, fontWeight: '700' as const },
  h4: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '500' as const },
  bodySemibold: { fontSize: 15, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.3 },
  overline: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✨ NEUMORPHIC SHADOW SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const shadows = {
  // Raised neumorphic card (appears to float above surface)
  neuRaised: {
    shadowColor: colors.neuDarkShadow,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 12,
  },
  // Soft raised effect
  neuSoft: {
    shadowColor: colors.neuDarkShadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  // Subtle neumorphic lift
  neuSubtle: {
    shadowColor: colors.neuDarkShadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  // Button pressed state (inset feel)
  neuPressed: {
    shadowColor: colors.neuDarkShadow,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  // Glow effect for accent elements
  glow: (color: string, intensity = 0.5) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 20,
    elevation: 12,
  }),
  // Standard card shadow
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 14,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧊 NEUMORPHIC CARD PRESETS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const neu = {
  // Raised card — the main neumorphic element
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderTopColor: colors.neuHighlight,
    borderLeftColor: colors.neuHighlight,
    borderRightColor: 'rgba(0,0,0,0.15)',
    borderBottomColor: 'rgba(0,0,0,0.15)',
    ...shadows.neuRaised,
  },
  // Soft raised card (less prominent)
  cardSoft: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderTopColor: colors.neuHighlight,
    borderLeftColor: colors.neuHighlight,
    borderRightColor: 'rgba(0,0,0,0.10)',
    borderBottomColor: 'rgba(0,0,0,0.10)',
    ...shadows.neuSoft,
  },
  // Inset / pressed container (input fields, toggle backgrounds)
  inset: {
    backgroundColor: colors.bgSurfaceDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.25)',
    borderLeftColor: 'rgba(0,0,0,0.25)',
    borderRightColor: colors.neuInsetLight,
    borderBottomColor: colors.neuInsetLight,
  },
  // Pillow button (raised, pressable)
  button: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderTopColor: colors.neuBorderLight,
    borderLeftColor: colors.neuBorderLight,
    borderRightColor: 'rgba(0,0,0,0.18)',
    borderBottomColor: 'rgba(0,0,0,0.18)',
    ...shadows.neuSoft,
  },
  // Flat / embossed section header
  flat: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  // Badge / chip
  badge: {
    backgroundColor: colors.bgSurfaceLight,
    borderRadius: radius.full,
    borderWidth: 1,
    borderTopColor: colors.neuHighlight,
    borderLeftColor: colors.neuHighlight,
    borderRightColor: 'rgba(0,0,0,0.12)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    ...shadows.neuSubtle,
  },
  // Icon container (circular raised)
  iconCircle: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderTopColor: colors.neuHighlight,
    borderLeftColor: colors.neuHighlight,
    borderRightColor: 'rgba(0,0,0,0.15)',
    borderBottomColor: 'rgba(0,0,0,0.15)',
    ...shadows.neuSubtle,
  },
}

// Legacy glass presets (still available for blending)
export const glass = {
  card: {
    backgroundColor: colors.bgGlass,
    borderWidth: 1,
    borderColor: colors.bgGlassBorder,
    borderRadius: radius.xl,
  },
  elevated: {
    backgroundColor: colors.bgGlassLight,
    borderWidth: 1,
    borderColor: colors.bgGlassBorderLight,
    borderRadius: radius.xl,
    ...shadows.card,
  },
  frosted: {
    backgroundColor: 'rgba(14,38,54,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,170,0.10)',
    borderRadius: radius.xxl,
  },
  inset: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.lg,
  },
  light: {
    backgroundColor: colors.bgGlassMedium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.lg,
  },
}

// Pre-configured animation settings
export const springConfig = {
  gentle: { damping: 15, stiffness: 120, mass: 1 },
  bouncy: { damping: 10, stiffness: 180, mass: 0.8 },
  snappy: { damping: 20, stiffness: 300, mass: 0.6 },
  smooth: { damping: 25, stiffness: 100, mass: 1.2 },
}

export const timingConfig = {
  fast: 200,
  normal: 350,
  slow: 600,
  pageTransition: 450,
}
