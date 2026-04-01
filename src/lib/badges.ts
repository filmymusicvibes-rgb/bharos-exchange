// ═══════════════════════════════════════════
// BHAROS USER BADGE & LEVEL SYSTEM
// ═══════════════════════════════════════════

export interface BadgeLevel {
  id: string
  name: string
  emoji: string
  minBRS: number
  color: string
  gradient: string
  glow: string
  border: string
  description: string
}

export const BADGE_LEVELS: BadgeLevel[] = [
  {
    id: "starter",
    name: "Starter",
    emoji: "🌱",
    minBRS: 0,
    color: "#6b7280",
    gradient: "from-gray-500 to-gray-600",
    glow: "shadow-gray-500/20",
    border: "border-gray-500/30",
    description: "Just getting started!",
  },
  {
    id: "bronze",
    name: "Bronze",
    emoji: "🥉",
    minBRS: 50,
    color: "#cd7f32",
    gradient: "from-amber-700 to-amber-800",
    glow: "shadow-amber-700/30",
    border: "border-amber-700/30",
    description: "Building your foundation",
  },
  {
    id: "silver",
    name: "Silver",
    emoji: "🥈",
    minBRS: 200,
    color: "#c0c0c0",
    gradient: "from-gray-300 to-gray-400",
    glow: "shadow-gray-300/30",
    border: "border-gray-300/30",
    description: "Rising through the ranks!",
  },
  {
    id: "gold",
    name: "Gold",
    emoji: "🥇",
    minBRS: 500,
    color: "#ffd700",
    gradient: "from-yellow-400 to-amber-500",
    glow: "shadow-yellow-400/40",
    border: "border-yellow-400/30",
    description: "A true Bharos champion!",
  },
  {
    id: "diamond",
    name: "Diamond",
    emoji: "💎",
    minBRS: 2000,
    color: "#00d4ff",
    gradient: "from-cyan-400 to-blue-500",
    glow: "shadow-cyan-400/40",
    border: "border-cyan-400/30",
    description: "Elite status achieved!",
  },
  {
    id: "legend",
    name: "Legend",
    emoji: "👑",
    minBRS: 10000,
    color: "#ff6b35",
    gradient: "from-orange-400 via-red-500 to-purple-600",
    glow: "shadow-orange-500/50",
    border: "border-orange-400/40",
    description: "The ultimate Bharos Legend!",
  },
]

export function getUserBadge(brsBalance: number): BadgeLevel {
  let badge = BADGE_LEVELS[0]
  for (const level of BADGE_LEVELS) {
    if (brsBalance >= level.minBRS) {
      badge = level
    }
  }
  return badge
}

export function getNextBadge(brsBalance: number): BadgeLevel | null {
  for (const level of BADGE_LEVELS) {
    if (brsBalance < level.minBRS) {
      return level
    }
  }
  return null
}

export function getBadgeProgress(brsBalance: number): number {
  const current = getUserBadge(brsBalance)
  const next = getNextBadge(brsBalance)
  if (!next) return 100
  const range = next.minBRS - current.minBRS
  const progress = brsBalance - current.minBRS
  return Math.min(Math.round((progress / range) * 100), 100)
}
