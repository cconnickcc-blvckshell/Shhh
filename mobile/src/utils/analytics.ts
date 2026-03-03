/**
 * Privacy-safe analytics. No PII. Swap implementation for real SDK (e.g. PostHog, Mixpanel).
 * @see docs/E2E_CAPABILITY_AUDIT_REPORT.md §4.5, MASTER_IMPLEMENTATION_CHECKLIST 2.9
 */

type ScreenName = string;
type ActionName = string;

export function screenView(screen: ScreenName): void {
  if (__DEV__) {
    console.log('[analytics] screen_view', { screen });
  }
  // TODO: Integrate real analytics SDK
}

export function action(name: ActionName, params?: Record<string, string | number | boolean>): void {
  if (__DEV__) {
    console.log('[analytics] action', { name, params });
  }
  // TODO: Integrate real analytics SDK. Never log PII.
}
