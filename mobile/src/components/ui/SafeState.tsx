import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

export type SafeStateVariant = 'loading' | 'empty' | 'error' | 'offline';

export type SafeStateProps = {
  variant: SafeStateVariant;
  /** Optional title (e.g. "No one nearby") */
  title?: string;
  /** Optional message or error text */
  message?: string;
  /** For error/offline: retry action */
  onRetry?: () => void;
  /** Optional icon name override */
  icon?: keyof typeof Ionicons.glyphMap;
};

const DEFAULT_CONTENT: Record<SafeStateVariant, { icon: keyof typeof Ionicons.glyphMap; title: string; message: string }> = {
  loading: {
    icon: 'hourglass-outline',
    title: '',
    message: 'Loading...',
  },
  empty: {
    icon: 'document-text-outline',
    title: 'Nothing here yet',
    message: 'Pull down to refresh',
  },
  error: {
    icon: 'alert-circle-outline',
    title: 'Something went wrong',
    message: 'Pull down to try again',
  },
  offline: {
    icon: 'cloud-offline-outline',
    title: 'You\'re offline',
    message: 'Check your connection and try again',
  },
};

/**
 * Screen-level state: loading, empty, error, offline.
 * One pattern so every screen looks intentional.
 * @see docs/FRONTEND_REFACTOR_STRATEGY.md §5 SafeState
 */
export function SafeState({ variant, title, message, onRetry, icon }: SafeStateProps) {
  const defaults = DEFAULT_CONTENT[variant];
  const iconName = icon ?? defaults.icon;
  const displayTitle = title ?? defaults.title;
  const displayMessage = message ?? defaults.message;
  const showRetry = (variant === 'error' || variant === 'offline') && onRetry;

  return (
    <View style={styles.wrap}>
      {variant === 'loading' ? (
        <ActivityIndicator size="large" color={colors.primaryLight} />
      ) : (
        <View style={styles.iconRing}>
          <Ionicons
            name={iconName}
            size={40}
            color={variant === 'error' || variant === 'offline' ? colors.danger : colors.primaryLight}
          />
        </View>
      )}
      {displayTitle ? <Text style={styles.title}>{displayTitle}</Text> : null}
      <Text style={styles.message}>{displayMessage}</Text>
      {showRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(147,51,234,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
});
