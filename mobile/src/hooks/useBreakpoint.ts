import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native';
import { breakpoints, CONTENT_MAX_WIDTH } from '../constants/breakpoints';

/**
 * Returns viewport-aware flags and dimensions for responsive layout.
 * Use for: sidebar vs tabs, content max-width, grid column counts.
 * @see docs/SOFT_LAUNCH_WEB_PLAN.md §4.2
 */
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= breakpoints.lg;
  const isTablet = width >= breakpoints.md && width < breakpoints.lg;
  const isMobile = width < breakpoints.md;

  return {
    width,
    isWeb,
    isDesktop,
    isTablet,
    isMobile,
    /** Use for signature layout constraint: wrap main content in a container with this maxWidth. */
    contentMaxWidth: CONTENT_MAX_WIDTH,
    /** True when sidebar nav should be shown (desktop web). */
    showSidebar: isDesktop,
  };
}
