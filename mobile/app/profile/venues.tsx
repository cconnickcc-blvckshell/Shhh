import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { venuesApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell, Card } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';
import { SafeState } from '../../src/components/ui';

export default function MyVenuesScreen() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    venuesApi.getMyVenues().then((res) => { if (!cancelled) setVenues(res.data || []); }).catch(() => { if (!cancelled) setVenues([]); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading && venues.length === 0) {
    return (
      <PremiumDarkBackground style={styles.wrapper}>
        <PageShell>
          <SafeState variant="loading" message="Loading venues..." />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={styles.wrapper}>
      <PageShell>
        <SubPageHeader
          title="Venues"
          subtitle="Venues you manage"
          rightAction={
            <TouchableOpacity onPress={() => router.push('/profile/create-venue')} style={styles.headerBtn}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          }
        />

      <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/profile/create-venue')} activeOpacity={0.8}>
        <Ionicons name="add-circle" size={22} color="#fff" />
        <Text style={styles.createBtnText}>Create venue</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Venues I manage</Text>
      {venues.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="business-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No venues yet</Text>
          <Text style={styles.emptySub}>Create a venue or get added as staff to see the dashboard here.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {venues.map((v) => (
            <Card key={v.id} style={styles.venueCard}>
            <TouchableOpacity onPress={() => router.push(`/profile/venue-dashboard/${v.id}`)} activeOpacity={0.8}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{v.name}</Text>
                <View style={[styles.roleBadge, v.myRole === 'owner' && styles.roleOwner]}>
                  <Text style={styles.roleText}>{v.myRole === 'owner' ? 'Owner' : 'Staff'}</Text>
                </View>
              </View>
              {v.tagline && <Text style={styles.cardTagline}>{v.tagline}</Text>}
              <Text style={styles.cardMeta}>Dashboard →</Text>
            </TouchableOpacity>
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
  venueCard: { marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  cardTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', flex: 1 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleOwner: { backgroundColor: colors.primarySoft },
  roleText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  cardTagline: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4 },
  cardMeta: { color: colors.primaryLight, fontSize: fontSize.xs, marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.md },
  emptySub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4, textAlign: 'center', paddingHorizontal: 24 },
});
