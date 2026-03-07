import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { colors, spacing, fontSize } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell, Card, SectionLabel } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';
import { SafeState } from '../../src/components/ui';

const PRESENCE_STATES = [
  { key: 'invisible', label: 'Invisible', icon: 'eye-off', desc: 'Hidden', color: 'rgba(255,255,255,0.25)' },
  { key: 'nearby', label: 'Nearby', icon: 'location', desc: '30 min', color: '#60A5FA' },
  { key: 'browsing', label: 'Browsing', icon: 'compass', desc: '15 min', color: colors.primaryLight },
  { key: 'open_to_chat', label: 'Open', icon: 'chatbubble', desc: '60 min', color: '#34D399' },
  { key: 'at_venue', label: 'At Venue', icon: 'business', desc: '2 hrs', color: '#FBBF24' },
  { key: 'at_event', label: 'At Event', icon: 'calendar', desc: '4 hrs', color: '#F472B6' },
  { key: 'paused', label: 'Paused', icon: 'pause-circle', desc: '30 min', color: 'rgba(255,255,255,0.35)' },
];

const INTENT_FLAGS = [
  { key: 'open_tonight', label: 'Open Tonight', icon: 'moon' },
  { key: 'traveling', label: 'Traveling', icon: 'airplane' },
  { key: 'hosting', label: 'Hosting', icon: 'home' },
  { key: 'looking_for_friends', label: 'Friends', icon: 'people' },
  { key: 'looking_for_more', label: 'More', icon: 'heart' },
  { key: 'just_browsing', label: 'Browsing', icon: 'eye' },
  { key: 'new_in_town', label: 'New Here', icon: 'flag' },
  { key: 'couples_only', label: 'Couples', icon: 'people-circle' },
  { key: 'single_friendly', label: 'Singles OK', icon: 'person-add' },
];

export default function StatusScreen() {
  const [currentPresence, setCurrentPresence] = useState('invisible');
  const [activeIntents, setActiveIntents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<{ data: any }>('/v1/presence/me').then(r => setCurrentPresence(r.data.state || 'invisible')).catch(() => {}),
      api<{ data: any[] }>('/v1/intents').then(r => setActiveIntents(r.data.map((i: any) => i.flag))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const setPresence = async (state: string) => {
    try {
      if (state === 'invisible') await api('/v1/presence/me', { method: 'DELETE' });
      else await api('/v1/presence/state', { method: 'POST', body: JSON.stringify({ state }) });
      setCurrentPresence(state);
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const toggleIntent = async (flag: string) => {
    try {
      if (activeIntents.includes(flag)) {
        await api(`/v1/intents/${flag}`, { method: 'DELETE' });
        setActiveIntents(p => p.filter(f => f !== flag));
      } else {
        await api('/v1/intents', { method: 'POST', body: JSON.stringify({ flag, expiresInHours: 8 }) });
        setActiveIntents(p => [...p, flag]);
      }
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  if (loading) {
    return (
      <PremiumDarkBackground style={s.wrapper}>
        <PageShell>
          <SafeState variant="loading" message="Loading your status..." />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={s.wrapper}>
      <PageShell>
        <SubPageHeader title="Your Status" subtitle="Control how others see you" />
        <ScrollView style={s.scroll} contentContainerStyle={s.content} bounces={false}>
          <View style={s.currentBox}>
            <View style={[s.currentDot, { backgroundColor: PRESENCE_STATES.find(p => p.key === currentPresence)?.color || colors.textMuted }]} />
            <Text style={s.currentLabel}>
              {PRESENCE_STATES.find(p => p.key === currentPresence)?.label || 'Invisible'}
            </Text>
          </View>

          <Card style={s.card}>
            <SectionLabel>PRESENCE</SectionLabel>
            <View style={s.presenceGrid}>
              {PRESENCE_STATES.map(p => {
                const active = currentPresence === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[s.presenceCard, active && { borderColor: p.color, backgroundColor: p.color + '12' }]}
                    onPress={() => setPresence(p.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.presenceIconWrap, { backgroundColor: active ? p.color + '25' : 'rgba(255,255,255,0.04)' }]}>
                      <Ionicons name={p.icon as any} size={20} color={active ? p.color : 'rgba(255,255,255,0.3)'} />
                    </View>
                    <Text style={[s.presenceLabel, active && { color: p.color }]}>{p.label}</Text>
                    <Text style={s.presenceDesc}>{p.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          <Card style={s.card}>
            <SectionLabel>SIGNALS</SectionLabel>
            <Text style={s.sectionHint}>Others can see these. Auto-expire in 8 hours.</Text>
            <View style={s.intentWrap}>
              {INTENT_FLAGS.map(f => {
                const active = activeIntents.includes(f.key);
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[s.intentChip, active && s.intentActive]}
                    onPress={() => toggleIntent(f.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={f.icon as any} size={13} color={active ? colors.primaryLight : 'rgba(255,255,255,0.35)'} />
                    <Text style={[s.intentText, active && s.intentTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          <View style={{ height: 40 }} />
        </ScrollView>
      </PageShell>
    </PremiumDarkBackground>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  currentBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 20 },
  currentDot: { width: 12, height: 12, borderRadius: 6 },
  currentLabel: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  card: { marginBottom: spacing.lg },
  sectionHint: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: -4, marginBottom: spacing.sm },
  presenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presenceCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  presenceIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  presenceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm, fontWeight: '700' },
  presenceDesc: { color: 'rgba(255,255,255,0.25)', fontSize: fontSize.xxs, marginTop: 2 },
  intentWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  intentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  intentActive: { backgroundColor: 'rgba(147,51,234,0.15)', borderColor: 'rgba(147,51,234,0.4)' },
  intentText: { color: 'rgba(255,255,255,0.4)', fontSize: fontSize.sm, fontWeight: '600' },
  intentTextActive: { color: colors.primaryLight },
});
