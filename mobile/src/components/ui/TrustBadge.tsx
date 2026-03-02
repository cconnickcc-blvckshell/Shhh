import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize } from '../../constants/theme';

export type TrustBadgeProps = {
  text: string;
};

/** Single trust line (e.g. "Private · Verified · Safe"). One source of truth. */
export function TrustBadge({ text }: TrustBadgeProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  text: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
