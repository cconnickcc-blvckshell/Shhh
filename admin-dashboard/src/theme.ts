/**
 * Shhh Admin — Design System
 * Neon purple + black gradient, glassmorphism, futuristic command center.
 * Every token is intentional; no generic defaults.
 */
export const theme = {
  /** Primary palette — neon purple, not generic violet */
  colors: {
    primary: '#A855F7',
    primaryGlow: 'rgba(168, 85, 247, 0.4)',
    primaryMuted: 'rgba(168, 85, 247, 0.15)',
    primaryBorder: 'rgba(168, 85, 247, 0.25)',

    accent: '#C084FC',
    accentCyan: '#22D3EE',
    accentPink: '#F472B6',

    /** Backgrounds — deep black with purple undertone */
    bgBase: '#030014',
    bgElevated: '#0a0a1a',
    bgSurface: '#0d0a18',
    bgCard: 'rgba(15, 10, 28, 0.6)',

    /** Text hierarchy */
    text: '#F5F3FF',
    textSecondary: '#C4B5FD',
    textMuted: '#8B7AB8',
    textDim: '#5C4A7A',

    /** Semantic */
    success: '#34D399',
    successMuted: 'rgba(52, 211, 153, 0.15)',
    warning: '#FBBF24',
    warningMuted: 'rgba(251, 191, 36, 0.15)',
    danger: '#EF4444',
    dangerMuted: 'rgba(239, 68, 68, 0.15)',
    info: '#60A5FA',
    infoMuted: 'rgba(96, 165, 250, 0.15)',
  },

  /** Typography — Space Grotesk (headings), DM Sans (body) */
  font: {
    display: '"Space Grotesk", system-ui, sans-serif',
    body: '"DM Sans", system-ui, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },

  fontSize: {
    xs: '0.6875rem',
    sm: '0.8125rem',
    base: '0.9375rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.375rem',
    '2xl': '1.75rem',
    '3xl': '2.25rem',
  },

  fontWeight: {
    normal: 500,
    medium: 600,
    semibold: 700,
    bold: 800,
  },

  /** Spacing — 4px base */
  space: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
  },

  /** Glassmorphism — one treatment, used consistently */
  glass: {
    bg: 'rgba(15, 10, 28, 0.65)',
    border: '1px solid rgba(168, 85, 247, 0.18)',
    borderHover: '1px solid rgba(168, 85, 247, 0.35)',
    blur: 'blur(20px)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    shadowHover: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 24px rgba(168, 85, 247, 0.08)',
  },

  /** Radii — intentional, not random */
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },

  /** Transitions */
  transition: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
  },
} as const;

export type Theme = typeof theme;
