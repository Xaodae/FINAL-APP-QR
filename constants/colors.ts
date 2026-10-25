export const COLORS = {
  primary: '#44D62C',          // Razer green
  background: '#050805',       // near-black with a faint green tint
  card: '#0B110B',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C4B8',
  textOnPrimary: '#000000',    // black text is more readable on neon green
  surface: '#111811',
  border: '#1F2E1F',
  shadow: '#44D62C',           // green shadow creates the glow
  warning: '#FBBF24',
  success: '#00FF66',          // brighter mint so it stays distinct from primary
  danger: '#FF3B3B',
  accent: '#00FF41',           // brighter neon for highlights
  magenta: '#B6FF3B',          // lime accent (kept the key name so existing code works)
  cardBorderNeon: '#44D62C66', // semi-transparent green border
  muted: '#6B7F6B',
} as const;

// Reusable neon glow for cards, buttons, etc.
export const GLOW = {
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8,
  shadowRadius: 12,
  elevation: 10, // Android
} as const;