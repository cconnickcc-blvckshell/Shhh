import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, layout } from '../constants/theme';

const NAV_ITEMS: { route: string; label: string; icon: keyof typeof Ionicons.glyphMap; iconOutline: keyof typeof Ionicons.glyphMap }[] = [
  { route: '/(tabs)', label: 'Explore', icon: 'grid', iconOutline: 'grid-outline' },
  { route: '/(tabs)/messages', label: 'Chat', icon: 'chatbubble-ellipses', iconOutline: 'chatbubble-ellipses-outline' },
  { route: '/(tabs)/events', label: 'Events', icon: 'flame', iconOutline: 'flame-outline' },
  { route: '/(tabs)/profile', label: 'Me', icon: 'person-circle', iconOutline: 'person-circle-outline' },
];

/**
 * Desktop web sidebar navigation. Shown only when useBreakpoint().showSidebar is true.
 * Single source of truth for active tab: pathname. Keyboard-accessible.
 * @see docs/SOFT_LAUNCH_WEB_PLAN.md §4.1
 */
export function WebSidebar() {
  const pathname = usePathname();

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.route === '/(tabs)') return pathname === '/(tabs)' || pathname === '/(tabs)/';
    return pathname === item.route || pathname.startsWith(item.route + '/');
  };

  return (
    <View style={styles.sidebar} role="navigation" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <SidebarItem
            key={item.route}
            item={item}
            active={active}
            onPress={() => router.replace(item.route as any)}
          />
        );
      })}
      <View style={styles.trustWrap}>
        <Text style={styles.trustText}>Private · Verified · Safe</Text>
      </View>
    </View>
  );
}

function SidebarItem({
  item,
  active,
  onPress,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  onPress: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.item,
        active && styles.itemActive,
        pressed && styles.itemPressed,
        Platform.OS === 'web' && focused && styles.itemFocus,
      ]}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
    >
      <Ionicons
        name={active ? item.icon : item.iconOutline}
        size={22}
        color={active ? colors.primaryLight : colors.textSecondary}
      />
      <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: layout.sidebarWidth,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.xs,
  },
  itemActive: {
    backgroundColor: colors.primarySoft,
  },
  itemPressed: {
    opacity: 0.85,
  },
  itemFocus: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 14,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.primaryLight,
  },
  trustWrap: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trustText: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
