/**
 * Tab route mapping. Single source of truth for (tabs) routes.
 * URL is the authority; this is derivation only.
 * @see docs/FRONTEND_REFACTOR_STRATEGY.md §1 Navigation
 */
export type DesktopTabId = 'explore' | 'messages' | 'events' | 'profile';

export const TAB_TO_ROUTE: Record<DesktopTabId, string> = {
  explore: '/(tabs)',
  messages: '/(tabs)/messages',
  events: '/(tabs)/events',
  profile: '/(tabs)/profile',
};

export function pathnameToTab(pathname: string | null): DesktopTabId {
  if (pathname == null) return 'explore';
  if (pathname === '/(tabs)' || pathname === '/(tabs)/') return 'explore';
  if (pathname.startsWith('/(tabs)/messages')) return 'messages';
  if (pathname.startsWith('/(tabs)/events')) return 'events';
  if (pathname.startsWith('/(tabs)/profile')) return 'profile';
  return 'explore';
}
