import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Vibration, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi, tonightApi } from '../../src/api/client';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, fontSize, borderRadius, spacing } from '../../src/constants/theme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { BannerImage } from '../../src/components/Backgrounds';
import { PageShell, Card } from '../../src/components/layout';
import { SafeState } from '../../src/components/ui';
import { mapApiError } from '../../src/utils/errorMapper';

const FALLBACK_LAT = 40.7128;
const FALLBACK_LNG = -74.006;

const VIBE_OPTIONS = [
  { key: '', label: 'All' },
  { key: 'newbie_friendly', label: 'Newbie' },
  { key: 'social_mix', label: 'Social' },
  { key: 'talk_first', label: 'Talk first' },
  { key: 'couples_only', label: 'Couples' },
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'kink', label: 'Kink' },
];

export default function EventsScreen() {
  const location = useLocation();
  const lat = location.loading ? FALLBACK_LAT : location.latitude;
  const lng = location.loading ? FALLBACK_LNG : location.longitude;
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attending, setAttending] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [vibeFilter, setVibeFilter] = useState('');
  const [showThisWeek, setShowThisWeek] = useState(false);
  const [tonightFeed, setTonightFeed] = useState<{ events: any[]; venues: any[] } | null>(null);
  const { isDesktop } = useBreakpoint();
  const numColumns = isDesktop ? 2 : 1;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const r = showThisWeek
        ? await eventsApi.thisWeek(lat, lng, 50, vibeFilter || undefined)
        : await eventsApi.nearby(lat, lng, 50, vibeFilter || undefined);
      setEvents(r.data);
    } catch (err: any) {
      setLoadError(mapApiError(err));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, vibeFilter, showThisWeek]);

  useEffect(() => {
    if (!location.loading) {
      setLoading(true);
      load();
    }
  }, [load, location.loading]);

  useEffect(() => {
    if (location.loading) return;
    tonightApi.getFeed(lat, lng).then((r) => setTonightFeed(r.data)).catch(() => setTonightFeed(null));
  }, [lat, lng, location.loading]);

  const onRefresh = async () => { setRefreshing(true); setLoadError(null); await load(); tonightApi.getFeed(lat, lng).then((r) => setTonightFeed(r.data)).catch(() => {}); setRefreshing(false); };

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
    const isLocked = item.visibility_rule && item.visibility_rule !== 'open' && !item.venue_name && !isGoing;

    return (
      <TouchableOpacity
        style={s.cardTouchable}
        activeOpacity={0.85}
        onPress={() => router.push(`/event/${item.id}`)}
      >
        <Card noPadding minHeight={120}>
          <BannerImage style={s.banner}>
            <Ionicons name="sparkles" size={20} color={colors.primaryLight} />
            {isLocked && (
              <View style={s.lockedBadge}>
                <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.4)" />
                <Text style={s.lockedBadgeText}>Join to see</Text>
              </View>
            )}
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
            {item.vibe_tag && (
              <View style={s.vibeTag}>
                <Text style={s.vibeText}>{item.vibe_tag.replace(/_/g, ' ')}</Text>
              </View>
            )}
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
      <View style={s.filterBar}>
        <TouchableOpacity style={[s.filterChip, showThisWeek && s.filterChipActive]} onPress={() => setShowThisWeek(!showThisWeek)}>
          <Text style={[s.filterChipText, showThisWeek && s.filterChipTextActive]}>This week</Text>
        </TouchableOpacity>
        {VIBE_OPTIONS.map((v) => (
          <TouchableOpacity key={v.key || 'all'} style={[s.filterChip, vibeFilter === v.key && s.filterChipActive]} onPress={() => setVibeFilter(v.key)}>
            <Text style={[s.filterChipText, vibeFilter === v.key && s.filterChipTextActive]}>{v.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={events}
        keyExtractor={(i) => i.id}
        renderItem={renderEvent}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={{ padding: 12 }}
        ListHeaderComponent={
          tonightFeed && (tonightFeed.events?.length > 0 || tonightFeed.venues?.length > 0) ? (
            <View style={s.tonightSection}>
              <Text style={s.tonightTitle}>Tonight</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tonightScroll}>
                {tonightFeed.events?.slice(0, 5).map((ev: any) => (
                  <TouchableOpacity key={ev.id} style={s.tonightCard} onPress={() => router.push(`/event/${ev.id}`)}>
                    <Ionicons name="flame" size={20} color={colors.primaryLight} />
                    <Text style={s.tonightCardTitle} numberOfLines={1}>{ev.title}</Text>
                    <Text style={s.tonightCardMeta}>{ev.attendee_count || 0} going</Text>
                  </TouchableOpacity>
                ))}
                {tonightFeed.venues?.slice(0, 3).map((v: any) => (
                  <TouchableOpacity key={v.id} style={s.tonightCard} onPress={() => router.push(`/venue/${v.id}`)}>
                    <Ionicons name="business" size={20} color={colors.primaryLight} />
                    <Text style={s.tonightCardTitle} numberOfLines={1}>{v.name}</Text>
                    <Text style={s.tonightCardMeta}>{v.currentAttendees ?? 0} here</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null
        }
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
  banner: { height: 50, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  lockedBadge: { position: 'absolute', top: 6, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  lockedBadgeText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
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
  filterBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
  filterChipActive: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryLight },
  filterChipText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: colors.primaryLight },
  vibeTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(147,51,234,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  vibeText: { color: colors.primaryLight, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  tonightSection: { marginBottom: 16 },
  tonightTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
  tonightScroll: { marginHorizontal: -4 },
  tonightCard: { width: 140, marginHorizontal: 4, padding: 12, backgroundColor: 'rgba(147,51,234,0.12)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(147,51,234,0.25)' },
  tonightCardTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 6 },
  tonightCardMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
});
