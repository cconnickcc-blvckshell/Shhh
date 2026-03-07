import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../../constants/theme';

/**
 * Uppercase section label for Me sub-pages. Consistent with main pages.
 */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
});
