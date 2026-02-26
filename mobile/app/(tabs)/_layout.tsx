import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { colors, fontSize } from '../../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#050508', elevation: 0, shadowOpacity: 0, borderBottomWidth: 0.5, borderBottomColor: 'rgba(147,51,234,0.1)' },
        headerTitleStyle: { color: colors.text, fontWeight: '700', fontSize: fontSize.lg },
        tabBarStyle: {
          backgroundColor: '#050508',
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(147,51,234,0.15)',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
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
