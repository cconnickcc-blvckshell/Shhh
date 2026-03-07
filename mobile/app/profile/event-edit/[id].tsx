import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../../src/api/client';
import { useAuthStore } from '../../../src/stores/auth';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';
import { PremiumDarkBackground } from '../../../src/components/Backgrounds';
import { PageShell } from '../../../src/components/layout';
import { SubPageHeader } from '../../../src/components/SubPageHeader';
import { mapApiError } from '../../../src/utils/errorMapper';

const VIBE_OPTIONS = [
  { key: 'social_mix', label: 'Social mix' },
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'kink', label: 'Kink' },
  { key: 'couples_only', label: 'Couples only' },
  { key: 'newbie_friendly', label: 'Newbie friendly' },
  { key: 'talk_first', label: 'Talk first' },
];

const VISIBILITY_OPTIONS = [
  { key: 'open', label: 'Open to all' },
  { key: 'tier_min', label: 'Min verification tier' },
  { key: 'invite_only', label: 'Invite only' },
  { key: 'attended_2_plus', label: '2+ events attended' },
];

export default function EventEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [capacity, setCapacity] = useState('');
  const [vibeTag, setVibeTag] = useState<string | null>(null);
  const [visibilityRule, setVisibilityRule] = useState<string>('open');
  const [visibilityTierMin, setVisibilityTierMin] = useState('');
  const [visibilityRadiusKm, setVisibilityRadiusKm] = useState('');
  const [locationRevealedAfterRsvp, setLocationRevealedAfterRsvp] = useState(false);

  useEffect(() => {
    if (!id) return;
    eventsApi
      .get(id)
      .then((r) => {
        const e = r.data;
        setEvent(e);
        if (e.host_user_id !== userId) {
          Alert.alert('', 'Only the host can edit this event.', [{ text: 'OK', onPress: () => router.back() }]);
          return;
        }
        setTitle(e.title || '');
        setDescription(e.description || '');
        setStartsAt(e.starts_at ? new Date(e.starts_at).toISOString().replace('Z', '').slice(0, 16) : '');
        setEndsAt(e.ends_at ? new Date(e.ends_at).toISOString().replace('Z', '').slice(0, 16) : '');
        setCapacity(e.capacity != null ? String(e.capacity) : '');
        setVibeTag(e.vibe_tag || null);
        setVisibilityRule(e.visibility_rule || 'open');
        setVisibilityTierMin(e.visibility_tier_min != null ? String(e.visibility_tier_min) : '');
        setVisibilityRadiusKm(e.visibility_radius_km != null ? String(e.visibility_radius_km) : '');
        setLocationRevealedAfterRsvp(!!e.location_revealed_after_rsvp);
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id, userId]);

  const handleSave = async () => {
    if (!id || !title.trim()) {
      Alert.alert('', 'Enter a title');
      return;
    }
    const start = startsAt ? new Date(startsAt.includes('T') ? startsAt : `${startsAt}T00:00:00`) : new Date();
    const end = endsAt ? new Date(endsAt.includes('T') ? endsAt : `${endsAt}T23:59:59`) : new Date(start.getTime() + 4 * 60 * 60 * 1000);
    if (end <= start) {
      Alert.alert('', 'End time must be after start time');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        capacity: capacity ? parseInt(capacity, 10) : null,
        vibeTag: vibeTag || null,
        visibilityRule,
        visibilityTierMin: visibilityRule === 'tier_min' && visibilityTierMin ? parseInt(visibilityTierMin, 10) : null,
        visibilityRadiusKm: visibilityRadiusKm ? parseInt(visibilityRadiusKm, 10) : null,
        locationRevealedAfterRsvp,
      };
      await eventsApi.update(id, payload);
      Alert.alert('Saved', 'Event updated.', [{ text: 'OK', onPress: () => router.replace(`/event/${id}`) }]);
    } catch (e: any) {
      Alert.alert('', mapApiError(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !event) {
    return (
      <PremiumDarkBackground style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </PremiumDarkBackground>
    );
  }

  if (event.host_user_id !== userId) {
    return null;
  }

  return (
    <PremiumDarkBackground style={styles.container}>
      <PageShell>
        <SubPageHeader title="Edit event" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What's happening?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Start</Text>
          <TextInput
            style={styles.input}
            value={startsAt}
            onChangeText={setStartsAt}
            placeholder="YYYY-MM-DDTHH:mm"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>End</Text>
          <TextInput
            style={styles.input}
            value={endsAt}
            onChangeText={setEndsAt}
            placeholder="YYYY-MM-DDTHH:mm"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Capacity (optional)</Text>
          <TextInput
            style={styles.input}
            value={capacity}
            onChangeText={setCapacity}
            placeholder="e.g. 50"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Vibe</Text>
          <View style={styles.chipRow}>
            {VIBE_OPTIONS.map((v) => (
              <TouchableOpacity
                key={v.key}
                style={[styles.chip, vibeTag === v.key && styles.chipActive]}
                onPress={() => setVibeTag(vibeTag === v.key ? null : v.key)}
              >
                <Text style={[styles.chipText, vibeTag === v.key && styles.chipTextActive]}>{v.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Visibility</Text>
          <View style={styles.chipRow}>
            {VISIBILITY_OPTIONS.map((v) => (
              <TouchableOpacity
                key={v.key}
                style={[styles.chip, visibilityRule === v.key && styles.chipActive]}
                onPress={() => setVisibilityRule(v.key)}
              >
                <Text style={[styles.chipText, visibilityRule === v.key && styles.chipTextActive]}>{v.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {visibilityRule === 'tier_min' && (
            <>
              <Text style={styles.label}>Min verification tier (0–3)</Text>
              <TextInput
                style={styles.input}
                value={visibilityTierMin}
                onChangeText={setVisibilityTierMin}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </>
          )}

          <Text style={styles.label}>Visibility radius (km, optional)</Text>
          <TextInput
            style={styles.input}
            value={visibilityRadiusKm}
            onChangeText={setVisibilityRadiusKm}
            placeholder="e.g. 25"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />

          <TouchableOpacity
            style={[styles.toggleRow, locationRevealedAfterRsvp && styles.toggleRowActive]}
            onPress={() => setLocationRevealedAfterRsvp(!locationRevealedAfterRsvp)}
          >
            <Text style={styles.toggleLabel}>Reveal location only after RSVP</Text>
            <Ionicons name={locationRevealedAfterRsvp ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={locationRevealedAfterRsvp ? colors.primaryLight : colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </PageShell>
    </PremiumDarkBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120 },
  loadingText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.md },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 48 },
  formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)' },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: 14, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: borderRadius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.borderGlow },
  chipText: { color: colors.textSecondary, fontSize: fontSize.sm },
  chipTextActive: { color: colors.primaryLight, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  toggleRowActive: { borderColor: colors.borderGlow },
  toggleLabel: { color: colors.text, fontSize: fontSize.md },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.md },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
});
