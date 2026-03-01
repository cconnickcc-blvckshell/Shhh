import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Vibration, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../src/api/client';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, fontSize, borderRadius, spacing } from '../../src/constants/theme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { BannerImage } from '../../src/components/Backgrounds';

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
        style={s.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/event/${item.id}`)}
      >
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
      </TouchableOpacity>
    );
  };

  if (loading && events.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.centerLoad}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={s.loadText}>Loading events...</Text>
        </View>
      </View>
    );
  }
  if (loadError && events.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.errorBox}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={s.errorText}>{loadError}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); load(); }}>
            <Text style={s.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
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
          <View style={s.empty}><View style={s.emptyIcon}><Ionicons name="flame-outline" size={36} color={colors.primaryLight} /></View><Text style={s.emptyTitle}>No events nearby</Text></View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centerLoad: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loadText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.md },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 80 },
  errorText: { color: colors.text, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.md },
  retryBtn: { marginTop: spacing.lg, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: borderRadius.lg },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: fontSize.sm },
  card: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', minWidth: 0 },
  banner: { height: 50, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  dateBox: { width: 42, alignItems: 'center', marginRight: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, paddingVertical: 6 },
  dateDay: { color: colors.primaryLight, fontSize: 20, fontWeight: '800', lineHeight: 22 },
  dateMonth: { color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '700' },
  info: { flex: 1 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  metaText: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  venue: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 },
  desc: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 3, lineHeight: 16 },
  rsvpBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(147,51,234,0.15)', borderWidth: 1, borderColor: 'rgba(147,51,234,0.3)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  empty: { alignItems: 'center', paddingTop: 120 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(147,51,234,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  columnWrap: { gap: 12, marginBottom: 8 },
});
