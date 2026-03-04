import { useEffect } from 'react';
import { Tabs, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { colors, fontSize } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/auth';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { AppShell } from '../../src/components/AppShell';
import { WebSidebar } from '../../src/components/WebSidebar';
import { pathnameToTab, TAB_TO_ROUTE, type DesktopTabId } from '../../src/lib/tabRoutes';

const TAB_OPTIONS = {
  sceneStyle: { backgroundColor: colors.background, flex: 1 },
  contentStyle: { backgroundColor: colors.background },
  headerStyle: { backgroundColor: colors.surface, elevation: 0, shadowOpacity: 0, borderBottomWidth: 0.5, borderBottomColor: 'rgba(147,51,234,0.15)' },
  headerTitleStyle: { color: colors.text, fontWeight: '700' as const, fontSize: fontSize.lg },
  headerShown: false,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(147,51,234,0.2)',
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarActiveTintColor: colors.primaryLight,
  tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
  tabBarShowLabel: false,
};

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pathname = usePathname();
  const { showSidebar } = useBreakpoint();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  // URL is the single source of truth. Sidebar only triggers navigation.
  const activeTab = pathnameToTab(pathname);
  const onSelectTab = (tab: DesktopTabId) => router.replace(TAB_TO_ROUTE[tab] as any);

  const tabBarStyle = showSidebar ? { ...TAB_OPTIONS.tabBarStyle, display: 'none' as const } : TAB_OPTIONS.tabBarStyle;

  const tabs = (
    <Tabs
      screenOptions={{
        ...TAB_OPTIONS,
        tabBarStyle,
        tabBarAccessibilityLabel: 'Main navigation',
        tabBarAccessibilityRole: 'tablist',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarAccessibilityLabel: 'Explore',
          tabBarTestID: 'tab-explore',
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
          tabBarAccessibilityLabel: 'Chat',
          tabBarTestID: 'tab-chat',
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
          tabBarAccessibilityLabel: 'Events',
          tabBarTestID: 'tab-events',
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
          tabBarAccessibilityLabel: 'Me',
          tabBarTestID: 'tab-me',
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

  // Tabs always mounted. Tab bar hidden on desktop; sidebar triggers router.replace only.
  if (showSidebar) {
    return (
      <AppShell sidebar={<WebSidebar activeTab={activeTab} onSelectTab={onSelectTab} />}>
        {tabs}
      </AppShell>
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

