import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';

const PRESENCE_STATES = [
  { key: 'invisible', label: 'Invisible', icon: 'eye-off', desc: 'No one can see you', color: colors.textMuted },
  { key: 'nearby', label: 'Nearby', icon: 'location', desc: 'Show as nearby (30 min)', color: colors.info },
  { key: 'browsing', label: 'Browsing', icon: 'compass', desc: 'Actively looking (15 min)', color: colors.primaryLight },
  { key: 'open_to_chat', label: 'Open to Chat', icon: 'chatbubble', desc: 'Ready to talk (60 min)', color: colors.success },
  { key: 'at_venue', label: 'At Venue', icon: 'business', desc: 'Checked into a venue (2 hrs)', color: colors.warning },
  { key: 'paused', label: 'Paused', icon: 'pause-circle', desc: 'Taking a break (30 min)', color: colors.textMuted },
];

const INTENT_FLAGS = [
  { key: 'open_tonight', label: 'Open Tonight', icon: 'moon' },
  { key: 'traveling', label: 'Traveling', icon: 'airplane' },
  { key: 'hosting', label: 'Hosting', icon: 'home' },
  { key: 'looking_for_friends', label: 'Looking for Friends', icon: 'people' },
  { key: 'looking_for_more', label: 'Looking for More', icon: 'heart' },
  { key: 'just_browsing', label: 'Just Browsing', icon: 'eye' },
  { key: 'new_in_town', label: 'New in Town', icon: 'flag' },
  { key: 'couples_only', label: 'Couples Only', icon: 'people-circle' },
  { key: 'single_friendly', label: 'Single Friendly', icon: 'person-add' },
];

export default function StatusScreen() {
  const [currentPresence, setCurrentPresence] = useState<string>('invisible');
  const [activeIntents, setActiveIntents] = useState<string[]>([]);
  const [personas, setPersonas] = useState<any[]>([]);
  const [activePersona, setActivePersona] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [presRes, intentRes, personaRes] = await Promise.all([
        api<{ data: any }>('/v1/presence/me').catch(() => ({ data: { state: 'invisible' } })),
        api<{ data: any[] }>('/v1/intents').catch(() => ({ data: [] })),
        api<{ data: any[] }>('/v1/personas').catch(() => ({ data: [] })),
      ]);
      setCurrentPresence(presRes.data.state || 'invisible');
      setActiveIntents(intentRes.data.map((i: any) => i.flag));
      setPersonas(personaRes.data);
      const active = personaRes.data.find((p: any) => p.is_active);
      if (active) setActivePersona(active.id);
    } catch {}
  };

  const setPresence = async (state: string) => {
    try {
      if (state === 'invisible') {
        await api('/v1/presence/me', { method: 'DELETE' });
      } else {
        await api('/v1/presence/state', { method: 'POST', body: JSON.stringify({ state }) });
      }
      setCurrentPresence(state);
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const toggleIntent = async (flag: string) => {
    try {
      if (activeIntents.includes(flag)) {
        await api(`/v1/intents/${flag}`, { method: 'DELETE' });
        setActiveIntents(prev => prev.filter(f => f !== flag));
      } else {
        await api('/v1/intents', { method: 'POST', body: JSON.stringify({ flag, expiresInHours: 8 }) });
        setActiveIntents(prev => [...prev, flag]);
      }
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const switchPersona = async (personaId: string) => {
    try {
      await api(`/v1/personas/${personaId}/activate`, { method: 'POST' });
      setActivePersona(personaId);
      Alert.alert('Switched', 'Persona activated');
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={styles.title}>Your Status</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* PRESENCE */}
      <Text style={styles.sectionLabel}>PRESENCE</Text>
      <Text style={styles.sectionDesc}>How visible are you right now? Auto-expires.</Text>
      <View style={styles.presenceGrid}>
        {PRESENCE_STATES.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.presenceCard, currentPresence === p.key && styles.presenceActive, currentPresence === p.key && { borderColor: p.color }]}
            onPress={() => setPresence(p.key)}
            activeOpacity={0.8}
          >
            <Ionicons name={p.icon as any} size={20} color={currentPresence === p.key ? p.color : colors.textMuted} />
            <Text style={[styles.presenceLabel, currentPresence === p.key && { color: p.color }]}>{p.label}</Text>
            <Text style={styles.presenceDesc}>{p.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* PERSONAS */}
      {personas.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>ACTIVE PERSONA</Text>
          <Text style={styles.sectionDesc}>Switch how you appear to others</Text>
          <View style={styles.personaList}>
            {personas.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.personaCard, activePersona === p.id && styles.personaActive]}
                onPress={() => switchPersona(p.id)}
                activeOpacity={0.8}
              >
                <View style={styles.personaIcon}>
                  <Ionicons name={p.type === 'couple' ? 'people' : p.type === 'anonymous' ? 'eye-off' : 'person'} size={18} color={activePersona === p.id ? colors.primaryLight : colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.personaName, activePersona === p.id && { color: colors.primaryLight }]}>{p.display_name}</Text>
                  <Text style={styles.personaType}>{p.type} mode</Text>
                </View>
                {activePersona === p.id && <Ionicons name="checkmark-circle" size={20} color={colors.primaryLight} />}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* INTENTS */}
      <Text style={styles.sectionLabel}>INTENT SIGNALS</Text>
      <Text style={styles.sectionDesc}>What are you open to? Auto-expires in 8 hours.</Text>
      <View style={styles.intentGrid}>
        {INTENT_FLAGS.map(f => {
          const active = activeIntents.includes(f.key);
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.intentChip, active && styles.intentActive]}
              onPress={() => toggleIntent(f.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={f.icon as any} size={14} color={active ? colors.primaryLight : colors.textMuted} />
              <Text style={[styles.intentText, active && styles.intentTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  sectionLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginTop: spacing.lg, marginBottom: spacing.xxs },
  sectionDesc: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: spacing.md },
  presenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presenceCard: { width: '48%', backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1.5, borderColor: colors.border },
  presenceActive: { backgroundColor: colors.primarySoft, ...shadows.glow },
  presenceLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700', marginTop: spacing.sm },
  presenceDesc: { color: colors.textMuted, fontSize: fontSize.xxs, marginTop: 2 },
  personaList: { gap: spacing.sm },
  personaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  personaActive: { borderColor: colors.primaryLight, backgroundColor: colors.primarySoft },
  personaIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  personaName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  personaType: { color: colors.textMuted, fontSize: fontSize.xs, textTransform: 'capitalize' },
  intentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  intentChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 10, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  intentActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryLight },
  intentText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  intentTextActive: { color: colors.primaryLight },
});
