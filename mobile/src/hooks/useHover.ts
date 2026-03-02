import { useState, useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Tracks hover state for web (onMouseEnter/onMouseLeave). On native, isHovered is always false.
 * Use for hover-only styles (e.g. cards, sidebar items) per SOFT_LAUNCH_WEB_PLAN §4.5.
 */
export function useHover(): {
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  hoverProps: { onMouseEnter?: () => void; onMouseLeave?: () => void };
} {
  const [isHovered, setHovered] = useState(false);
  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);
  const hoverProps =
    Platform.OS === 'web'
      ? { onMouseEnter, onMouseLeave }
      : {};
  return { isHovered: Platform.OS === 'web' ? isHovered : false, onMouseEnter, onMouseLeave, hoverProps };
}
