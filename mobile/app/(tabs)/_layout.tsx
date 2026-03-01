import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { colors, fontSize, layout } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/auth';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { WebSidebar } from '../../src/components/WebSidebar';

const TAB_OPTIONS = {
  sceneStyle: { backgroundColor: 'transparent' },
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

  if (showSidebar) {
    return (
      <PremiumDarkBackground style={styles.flex1}>
        <View style={styles.webRow}>
          <WebSidebar />
          <View style={styles.contentWrap}>
            <View style={styles.contentInner}>
              {tabs}
            </View>
          </View>
        </View>
      </PremiumDarkBackground>
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
  },
  contentInner: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    flex: 1,
  },
});
