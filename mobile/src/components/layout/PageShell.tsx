import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { layout, spacing, colors } from '../../constants/theme';

/**
 * Page-level wrapper: centers content, enforces max width, vertical padding.
 * Every tab screen must use this (or an explicit exception). No raw root flex.
 * @see docs/FRONTEND_REFACTOR_STRATEGY.md §2 PageShell
 */
export function PageShell({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.shell, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 0,
    backgroundColor: colors.background,
  },
});
