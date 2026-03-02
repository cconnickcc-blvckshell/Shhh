import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Vibration } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../src/api/client';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, fontSize, borderRadius, spacing } from '../../src/constants/theme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { BannerImage } from '../../src/components/Backgrounds';
import { PageShell, Card } from '../../src/components/layout';
import { SafeState } from '../../src/components/ui';

const FALLBACK_LAT = 40.7128;
const FALLBACK_LNG = -74.006;

export default function EventsScreen() {
  const location = useLocation();
  const lat = location.loading ? FALLBACK_LAT : location.latitude;
  const lng = location.loading ? FALLBACK_LNG : location.longitude;
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attending, setAttending] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const { isDesktop } = useBreakpoint();
  const numColumns = isDesktop ? 2 : 1;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const r = await eventsApi.nearby(lat, lng);
      setEvents(r.data);
    } catch (err: any) {
      setLoadError(err?.message || 'Something went wrong. Pull down to try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    if (!location.loading) {
      setLoading(true);
      load();
    }
  }, [load, location.loading]);
  const onRefresh = async () => { setRefreshing(true); setLoadError(null); await load(); setRefreshing(false); };

  const toggleRsvp = async (eventId: string) => {
    Vibration.vibrate(10);
    const isAttending = attending.has(eventId);
    if (isAttending) {
      setAttending(prev => { const next = new Set(prev); next.delete(eventId); return next; });
    } else {
      await eventsApi.rsvp(eventId, 'going');
      setAttending(prev => new Set(prev).add(eventId));
      Vibration.vibrate([0, 40, 20, 40]);
    }
  };

  const renderEvent = ({ item }: { item: any }) => {
    const d = new Date(item.starts_at);
    const isGoing = attending.has(item.id);

    return (
      <TouchableOpacity
        style={s.cardTouchable}
        activeOpacity={0.85}
        onPress={() => router.push(`/event/${item.id}`)}
      >
        <Card noPadding minHeight={120}>
          <BannerImage style={s.banner}>
            <Ionicons name="sparkles" size={20} color={colors.primaryLight} />
          </BannerImage>
          <View style={s.cardBody}>
            <View style={s.dateBox}>
              <Text style={s.dateDay}>{d.getDate()}</Text>
              <Text style={s.dateMonth}>{d.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
            </View>
            <View style={s.info}>
            <Text style={s.title} numberOfLines={1}>{item.title}</Text>
            <View style={s.meta}>
              <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.35)" />
              <Text style={s.metaText}>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Ionicons name="people-outline" size={11} color="rgba(255,255,255,0.35)" style={{ marginLeft: 8 }} />
              <Text style={s.metaText}>{item.attendee_count || 0}{item.capacity ? `/${item.capacity}` : ''}</Text>
            </View>
            {item.venue_name && <Text style={s.venue}>📍 {item.venue_name}</Text>}
            {item.description && <Text style={s.desc} numberOfLines={2}>{item.description}</Text>}
          </View>
          <TouchableOpacity style={s.rsvpBtn} onPress={(e) => { e?.stopPropagation?.(); toggleRsvp(item.id); }}>
            <Ionicons name={isGoing ? 'heart' : 'heart-outline'} size={20} color={isGoing ? '#fff' : colors.primaryLight} />
          </TouchableOpacity>
        </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading && events.length === 0) {
    return (
      <PageShell>
        <SafeState variant="loading" message="Loading events..." />
      </PageShell>
    );
  }
  if (loadError && events.length === 0) {
    return (
      <PageShell>
        <SafeState variant="error" message={loadError} onRetry={() => { setLoading(true); load(); }} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <FlatList
        data={events}
        keyExtractor={(i) => i.id}
        renderItem={renderEvent}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={numColumns > 1 ? s.columnWrap : undefined}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <SafeState variant="empty" title="No events nearby" message="Pull down to refresh" icon="flame-outline" />
          </View>
        }
      />
    </PageShell>
  );
}

const s = StyleSheet.create({
  emptyWrap: { flex: 1, paddingVertical: 80 },
  cardTouchable: { flex: 1, minWidth: 0 },
  banner: { height: 50, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  dateBox: { width: 42, alignItems: 'center', marginRight: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, paddingVertical: 6 },
  dateDay: { color: colors.primaryLight, fontSize: 20, fontWeight: '800', lineHeight: 22 },
  dateMonth: { color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '700' },
  info: { flex: 1, minWidth: 0 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  metaText: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  venue: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 },
  desc: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 3, lineHeight: 16 },
  rsvpBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(147,51,234,0.15)', borderWidth: 1, borderColor: 'rgba(147,51,234,0.3)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  columnWrap: { gap: 12, marginBottom: 8 },
});
