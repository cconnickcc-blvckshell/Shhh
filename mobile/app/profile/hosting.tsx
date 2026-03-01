import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';

export default function HostingScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    eventsApi.getMyHosted().then((res) => { if (!cancelled) setEvents(res.data || []); }).catch(() => { if (!cancelled) setEvents([]); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <PremiumDarkBackground>
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Hosting</Text>
        <View style={{ width: 40 }} />
      </View>

      <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/profile/create-event')} activeOpacity={0.8}>
        <Ionicons name="add-circle" size={22} color="#fff" />
        <Text style={styles.createBtnText}>Create event</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Events I'm hosting</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : events.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No events yet</Text>
          <Text style={styles.emptySub}>Create an event to show it here.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {events.map((evt) => (
            <TouchableOpacity key={evt.id} style={styles.card} onPress={() => router.push(`/event/${evt.id}`)} activeOpacity={0.8}>
              <Text style={styles.cardTitle}>{evt.title}</Text>
              {evt.venue_name && <Text style={styles.cardVenue}>📍 {evt.venue_name}</Text>}
              <Text style={styles.cardMeta}>
                {evt.starts_at ? new Date(evt.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                {evt.attendee_count != null && ` · ${evt.attendee_count} going`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
    </PremiumDarkBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.md },
  backBtn: { padding: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, marginHorizontal: spacing.lg, paddingVertical: 14, borderRadius: borderRadius.lg,
  },
  createBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginTop: spacing.xl, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: 'rgba(14,11,22,0.9)', borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)' },
  cardTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  cardVenue: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4 },
  cardMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.md },
  emptySub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4 },
});
