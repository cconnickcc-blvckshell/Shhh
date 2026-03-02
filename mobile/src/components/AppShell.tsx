import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { layout } from '../constants/theme';
import { PremiumDarkBackground } from './Backgrounds';

const CONTENT_MAX = layout.contentMaxWidth;

export type AppShellProps = {
  /** Main content. On web desktop, rendered in centered column with max width. */
  children: React.ReactNode;
  /** Optional sidebar (e.g. WebSidebar). Only used when provided; typically when showSidebar. */
  sidebar?: React.ReactNode;
  /** Max width of main content area (default: theme contentMaxWidth). */
  maxWidth?: number;
};

/**
 * Premium Shell: one wrapper for all web content.
 * - Fixed max width (1280px), centered.
 * - Optional sidebar + content grid.
 * - Controlled background. If it doesn't live inside the Shell, it doesn't render.
 * @see FRONTEND_STYLING_AND_ISSUES_HANDOVER.md Phase 1
 */
export function AppShell({ children, sidebar, maxWidth = CONTENT_MAX }: AppShellProps) {
  return (
    <PremiumDarkBackground style={styles.flex1}>
      <View style={styles.row}>
        {sidebar != null && <View style={styles.sidebarSlot}>{sidebar}</View>}
        <View style={[styles.contentWrap, !sidebar && styles.contentWrapFull]}>
          <View style={[styles.contentInner, { maxWidth: sidebar ? maxWidth : undefined }]}>
            {children}
          </View>
        </View>
      </View>
    </PremiumDarkBackground>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarSlot: {
    width: layout.sidebarWidth,
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    minHeight: 0,
    ...(Platform.OS === 'web' && { overflow: 'hidden' as const }),
  },
  contentWrapFull: {
    width: '100%',
  },
  contentInner: {
    width: '100%',
    flex: 1,
    minHeight: 0,
    ...(Platform.OS === 'web' && { overflow: 'hidden' as const }),
  },
});
