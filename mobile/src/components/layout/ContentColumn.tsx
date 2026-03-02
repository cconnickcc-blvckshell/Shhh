import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

const CONTENT_MAX = 900;

/**
 * Inner content column: max width 800–900px, centered. Use for reading/list density.
 * Never collapses (minWidth/minHeight 0 for flex correctness).
 * @see docs/FRONTEND_REFACTOR_STRATEGY.md §2 ContentColumn
 */
export function ContentColumn({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.column, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    width: '100%',
    maxWidth: CONTENT_MAX,
    alignSelf: 'center',
    minWidth: 0,
    minHeight: 0,
  },
});
