import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions, Share, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, venuesApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venue, setVenue] = useState<any>(null);
  const [grid, setGrid] = useState<any[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (id) api<{ data: any }>(`/v1/venues/${id}/full`).then(r => setVenue(r.data)).catch(() => router.back());
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setGridLoading(true);
    venuesApi.getGrid(id).then(r => { setGrid(r.data || []); }).catch(() => setGrid([])).finally(() => setGridLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!venue || !id) return;
    try {
      const url = `https://shhh.app/venue/${id}`;
      await Share.share({
        message: `${venue.name}${venue.tagline ? ` — ${venue.tagline}` : ''}\n${url}`,
        url: url,
        title: venue.name,
      });
    } catch {}
  };

  const handleReview = () => {
    if (!id) return;
    router.push(`/venue/review/${id}`);
  };

  if (!venue) return <View style={s.container}><Text style={s.loading}>Loading...</Text></View>;

  return (
    <ScrollView style={s.container} bounces={false}>
      {/* Hero */}
      <View style={[s.hero, { height: width * 0.55 }]}>
        <View style={s.heroOverlay} />
        <Ionicons name="business" size={48} color="rgba(255,255,255,0.2)" />
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.heroBottom}>
          <Text style={s.venueName}>{venue.name}</Text>
          {venue.tagline && <Text style={s.tagline}>{venue.tagline}</Text>}
          <View style={s.metaRow}>
            {venue.price_range && <Text style={s.metaPill}>{venue.price_range}</Text>}
            {venue.age_minimum && <Text style={s.metaPill}>{venue.age_minimum}+</Text>}
            {venue.type && <Text style={s.metaPill}>{venue.type}</Text>}
          </View>
        </View>
      </View>

      <View style={s.body}>
        {/* Quick actions */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.actionBtn} onPress={() => api(`/v1/venues/${id}/checkin`, { method: 'POST' })}>
            <Ionicons name="location" size={18} color={colors.primaryLight} />
            <Text style={s.actionText}>Check In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color={colors.primaryLight} />
            <Text style={s.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={handleReview}>
            <Ionicons name="star-outline" size={18} color={colors.primaryLight} />
            <Text style={s.actionText}>Review</Text>
          </TouchableOpacity>
        </View>

        {/* Who's here (grid) */}
        {(grid.length > 0 || gridLoading) && (
          <View style={s.section} accessibilityRole="none">
            <Text style={s.sectionTitle} accessibilityRole="header">WHO'S HERE</Text>
            {gridLoading ? (
              <ActivityIndicator size="small" color={colors.primaryLight} style={{ paddingVertical: 16 }} />
            ) : (
              <View style={s.gridRow}>
                {grid.slice(0, 12).map((tile: any, i: number) => (
                  <View key={i} style={s.gridTile}>
                    {tile.anonymous ? (
                      <Ionicons name="person" size={20} color="rgba(255,255,255,0.4)" />
                    ) : (
                      <Text style={s.gridTileName} numberOfLines={1}>{tile.personaDisplayName || 'Unknown'}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Realtime */}
        {venue.realtime && (
          <View style={s.liveCard}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>
              {venue.realtime.currentlyCheckedIn} here now · {venue.realtime.nearbyOnline} nearby
            </Text>
          </View>
        )}

        {/* About */}
        {venue.description && (
          <View style={s.section} accessibilityRole="none">
            <Text style={s.sectionTitle} accessibilityRole="header">ABOUT</Text>
            <Text style={s.descText}>{venue.description}</Text>
          </View>
        )}

        {/* Features */}
        {venue.features?.length > 0 && (
          <View style={s.section} accessibilityRole="none">
            <Text style={s.sectionTitle} accessibilityRole="header">FEATURES</Text>
            <View style={s.tagRow}>
              {venue.features.map((f: string) => (
                <View key={f} style={s.featureTag}><Text style={s.featureText}>{f.replace('_', ' ')}</Text></View>
              ))}
            </View>
          </View>
        )}

        {/* Dress code */}
        {venue.dress_code && (
          <View style={s.section} accessibilityRole="none">
            <Text style={s.sectionTitle} accessibilityRole="header">DRESS CODE</Text>
            <Text style={s.descText}>{venue.dress_code}</Text>
          </View>
        )}

        {/* Specials */}
        {venue.specials?.length > 0 && (
          <View style={s.section} accessibilityRole="none">
            <Text style={s.sectionTitle} accessibilityRole="header">SPECIALS</Text>
            {venue.specials.map((sp: any) => (
              <View key={sp.id} style={s.specialCard}>
                <Text style={s.specialTitle}>{sp.title}</Text>
                {sp.description && <Text style={s.specialDesc}>{sp.description}</Text>}
                {sp.start_time && <Text style={s.specialTime}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][sp.day_of_week]} {sp.start_time}–{sp.end_time}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Upcoming events */}
        {venue.upcomingEvents?.length > 0 && (
          <View style={s.section} accessibilityRole="none">
            <Text style={s.sectionTitle} accessibilityRole="header">UPCOMING EVENTS</Text>
            {venue.upcomingEvents.map((ev: any) => (
              <TouchableOpacity key={ev.id} style={s.eventCard} onPress={() => router.push(`/event/${ev.id}`)}>
                <Text style={s.eventTitle}>{ev.title}</Text>
                <Text style={s.eventDate}>{new Date(ev.starts_at).toLocaleDateString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reviews summary */}
        {venue.reviews?.summary && parseInt(venue.reviews.summary.total) > 0 && (
          <View style={s.section} accessibilityRole="none">
            <Text style={s.sectionTitle} accessibilityRole="header">REVIEWS</Text>
            <View style={s.reviewSummary}>
              <Text style={s.reviewAvg}>{parseFloat(venue.reviews.summary.avg_rating).toFixed(1)}</Text>
              <Ionicons name="star" size={16} color={colors.host} />
              <Text style={s.reviewCount}>({venue.reviews.summary.total} reviews)</Text>
            </View>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: 60 },
  hero: { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  backBtn: { position: 'absolute', top: 50, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.6)' },
  venueName: { color: '#fff', fontSize: 24, fontWeight: '800' },
  tagline: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  metaPill: { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: '600' },
  body: { padding: 16 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(147,51,234,0.1)', borderWidth: 1, borderColor: 'rgba(147,51,234,0.25)', paddingVertical: 12, borderRadius: 12 },
  actionText: { color: colors.primaryLight, fontSize: 13, fontWeight: '600' },
  liveCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(52,211,153,0.08)', padding: 12, borderRadius: 12, marginBottom: 16 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  liveText: { color: colors.success, fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  descText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureTag: { backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  featureText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  specialCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginBottom: 8 },
  specialTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  specialDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  specialTime: { color: colors.primaryLight, fontSize: 12, fontWeight: '600', marginTop: 4 },
  eventCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginBottom: 8 },
  eventTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  eventDate: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewAvg: { color: '#fff', fontSize: 24, fontWeight: '800' },
  reviewCount: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridTile: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  gridTileName: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600', maxWidth: 52 },
});
