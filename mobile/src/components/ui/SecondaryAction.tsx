import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, fontSize } from '../../constants/theme';

export type SecondaryActionProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Outline/secondary button. No gradient. */
export function SecondaryAction({ label, onPress, accessibilityLabel }: SecondaryActionProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  btnPressed: { opacity: 0.85 },
  label: { color: colors.primaryLight, fontSize: fontSize.md, fontWeight: '600' },
});
