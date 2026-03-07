import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { groupsApi } from '../../src/api/client';
import { colors, spacing, fontSize } from '../../src/constants/theme';
import { mapApiError } from '../../src/utils/errorMapper';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';
import { SafeState } from '../../src/components/ui';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [group, setGroup] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!id) return;
    groupsApi.get(id).then((r) => { setGroup(r.data); setLoading(false); }).catch(() => setLoading(false));
    groupsApi.getEvents(id).then((r) => setEvents(r.data || [])).catch(() => setEvents([]));
  }, [id]);

  const handleJoin = async () => {
    if (!id) return;
    try {
      await groupsApi.join(id);
      setJoined(true);
      groupsApi.get(id).then((r) => setGroup(r.data));
    } catch (e: any) {
      Alert.alert('', mapApiError(e));
    }
  };

  const handleLeave = async () => {
    if (!id) return;
    Alert.alert('Leave group', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
        try {
          await groupsApi.leave(id);
          setJoined(false);
          router.back();
        } catch (e: any) {
          Alert.alert('', mapApiError(e));
        }
      }},
    ]);
  };

  if (loading || !group) {
    return (
      <PremiumDarkBackground style={s.container}>
        <PageShell>
          <SubPageHeader title="Group" />
          <SafeState variant="loading" message="Loading group..." />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={s.container}>
      <PageShell>
        <SubPageHeader title={group.name} subtitle={group.description || undefined} />
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {group.description && <Text style={s.desc}>{group.description}</Text>}
        <TouchableOpacity style={s.joinBtn} onPress={group.is_member ? handleLeave : handleJoin}>
          <Text style={s.joinBtnText}>{group.is_member ? 'Leave' : 'Join'}</Text>
        </TouchableOpacity>
        <Text style={s.sectionTitle}>EVENTS</Text>
        {events.length === 0 ? (
          <Text style={s.empty}>No events in this group.</Text>
        ) : (
          events.map((ev: any) => (
            <TouchableOpacity key={ev.id} style={s.eventCard} onPress={() => router.push(`/event/${ev.id}`)}>
              <Text style={s.eventTitle}>{ev.title}</Text>
              <Text style={s.eventMeta}>{ev.starts_at ? new Date(ev.starts_at).toLocaleString() : ''}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      </PageShell>
    </PremiumDarkBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 48 },
  desc: { color: colors.textSecondary, fontSize: fontSize.md, marginBottom: spacing.lg },
  joinBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: spacing.xl },
  joinBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  sectionTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.sm },
  eventCard: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  eventTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  eventMeta: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4 },
  empty: { color: colors.textMuted, fontSize: fontSize.md },
});
