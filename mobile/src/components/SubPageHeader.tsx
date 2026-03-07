import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../constants/theme';

export type SubPageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Default: arrow-back. Use 'close' for modal-style. */
  backIcon?: 'arrow-back' | 'close';
  /** Optional right-side action (e.g. Save button). */
  rightAction?: React.ReactNode;
  /** Accessibility role for the title. */
  accessibilityRole?: 'header';
};

/**
 * Shared header for Me sub-pages: back button, title, optional subtitle and right action.
 * Consistent padding, typography, and back behavior.
 */
export function SubPageHeader({
  title,
  subtitle,
  backIcon = 'arrow-back',
  rightAction,
  accessibilityRole = 'header',
}: SubPageHeaderProps) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name={backIcon} size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.titleWrap}>
        <Text style={styles.title} accessibilityRole={accessibilityRole}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{rightAction ?? <View style={styles.placeholder} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  titleWrap: { flex: 1 },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  right: { minWidth: 36, alignItems: 'flex-end' },
  placeholder: { width: 36, height: 36 },
});
