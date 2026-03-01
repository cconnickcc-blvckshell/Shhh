import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, shadows } from '../../constants/theme';

export type PrimaryCTAProps = {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Single primary button: gradient, no variation. */
export function PrimaryCTA({ label, onPress, accessibilityLabel }: PrimaryCTAProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <LinearGradient
        colors={['rgba(124,43,255,0.95)', 'rgba(179,92,255,0.65)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    ...shadows.glow,
  },
  btnPressed: { opacity: 0.95 },
  label: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
});
