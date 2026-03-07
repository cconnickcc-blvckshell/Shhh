import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Vibration, ScrollView, Image, Platform, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi, tonightApi } from '../../src/api/client';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, fontSize, spacing } from '../../src/constants/theme';
import { PageShell } from '../../src/components/layout';
import { SafeState } from '../../src/components/ui';
import { mapApiError } from '../../src/utils/errorMapper';

const FALLBACK_LAT = 40.7128;
const FALLBACK_LNG = -74.006;

const EVENT_IMAGES = [
  Platform.OS === 'web' ? '/event-neon.png' : require('../../assets/images/purple-galaxy.png'),
  Platform.OS === 'web' ? '/event-masquerade.png' : require('../../assets/images/purple-banner.jpg'),
  Platform.OS === 'web' ? '/event-pool.png' : require('../../assets/images/purple-bubble.jpg'),
  Platform.OS === 'web' ? '/event-latex.png' : require('../../assets/images/purple-galaxy.png'),
  Platform.OS === 'web' ? '/event-hotel.png' : require('../../assets/images/purple-banner.jpg'),
];

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
    if (!location.loading) { setLoading(true); load(); }
  }, [load, location.loading]);

  useEffect(() => {
    if (location.loading) return;
    tonightApi.getFeed(lat, lng).then((r) => setTonightFeed(r.data)).catch(() => setTonightFeed(null));
  }, [lat, lng, location.loading]);

  const onRefresh = async () => {
    setRefreshing(true); setLoadError(null); await load();
    tonightApi.getFeed(lat, lng).then((r) => setTonightFeed(r.data)).catch(() => {});
    setRefreshing(false);
  };

  const toggleRsvp = async (eventId: string) => {
    Vibration.vibrate(10);
    if (attending.has(eventId)) {
      setAttending(prev => { const next = new Set(prev); next.delete(eventId); return next; });
    } else {
      const key = `rsvp-${eventId}-going`;
      await eventsApi.rsvp(eventId, 'going', key);
      setAttending(prev => new Set(prev).add(eventId));
      Vibration.vibrate([0, 40, 20, 40]);
    }
  };

  const renderEvent = ({ item, index }: { item: any; index: number }) => {
    const d = new Date(item.starts_at);
    const isGoing = attending.has(item.id);
    const imgSource = Platform.OS === 'web'
      ? { uri: EVENT_IMAGES[index % EVENT_IMAGES.length] as string }
      : EVENT_IMAGES[index % EVENT_IMAGES.length];

    return (
      <TouchableOpacity
        style={s.eventCard}
        activeOpacity={0.9}
        onPress={() => router.push(`/event/${item.id}`)}
      >
        <ImageBackground
          source={imgSource as any}
          style={s.eventImageBg}
          imageStyle={s.eventImage}
          resizeMode="cover"
        >
          <View style={s.eventOverlay} />
          <View style={s.eventContent}>
            <View style={s.eventTop}>
              <View style={s.datePill}>
                <Text style={s.dateDay}>{d.getDate()}</Text>
                <Text style={s.dateMonth}>{d.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
              </View>
              {item.vibe_tag ? (
                <View style={s.vibePill}>
                  <Text style={s.vibePillText}>{item.vibe_tag.replace(/_/g, ' ')}</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[s.rsvpBtn, isGoing && s.rsvpBtnActive]}
                onPress={(e) => { e?.stopPropagation?.(); toggleRsvp(item.id); }}
              >
                <Ionicons name={isGoing ? 'heart' : 'heart-outline'} size={18} color={isGoing ? '#fff' : 'rgba(255,255,255,0.7)'} />
              </TouchableOpacity>
            </View>
            <View style={s.eventBottom}>
              <Text style={s.eventTitle} numberOfLines={1}>{item.title}</Text>
              {item.description ? <Text style={s.eventDesc} numberOfLines={2}>{item.description}</Text> : null}
              <View style={s.eventMeta}>
                <View style={s.metaItem}>
                  <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.5)" />
                  <Text style={s.metaText}>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={s.metaItem}>
                  <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.5)" />
                  <Text style={s.metaText}>{item.attendee_count || 0}{item.capacity ? ` / ${item.capacity}` : ''}{' going'}</Text>
                </View>
                {item.venue_name ? (
                  <View style={s.metaItem}>
                    <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.5)" />
                    <Text style={s.metaText} numberOfLines={1}>{item.venue_name}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  if (loading && events.length === 0) {
    return (<PageShell><SafeState variant="loading" message="Loading events..." /></PageShell>);
  }
  if (loadError && events.length === 0) {
    return (<PageShell><SafeState variant="error" message={loadError} onRetry={() => { setLoading(true); load(); }} /></PageShell>);
  }

  return (
    <PageShell>
      <View style={s.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          <TouchableOpacity style={[s.filterChip, showThisWeek && s.filterChipActive]} onPress={() => setShowThisWeek(!showThisWeek)}>
            <Ionicons name="calendar-outline" size={13} color={showThisWeek ? '#B35CFF' : 'rgba(255,255,255,0.35)'} />
            <Text style={[s.filterChipText, showThisWeek && s.filterChipTextActive]}>{'This week'}</Text>
          </TouchableOpacity>
          {VIBE_OPTIONS.map((v) => (
            <TouchableOpacity key={v.key || 'all'} style={[s.filterChip, vibeFilter === v.key && s.filterChipActive]} onPress={() => setVibeFilter(v.key)}>
              <Text style={[s.filterChipText, vibeFilter === v.key && s.filterChipTextActive]}>{v.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={events}
        keyExtractor={(i) => i.id}
        renderItem={renderEvent}
        numColumns={1}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          tonightFeed && (tonightFeed.events?.length > 0 || tonightFeed.venues?.length > 0) ? (
            <View style={s.tonightSection}>
              <Text style={s.tonightLabel}>{'TONIGHT'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tonightScroll}>
                {tonightFeed.events?.slice(0, 5).map((ev: any) => (
                  <TouchableOpacity key={ev.id} style={s.tonightCard} onPress={() => router.push(`/event/${ev.id}`)}>
                    <Ionicons name="flame" size={18} color="#B35CFF" />
                    <Text style={s.tonightCardTitle} numberOfLines={1}>{ev.title}</Text>
                    <Text style={s.tonightCardMeta}>{ev.attendee_count || 0}{' going'}</Text>
                  </TouchableOpacity>
                ))}
                {tonightFeed.venues?.slice(0, 3).map((v: any) => (
                  <TouchableOpacity key={v.id} style={s.tonightCard} onPress={() => router.push(`/venue/${v.id}`)}>
                    <Ionicons name="business" size={18} color="#B35CFF" />
                    <Text style={s.tonightCardTitle} numberOfLines={1}>{v.name}</Text>
                    <Text style={s.tonightCardMeta}>{v.currentAttendees ?? 0}{' here'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B35CFF" />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <SafeState variant="empty" title="No events nearby" message="Pull down to refresh" icon="flame-outline" />
            <TouchableOpacity style={s.emptyCta} onPress={() => router.push('/profile/create-event')} activeOpacity={0.8}>
              <Text style={s.emptyCtaText}>Start something → Create an event</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </PageShell>
  );
}

const s = StyleSheet.create({
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  emptyWrap: { flex: 1, paddingVertical: 80 },
  emptyCta: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 24, backgroundColor: 'rgba(124,43,255,0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(179,92,255,0.3)', alignSelf: 'center' },
  emptyCtaText: { color: '#B35CFF', fontSize: 14, fontWeight: '700' },

  eventCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124,43,255,0.12)',
  },
  eventImageBg: {
    minHeight: 240,
    justifyContent: 'space-between',
  },
  eventImage: {
    borderRadius: 20,
  },
  eventOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundImage: 'linear-gradient(180deg, rgba(6,4,10,0.3) 0%, rgba(6,4,10,0.1) 30%, rgba(6,4,10,0.7) 70%, rgba(6,4,10,0.95) 100%)',
  } as any,
  eventContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    zIndex: 1,
  },
  eventTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  datePill: {
    backgroundColor: 'rgba(6,4,10,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(124,43,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dateDay: { color: '#B35CFF', fontSize: 22, fontWeight: '900', lineHeight: 24 },
  dateMonth: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  vibePill: {
    backgroundColor: 'rgba(124,43,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(179,92,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  vibePillText: { color: '#D4BFFF', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  rsvpBtn: {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  } as any,
  rsvpBtnActive: {
    backgroundColor: 'rgba(124,43,255,0.5)',
    borderColor: 'rgba(179,92,255,0.6)',
  },
  eventBottom: {
    marginTop: 'auto',
    paddingTop: 12,
  } as any,
  eventTitle: { color: '#F7F2FF', fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  eventDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 19, marginBottom: 10 },
  eventMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500' },

  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,43,255,0.06)',
    paddingVertical: 12,
  },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterChipActive: { backgroundColor: 'rgba(124,43,255,0.15)', borderColor: 'rgba(179,92,255,0.3)' },
  filterChipText: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#B35CFF' },

  tonightSection: { marginBottom: 20, paddingTop: 4 },
  tonightLabel: { color: 'rgba(179,92,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  tonightScroll: { gap: 10 },
  tonightCard: {
    width: 150,
    padding: 16,
    backgroundColor: 'rgba(124,43,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(124,43,255,0.15)',
  },
  tonightCardTitle: { color: '#F7F2FF', fontSize: 14, fontWeight: '700', marginTop: 8 },
  tonightCardMeta: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 },
});
