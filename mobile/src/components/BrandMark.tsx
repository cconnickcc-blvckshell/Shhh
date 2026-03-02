import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, borderRadius } from '../constants/theme';

/**
 * Coming-soon style brand: gradient mark + "Shhh" + "social".
 * Use in sidebar and Explore hero for consistent premium branding.
 */
export function BrandMark({ compact }: { compact?: boolean }) {
  const size = compact ? 36 : 44;
  const cornerRadius = compact ? 10 : 14;
  return (
    <View style={styles.brand}>
      <View style={[styles.markWrap, { width: size, height: size, borderRadius: cornerRadius }]}>
        <LinearGradient
          colors={['rgba(124,43,255,0.95)', 'rgba(179,92,255,0.45)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.markInner, { borderRadius: cornerRadius }]} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.strong, compact && styles.strongCompact]}>Shhh</Text>
        {!compact && <Text style={styles.span}>social</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markWrap: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    ...({
      shadowColor: '#7C2BFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    } as any),
  },
  markInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  textWrap: { flexDirection: 'column' },
  strong: {
    fontWeight: '800',
    letterSpacing: 0.4,
    fontSize: 16,
    lineHeight: 18,
    color: colors.text,
  },
  strongCompact: { fontSize: 15, lineHeight: 16 },
  span: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  spanCompact: {},
});
