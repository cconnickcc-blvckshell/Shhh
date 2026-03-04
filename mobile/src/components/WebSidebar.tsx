import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, layout } from '../constants/theme';
import { BrandMark } from './BrandMark';
import type { DesktopTabId } from '../lib/tabRoutes';

const NAV_ITEMS: { tab: DesktopTabId; label: string; icon: keyof typeof Ionicons.glyphMap; iconOutline: keyof typeof Ionicons.glyphMap }[] = [
  { tab: 'explore', label: 'Explore', icon: 'grid', iconOutline: 'grid-outline' },
  { tab: 'messages', label: 'Chat', icon: 'chatbubble-ellipses', iconOutline: 'chatbubble-ellipses-outline' },
  { tab: 'events', label: 'Events', icon: 'flame', iconOutline: 'flame-outline' },
  { tab: 'profile', label: 'Me', icon: 'person-circle', iconOutline: 'person-circle-outline' },
];

export function WebSidebar({ activeTab, onSelectTab }: { activeTab: DesktopTabId; onSelectTab: (tab: DesktopTabId) => void }) {
  return (
    <View style={styles.sidebar} role="navigation" aria-label="Main navigation">
      <View style={styles.brandWrap}>
        <BrandMark compact />
      </View>
      <View style={styles.navGroup}>
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.tab}
            item={item}
            active={activeTab === item.tab}
            onPress={() => onSelectTab(item.tab)}
          />
        ))}
      </View>
      <View style={styles.trustWrap}>
        <Text style={styles.trustText}>{'Private \u00B7 Verified \u00B7 Safe'}</Text>
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
        size={20}
        color={active ? '#B35CFF' : 'rgba(255,255,255,0.4)'}
      />
      <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
      {active && <View style={styles.activeIndicator} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: layout.sidebarWidth,
    height: '100%',
    backgroundColor: '#050308',
    backgroundImage: 'linear-gradient(180deg, rgba(124,43,255,0.04) 0%, transparent 40%, transparent 80%, rgba(124,43,255,0.02) 100%)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(124,43,255,0.1)',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
  } as any,
  brandWrap: {
    paddingHorizontal: 4,
    marginBottom: 40,
  },
  navGroup: {
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    position: 'relative',
  } as any,
  itemActive: {
    backgroundColor: 'rgba(124,43,255,0.1)',
  },
  itemPressed: {
    opacity: 0.8,
  },
  itemFocus: {
    outlineWidth: 2,
    outlineColor: colors.primary,
    outlineStyle: 'solid',
    borderRadius: 12,
  } as any,
  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: '#E8D5FF',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    bottom: '25%',
    width: 3,
    borderRadius: 2,
    backgroundColor: '#B35CFF',
  } as any,
  trustWrap: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  trustText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
