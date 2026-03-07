import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell, Card } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';
import { SafeState } from '../../src/components/ui';

export default function HostingScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    eventsApi.getMyHosted().then((res) => { if (!cancelled) setEvents(res.data || []); }).catch(() => { if (!cancelled) setEvents([]); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading && events.length === 0) {
    return (
      <PremiumDarkBackground style={styles.wrapper}>
        <PageShell>
          <SafeState variant="loading" message="Loading your events..." />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={styles.wrapper}>
      <PageShell>
        <SubPageHeader
          title="Hosting"
          subtitle="Events you're hosting"
          rightAction={
            <TouchableOpacity onPress={() => router.push('/profile/create-event')} style={styles.headerBtn}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          }
        />

      <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/profile/create-event')} activeOpacity={0.8}>
        <Ionicons name="add-circle" size={22} color="#fff" />
        <Text style={styles.createBtnText}>Create event</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Events I'm hosting</Text>
      {events.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No events yet</Text>
          <Text style={styles.emptySub}>Create an event to show it here.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {events.map((evt) => (
            <Card key={evt.id} style={styles.eventCard}>
              <View style={styles.eventCardContent}>
                <TouchableOpacity onPress={() => router.push(`/event/${evt.id}`)} activeOpacity={0.8} style={styles.eventCardText}>
                  <Text style={styles.cardTitle}>{evt.title}</Text>
                  {evt.venue_name && <Text style={styles.cardVenue}>📍 {evt.venue_name}</Text>}
                  <Text style={styles.cardMeta}>
                    {evt.starts_at ? new Date(evt.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                    {evt.attendee_count != null && ` · ${evt.attendee_count} going`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push(`/profile/event-edit/${evt.id}`)} hitSlop={12} style={styles.editBtn}>
                  <Ionicons name="pencil" size={18} color={colors.primaryLight} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
      </PageShell>
    </PremiumDarkBackground>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  headerBtn: { padding: spacing.xs },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, marginHorizontal: spacing.lg, paddingVertical: 14, borderRadius: borderRadius.lg,
  },
  createBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.xl, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  eventCard: { marginBottom: spacing.md },
  eventCardContent: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  eventCardText: { flex: 1 },
  editBtn: { padding: spacing.xs },
  cardTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  cardVenue: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4 },
  cardMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.md },
  emptySub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4 },
});
