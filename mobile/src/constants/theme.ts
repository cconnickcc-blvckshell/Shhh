/**
 * Palette aligned with the “coming soon” HTML: deep bg, plum/gold, ink/muted.
 * Use for consistent premium feel across app and web entry.
 */
export const colors = {
  // Primary — plum (coming soon)
  primary: '#7C2BFF',
  primaryLight: '#B35CFF',
  primaryDark: '#5E1FCC',
  primaryMuted: '#4A1899',
  primaryGlow: 'rgba(124,43,255,0.35)',
  primarySoft: 'rgba(124,43,255,0.12)',

  // Accent — gold + soft purple
  accent: '#B35CFF',
  accentGold: '#D4AF37',
  heart: '#EC4899',

  // Backgrounds — bg0/bg1 (coming soon)
  background: '#06040A',
  surface: '#0B0712',
  surfaceElevated: '#0F0A18',
  surfaceLight: '#14101F',
  card: 'rgba(255,255,255,0.06)',
  cardHover: 'rgba(255,255,255,0.10)',

  // Text — ink / muted
  text: '#F7F2FF',
  textSecondary: '#C9B9E6',
  textMuted: '#9D86C7',
  textOnPrimary: '#FFFFFF',

  // Status
  success: '#34D399',
  warning: '#D4AF37',
  danger: '#EF4444',
  info: '#818CF8',

  // Borders — stroke (coming soon)
  border: 'rgba(255,255,255,0.14)',
  borderLight: 'rgba(255,255,255,0.18)',
  borderGlow: 'rgba(124,43,255,0.35)',

  // Online / badges
  online: '#34D399',
  verified: '#B35CFF',
  trusted: '#34D399',
  established: '#818CF8',
  host: '#D4AF37',

  // Overlay
  overlay: 'rgba(6,4,10,0.88)',
  overlayLight: 'rgba(6,4,10,0.6)',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xxs: 10,
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  hero: 36,
};

/** Radii aligned with coming soon (--radius 18px, --radius2 26px). */
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 26,
  full: 9999,
};

/** Shadows — card: 0 18px 70px rgba(0,0,0,.55); glow: plum. */
export const shadows = {
  glow: {
    shadowColor: '#7C2BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 35,
    elevation: 12,
  },
  /** Subtle card (buttons, chips). */
  cardSoft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 6,
  },
};

/**
 * Layout constants for web soft launch (signature layout constraint).
 * contentMaxWidth: locked 1200–1280px, centered; no fluid stretch on ultrawide.
 * @see docs/SOFT_LAUNCH_WEB_PLAN.md §4.3
 */
export const layout = {
  contentMaxWidth: 1280,
  sidebarWidth: 240,
} as const;
