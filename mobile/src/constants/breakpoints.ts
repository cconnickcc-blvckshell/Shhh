/**
 * Breakpoints for responsive layout (web and native).
 * Single source of truth for layout decisions; used by useBreakpoint and theme.
 * @see docs/SOFT_LAUNCH_WEB_PLAN.md §4.2, §4.3
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

/** Content max-width for signature layout constraint (desktop web). 1200–1280px per plan. */
export const CONTENT_MAX_WIDTH = 1280;

/** Sidebar width when shown on desktop web. */
export const SIDEBAR_WIDTH = 240;
