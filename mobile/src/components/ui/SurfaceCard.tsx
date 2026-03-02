import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows } from '../../constants/theme';

export type SurfaceCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Opinionated card: stroke border, subtle fill, shadow. Stops layout drift. */
export function SurfaceCard({ children, style }: SurfaceCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    ...shadows.card,
  },
});
