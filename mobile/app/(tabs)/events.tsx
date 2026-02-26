import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../src/api/client';
import { colors, spacing, fontSize } from '../../src/constants/theme';

export default function EventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await eventsApi.nearby(40.7128, -74.006);
      setEvents(res.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleRsvp = async (eventId: string) => {
    await eventsApi.rsvp(eventId, 'going');
    load();
  };

  const renderEvent = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.dateCol}>
        <Text style={styles.dateDay}>{new Date(item.starts_at).getDate()}</Text>
        <Text style={styles.dateMonth}>{new Date(item.starts_at).toLocaleString('default', { month: 'short' })}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>
          <Ionicons name="people" size={12} color={colors.textMuted} /> {item.attendee_count || 0} going
          {item.capacity && ` / ${item.capacity}`}
        </Text>
        {item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
      </View>
      <TouchableOpacity style={styles.rsvpBtn} onPress={() => handleRsvp(item.id)}>
        <Text style={styles.rsvpText}>RSVP</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No upcoming events</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, alignItems: 'center' },
  dateCol: { width: 50, alignItems: 'center', marginRight: spacing.md },
  dateDay: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.primary },
  dateMonth: { fontSize: fontSize.xs, color: colors.textSecondary, textTransform: 'uppercase' },
  info: { flex: 1 },
  title: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  desc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  rsvpBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  rsvpText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, marginTop: spacing.md },
});
