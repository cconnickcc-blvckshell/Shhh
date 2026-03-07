import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { venuesApi } from '../../../src/api/client';
import { useSocket } from '../../../src/hooks/useSocket';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

function StatBlock({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <View style={dashStyles.statBlock}>
      <Ionicons name={icon as any} size={20} color={colors.primaryLight} />
      <Text style={dashStyles.statValue}>{value}</Text>
      <Text style={dashStyles.statLabel}>{label}</Text>
    </View>
  );
}

export default function VenueDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venue, setVenue] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [distressAlerts, setDistressAlerts] = useState<Array<{ userId: string; venueId: string }>>([]);
  const socket = useSocket();

  const loadVenue = () => id ? venuesApi.get(id).then((r) => setVenue(r.data)).catch(() => setVenue(null)) : Promise.resolve();
  const loadDashboard = () => id ? venuesApi.getDashboard(id).then(setData).catch(() => setData(null)) : Promise.resolve();

  const load = () => {
    if (!id) return Promise.resolve();
    return Promise.all([loadVenue(), loadDashboard()]);
  };

  useEffect(() => {
    let cancelled = false;
    load().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id || !socket.onVenueDistress) return;
    const unsub = socket.onVenueDistress((payload: { userId: string; venueId: string }) => {
      if (payload.venueId === id) {
        setDistressAlerts((prev) => [...prev, payload]);
        Alert.alert(
          'Distress Signal',
          'A guest has signaled distress at this venue. Please check on them.',
          [{ text: 'OK' }]
        );
      }
    });
    return unsub;
  }, [id, socket.onVenueDistress]);

  const onRefresh = () => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  };

  if (!id) {
    return (
      <View style={dashStyles.container}>
        <Text style={dashStyles.error}>Missing venue</Text>
        <TouchableOpacity onPress={() => router.back()} style={dashStyles.backBtn}>
          <Text style={dashStyles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !data) {
    return (
      <View style={dashStyles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={dashStyles.loadingText}>Loading dashboard…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={dashStyles.container}>
        <Text style={dashStyles.error}>Could not load dashboard. You may need to be owner or staff.</Text>
        <TouchableOpacity onPress={() => router.back()} style={dashStyles.backBtn}>
          <Text style={dashStyles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const realtime = data.realtime || {};
  const today = data.today || {};
  const upcomingEvents = data.upcomingEvents || [];
  const specials = data.specials || [];
  const recentReviews = data.recentReviews || [];
  const activeAds = data.activeAds || [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ScrollView
      style={dashStyles.container}
      contentContainerStyle={dashStyles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={dashStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={dashStyles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={dashStyles.headerTitle} numberOfLines={1}>{venue?.name || 'Venue Dashboard'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Actions — work inside the dashboard */}
      <View style={dashStyles.actionsSection}>
        <Text style={dashStyles.sectionTitle}>Manage</Text>
        <View style={dashStyles.actionsRow}>
          <TouchableOpacity style={dashStyles.actionBtn} onPress={() => router.push(`/profile/venue-edit/${id}`)}>
            <Ionicons name="create-outline" size={22} color={colors.primaryLight} />
            <Text style={dashStyles.actionLabel}>Edit venue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dashStyles.actionBtn} onPress={() => router.push(`/profile/venue-add-special/${id}`)}>
            <Ionicons name="pricetag-outline" size={22} color={colors.primaryLight} />
            <Text style={dashStyles.actionLabel}>Add special</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dashStyles.actionBtn} onPress={() => router.push(`/profile/venue-staff/${id}`)}>
            <Ionicons name="people-outline" size={22} color={colors.primaryLight} />
            <Text style={dashStyles.actionLabel}>Staff</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dashStyles.actionBtn} onPress={() => router.push({ pathname: '/profile/create-event', params: { venueId: id } })}>
            <Ionicons name="calendar-outline" size={22} color={colors.primaryLight} />
            <Text style={dashStyles.actionLabel}>Create event</Text>
          </TouchableOpacity>
        </View>
      </View>

      {distressAlerts.length > 0 && (
        <View style={[dashStyles.section, { backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: borderRadius.lg, padding: spacing.md, marginHorizontal: spacing.lg }]}>
          <Text style={[dashStyles.sectionTitle, { color: '#EF4444' }]}>Active Distress Alerts</Text>
          {distressAlerts.map((a, i) => (
            <View key={i} style={dashStyles.listItem}>
              <Text style={dashStyles.listItemTitle}>Guest signaled distress</Text>
              <Text style={dashStyles.listItemMeta}>Just now — check on them</Text>
            </View>
          ))}
        </View>
      )}

      <View style={dashStyles.section}>
        <Text style={dashStyles.sectionTitle}>Right now</Text>
        <View style={dashStyles.statsRow}>
          <StatBlock label="Checked in" value={realtime.currentlyCheckedIn ?? 0} icon="people" />
          <StatBlock label="Chat rooms" value={realtime.activeChatRooms ?? 0} icon="chatbubbles" />
          <StatBlock label="Nearby online" value={realtime.nearbyOnline ?? 0} icon="radio" />
        </View>
      </View>

      <View style={dashStyles.section}>
        <Text style={dashStyles.sectionTitle}>Today</Text>
        <View style={dashStyles.statsRow}>
          <StatBlock label="Check-ins" value={today.checkins ?? 0} icon="log-in" />
          <StatBlock label="Unique visitors" value={today.unique_visitors ?? 0} icon="person" />
          <StatBlock label="Ad revenue ($)" value={((today.ad_revenue_cents ?? 0) / 100).toFixed(0)} icon="cash" />
        </View>
      </View>

      {upcomingEvents.length > 0 && (
        <View style={dashStyles.section}>
          <Text style={dashStyles.sectionTitle}>Upcoming events</Text>
          {upcomingEvents.map((e: any) => (
            <TouchableOpacity key={e.id} style={dashStyles.listItem} onPress={() => router.push(`/event/${e.id}`)}>
              <Text style={dashStyles.listItemTitle}>{e.title}</Text>
              <Text style={dashStyles.listItemMeta}>
                {e.starts_at ? new Date(e.starts_at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''} · {e.status || 'upcoming'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {specials.length > 0 && (
        <View style={dashStyles.section}>
          <Text style={dashStyles.sectionTitle}>Specials</Text>
          {specials.map((s: any) => (
            <View key={s.id} style={dashStyles.listItem}>
              <Text style={dashStyles.listItemTitle}>{s.title}</Text>
              <Text style={dashStyles.listItemMeta}>
                {s.day_of_week != null ? dayNames[s.day_of_week] : ''} {s.start_time && s.end_time ? `${s.start_time}–${s.end_time}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {recentReviews.length > 0 && (
        <View style={dashStyles.section}>
          <Text style={dashStyles.sectionTitle}>Recent reviews</Text>
          {recentReviews.slice(0, 5).map((r: any, i: number) => (
            <View key={i} style={dashStyles.reviewRow}>
              <Text style={dashStyles.rating}>{'★'.repeat(r.rating || 0)}</Text>
              <Text style={dashStyles.reviewDate}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</Text>
            </View>
          ))}
        </View>
      )}

      {activeAds.length > 0 && (
        <View style={dashStyles.section}>
          <Text style={dashStyles.sectionTitle}>Active ads</Text>
          {activeAds.map((a: any) => (
            <View key={a.id} style={dashStyles.listItem}>
              <Text style={dashStyles.listItemTitle}>{a.headline}</Text>
              <Text style={dashStyles.listItemMeta}>Impressions: {a.impression_count ?? 0} · Taps: {a.tap_count ?? 0}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const dashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  loadingText: { color: colors.textMuted, marginTop: 12 },
  error: { color: colors.textMuted, padding: 24, textAlign: 'center' },
  backBtn: { marginHorizontal: 24, marginTop: 16, padding: 14, backgroundColor: colors.surface, borderRadius: borderRadius.lg, alignItems: 'center' },
  backBtnText: { color: colors.primaryLight, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.sm },
  headerBack: { padding: spacing.sm },
  headerTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800', flex: 1 },
  actionsSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '700', marginBottom: spacing.sm, textTransform: 'uppercase' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, backgroundColor: colors.primary + '22', borderWidth: 1, borderColor: colors.primary + '44', borderRadius: borderRadius.lg, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: colors.primaryLight, fontSize: 12, fontWeight: '700', marginTop: 6 },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statBlock: { flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 4 },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  listItem: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  listItemTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  listItemMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  rating: { color: '#FBBF24', fontSize: 12 },
  reviewDate: { color: colors.textMuted, fontSize: 12 },
});
