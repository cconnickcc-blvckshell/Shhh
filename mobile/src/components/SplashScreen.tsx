import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, shadows } from '../constants/theme';

/**
 * Full-screen splash shown while auth/session is resolving.
 * Premium feel: gradient, wordmark, subtle breathing glow.
 */
export function SplashScreen() {
  const glowOpacity = useSharedValue(0.25);
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(0.5, { duration: 1800 }),
      -1,
      true
    );
  }, [glowOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <LinearGradient
      colors={[colors.background, colors.surface, colors.background]}
      locations={[0, 0.5, 1]}
      style={s.container}
    >
      <Animated.View style={[s.glowOrb, glowStyle]} />
      <View style={s.content}>
        <View style={s.iconWrap}>
          <Ionicons name="finger-print" size={40} color={colors.primaryLight} />
        </View>
        <Text style={s.logo}>Shhh</Text>
        <Text style={s.tagline}>YOUR SECRET IS SAFE</Text>
        <ActivityIndicator size="small" color={colors.primaryLight} style={s.loader} />
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowOrb: {
    position: 'absolute',
    top: '20%',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primaryGlow,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.glow,
  },
  logo: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  loader: {
    marginTop: spacing.xxl,
  },
});
