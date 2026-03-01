import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, fontSize, layout, spacing } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/auth';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { AppShell } from '../../src/components/AppShell';
import { WebSidebar } from '../../src/components/WebSidebar';
import { DesktopTabProvider, useDesktopTab, type DesktopTabId } from '../../src/contexts/DesktopTabContext';
import DiscoverScreen from './index';
import MessagesScreen from './messages';
import EventsScreen from './events';
import ProfileScreen from './profile';

const TAB_SCREENS: Record<DesktopTabId, React.ComponentType> = {
  explore: DiscoverScreen,
  messages: MessagesScreen,
  events: EventsScreen,
  profile: ProfileScreen,
};

const TAB_TITLES: Record<DesktopTabId, string> = {
  explore: 'Explore',
  messages: 'Chat',
  events: 'Events',
  profile: 'Me',
};

function DesktopShellWithTabs() {
  const { activeTab, setActiveTab } = useDesktopTab()!;
  return (
    <AppShell sidebar={<WebSidebar activeTab={activeTab} onSelectTab={setActiveTab} />}>
      <View style={styles.tabsWrap}>
        <DesktopTabContent />
      </View>
    </AppShell>
  );
}

const TAB_OPTIONS = {
  sceneStyle: { backgroundColor: 'transparent', flex: 1 },
  contentStyle: { backgroundColor: 'transparent' },
  headerStyle: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0, borderBottomWidth: 0.5, borderBottomColor: 'rgba(147,51,234,0.15)' },
  headerTitleStyle: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg },
  tabBarStyle: {
    backgroundColor: 'transparent',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(147,51,234,0.2)',
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarActiveTintColor: colors.primaryLight,
  tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
  tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
};

function DesktopTabContent() {
  const { activeTab } = useDesktopTab()!;
  const Screen = TAB_SCREENS[activeTab];
  const title = TAB_TITLES[activeTab];
  const showHeader = activeTab !== 'explore';
  return (
    <>
      {showHeader && (
        <View style={desktopStyles.desktopHeader}>
          <Text style={desktopStyles.desktopHeaderTitle}>{title}</Text>
        </View>
      )}
      <View style={desktopStyles.screenWrap}>
        <Screen key={activeTab} />
      </View>
    </>
  );
}

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { showSidebar } = useBreakpoint();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const tabBarStyle = showSidebar ? { ...TAB_OPTIONS.tabBarStyle, display: 'none' as const } : TAB_OPTIONS.tabBarStyle;

  const tabs = (
    <Tabs
      screenOptions={{
        ...TAB_OPTIONS,
        tabBarStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          headerTitle: 'Shhh',
          headerTitleStyle: { color: colors.primaryLight, fontWeight: '900', fontSize: 20, letterSpacing: -1 },
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? s.activeWrap : s.inactiveWrap}>
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={21} color={color} />
              {focused && <View style={s.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? s.activeWrap : s.inactiveWrap}>
              <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={21} color={color} />
              {focused && <View style={s.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? s.activeWrap : s.inactiveWrap}>
              <Ionicons name={focused ? 'flame' : 'flame-outline'} size={21} color={color} />
              {focused && <View style={s.activeDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? s.activeWrap : s.inactiveWrap}>
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={23} color={color} />
              {focused && <View style={s.activeDot} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );

  // Desktop: state-driven tab (Phase 3). AppShell enforces premium frame (Phase 1).
  if (showSidebar) {
    return (
      <DesktopTabProvider>
        <DesktopShellWithTabs />
      </DesktopTabProvider>
    );
  }

  return (
    <PremiumDarkBackground style={{ flex: 1 }}>
      {tabs}
    </PremiumDarkBackground>
  );
}

const s = StyleSheet.create({
  activeWrap: { alignItems: 'center' },
  inactiveWrap: { alignItems: 'center', opacity: 0.6 },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.primaryLight,
    marginTop: 3,
  },
});

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  webRow: {
    flex: 1,
    flexDirection: 'row',
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    minHeight: 0,
    ...(Platform.OS === 'web' && { overflow: 'hidden' as const }),
  },
  contentInner: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    flex: 1,
    minHeight: 0,
    ...(Platform.OS === 'web' && { overflow: 'hidden' as const }),
  },
  tabsWrap: { flex: 1, minHeight: 0 },
});

const desktopStyles = StyleSheet.create({
  desktopHeader: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  desktopHeaderTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  screenWrap: { flex: 1, minHeight: 0 },
});
