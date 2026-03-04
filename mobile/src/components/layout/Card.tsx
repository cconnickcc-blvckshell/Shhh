import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../../constants/theme';

const CARD_MIN_HEIGHT = 80;

export type CardProps = {
  children: React.ReactNode;
  /** Use for edge-to-edge content (e.g. banner at top); card body supplies own padding. */
  noPadding?: boolean;
  style?: ViewStyle;
  /** Override min height (default 80). */
  minHeight?: number;
};

/**
 * Enforced card: padding, radius, background, overflow, minHeight.
 * Single card contract across the product. No card collapse under ~900px.
 * @see docs/FRONTEND_REFACTOR_STRATEGY.md §2 Card
 */
export function Card({ children, noPadding, style, minHeight = CARD_MIN_HEIGHT }: CardProps) {
  return (
    <View style={[styles.card, noPadding && styles.noPadding, { minHeight }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: 'rgba(11,7,18,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(124,43,255,0.06)',
    overflow: 'hidden',
  },
  noPadding: {
    padding: 0,
  },
});
