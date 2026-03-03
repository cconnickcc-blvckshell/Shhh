import { useEffect } from 'react';
import { screenView } from '../utils/analytics';

/**
 * Fire screen_view on mount. Use in screen components.
 */
export function useScreenView(screenName: string): void {
  useEffect(() => {
    screenView(screenName);
  }, [screenName]);
}
