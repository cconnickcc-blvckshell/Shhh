import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

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

  const renderEvent = ({ item }: { item: any }) => {
    const date = new Date(item.starts_at);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85}>
        <View style={styles.cardImage}>
          <Ionicons name="sparkles" size={32} color={colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{day}</Text>
            <Text style={styles.dateMonth}>{month}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={styles.metaText}>{time}</Text>
              <Ionicons name="people-outline" size={12} color={colors.textMuted} style={{ marginLeft: 8 }} />
              <Text style={styles.metaText}>{item.attendee_count || 0}{item.capacity ? `/${item.capacity}` : ''}</Text>
            </View>
            {item.description && <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>}
          </View>
          <TouchableOpacity style={styles.rsvpBtn} onPress={() => handleRsvp(item.id)}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="flame-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No events nearby</Text>
            <Text style={styles.emptySub}>Check back later for upcoming events</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, overflow: 'hidden' },
  cardImage: {
    height: 80,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  dateBadge: {
    width: 44, alignItems: 'center', marginRight: spacing.md,
    backgroundColor: colors.surfaceLight, borderRadius: borderRadius.sm, paddingVertical: 6,
  },
  dateDay: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '800', lineHeight: 24 },
  dateMonth: { color: colors.textMuted, fontSize: fontSize.xxs, fontWeight: '700' },
  cardInfo: { flex: 1 },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { color: colors.textMuted, fontSize: fontSize.xs },
  desc: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 4 },
  rsvpBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm,
  },
  empty: { alignItems: 'center', paddingTop: 120 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  emptySub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
});
