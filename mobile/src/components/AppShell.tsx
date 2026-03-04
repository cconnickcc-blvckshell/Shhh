import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { layout, colors } from '../constants/theme';

const CONTENT_MAX = layout.contentMaxWidth;

export type AppShellProps = {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  maxWidth?: number;
};

export function AppShell({ children, sidebar, maxWidth = CONTENT_MAX }: AppShellProps) {
  return (
    <View style={styles.root}>
      {sidebar != null && <View style={styles.sidebarSlot}>{sidebar}</View>}
      <View style={[styles.contentWrap, !sidebar && styles.contentWrapFull]}>
        <View style={[styles.contentInner, { maxWidth: sidebar ? maxWidth : undefined }]}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
    minHeight: '100vh',
  } as any,
  sidebarSlot: {
    width: layout.sidebarWidth,
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: colors.background,
  } as any,
  contentWrap: {
    flex: 1,
    minWidth: 0,
    minHeight: '100vh',
    marginLeft: layout.sidebarWidth,
    backgroundColor: colors.background,
    backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,43,255,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 90% 80%, rgba(124,43,255,0.04) 0%, transparent 50%)',
    ...(Platform.OS === 'web' && { overflowY: 'auto' as any, overflowX: 'hidden' as any }),
  } as any,
  contentWrapFull: {
    marginLeft: 0,
    width: '100%',
  },
  contentInner: {
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
});
