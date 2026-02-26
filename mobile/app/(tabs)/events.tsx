import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';

export default function EventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { try { const r = await eventsApi.nearby(40.7128, -74.006); setEvents(r.data); } catch {} }, []);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderEvent = ({ item }: { item: any }) => {
    const d = new Date(item.starts_at);
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85}>
        <View style={styles.banner}>
          <View style={styles.bannerGlow} />
          <Ionicons name="sparkles" size={24} color={colors.primaryLight} />
        </View>
        <View style={styles.body}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>{d.getDate()}</Text>
            <Text style={styles.dateMonth}>{d.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <View style={styles.meta}>
              <Ionicons name="time-outline" size={11} color={colors.textMuted} />
              <Text style={styles.metaText}>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Ionicons name="people-outline" size={11} color={colors.textMuted} style={{ marginLeft: 8 }} />
              <Text style={styles.metaText}>{item.attendee_count || 0}{item.capacity ? `/${item.capacity}` : ''}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.rsvp} onPress={() => eventsApi.rsvp(item.id, 'going').then(load)}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList data={events} keyExtractor={i => i.id} renderItem={renderEvent} contentContainerStyle={{ padding: spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
        ListEmptyComponent={
          <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="flame-outline" size={40} color={colors.primaryLight} /></View><Text style={styles.emptyTitle}>No events nearby</Text></View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: colors.border },
  banner: { height: 64, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bannerGlow: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryGlow, opacity: 0.3 },
  body: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  dateBox: { width: 44, alignItems: 'center', marginRight: spacing.md, backgroundColor: colors.surfaceLight, borderRadius: borderRadius.sm, paddingVertical: 6 },
  dateDay: { color: colors.primaryLight, fontSize: fontSize.xl, fontWeight: '800', lineHeight: 24 },
  dateMonth: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  info: { flex: 1 },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  metaText: { color: colors.textMuted, fontSize: fontSize.xs },
  rsvp: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.glow },
  empty: { alignItems: 'center', paddingTop: 140 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
});
