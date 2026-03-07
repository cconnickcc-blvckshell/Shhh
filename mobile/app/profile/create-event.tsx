import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { eventsApi, venuesApi } from '../../src/api/client';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';
import { mapApiError } from '../../src/utils/errorMapper';

const FALLBACK_LAT = 40.7128;
const FALLBACK_LNG = -74.006;

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

const EVENT_TYPES = [
  { key: 'party', label: 'Party' },
  { key: 'club_night', label: 'Club night' },
  { key: 'hotel_takeover', label: 'Hotel takeover' },
  { key: 'travel_meetup', label: 'Travel meetup' },
];

export default function CreateEventScreen() {
  const { venueId: paramVenueId } = useLocalSearchParams<{ venueId?: string }>();
  const location = useLocation();
  const lat = location.loading ? FALLBACK_LAT : location.latitude;
  const lng = location.loading ? FALLBACK_LNG : location.longitude;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const defaultStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const defaultEnd = new Date(defaultStart.getTime() + 4 * 60 * 60 * 1000);
  const [startsAt, setStartsAt] = useState<Date>(defaultStart);
  const [endsAt, setEndsAt] = useState<Date>(defaultEnd);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [venueId, setVenueId] = useState<string | null>(paramVenueId || null);
  const [seriesId, setSeriesId] = useState('');
  const [type, setType] = useState('party');
  const [capacity, setCapacity] = useState('');
  const [vibeTag, setVibeTag] = useState<string | null>(null);
  const [visibilityRule, setVisibilityRule] = useState('open');
  const [visibilityTierMin, setVisibilityTierMin] = useState('');
  const [visibilityRadiusKm, setVisibilityRadiusKm] = useState('');
  const [locationRevealedAfterRsvp, setLocationRevealedAfterRsvp] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);

  useEffect(() => {
    if (paramVenueId) setVenueId(paramVenueId);
  }, [paramVenueId]);

  useEffect(() => {
    setVenuesLoading(true);
    Promise.all([
      venuesApi.getNearby(lat, lng, 50),
      venuesApi.getMyVenues().catch(() => ({ data: [] })),
    ])
      .then(([nearbyRes, myRes]) => {
        const nearby = nearbyRes.data || [];
        const my = myRes.data || [];
        const seen = new Set<string>();
        const combined: any[] = [];
        for (const v of my) {
          if (v.id && !seen.has(v.id)) {
            seen.add(v.id);
            combined.push({ ...v, _source: 'mine' });
          }
        }
        for (const v of nearby) {
          if (v.id && !seen.has(v.id)) {
            seen.add(v.id);
            combined.push({ ...v, _source: 'nearby' });
          }
        }
        setVenues(combined);
      })
      .catch(() => setVenues([]))
      .finally(() => setVenuesLoading(false));
  }, [lat, lng]);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Enter a title');
      return;
    }
    const start = startsAt;
    const end = endsAt;
    if (end <= start) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        type,
        venueId: venueId || undefined,
        seriesId: seriesId.trim() || undefined,
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        vibeTag: vibeTag || undefined,
        locationRevealedAfterRsvp,
        visibilityRule,
        visibilityTierMin: visibilityRule === 'tier_min' && visibilityTierMin ? parseInt(visibilityTierMin, 10) : undefined,
        visibilityRadiusKm: visibilityRadiusKm ? parseInt(visibilityRadiusKm, 10) : undefined,
      };
      const res = await eventsApi.create(payload);
      Alert.alert('Created', 'Event created successfully.', [
        { text: 'OK', onPress: () => router.replace(`/event/${res.data.id}`) },
      ]);
    } catch (e: any) {
      Alert.alert('Error', mapApiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PremiumDarkBackground style={styles.container}>
      <PageShell>
        <SubPageHeader title="Create event" />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Friday Night Social"
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

          <Text style={styles.label}>Venue (optional)</Text>
          {venuesLoading ? (
            <ActivityIndicator size="small" color={colors.primaryLight} style={{ marginBottom: spacing.lg }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.venueScroll} contentContainerStyle={styles.venueScrollContent}>
              <TouchableOpacity
                style={[styles.venueChip, !venueId && styles.venueChipActive]}
                onPress={() => setVenueId(null)}
              >
                <Text style={[styles.venueChipText, !venueId && styles.venueChipTextActive]}>None</Text>
              </TouchableOpacity>
              {venues.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.venueChip, venueId === v.id && styles.venueChipActive]}
                  onPress={() => setVenueId(v.id)}
                >
                  <Text style={[styles.venueChipText, venueId === v.id && styles.venueChipTextActive]} numberOfLines={1}>
                    {v.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={styles.label}>Series ID (optional)</Text>
          <TextInput
            style={styles.input}
            value={seriesId}
            onChangeText={setSeriesId}
            placeholder="Link to a series"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Event type</Text>
          <View style={styles.chipRow}>
            {EVENT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.chip, type === t.key && styles.chipActive]}
                onPress={() => setType(t.key)}
              >
                <Text style={[styles.chipText, type === t.key && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Start</Text>
          {Platform.OS === 'web' ? (
            <TextInput
              style={styles.input}
              value={startsAt.toISOString().slice(0, 16)}
              onChangeText={(v) => { const d = new Date(v); if (!isNaN(d.getTime())) setStartsAt(d); }}
              placeholder="2026-03-01T19:00"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
                <Ionicons name="calendar" size={20} color={colors.primaryLight} />
                <Text style={styles.dateBtnText}>{startsAt.toLocaleString()}</Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startsAt}
                  mode="datetime"
                  minimumDate={new Date()}
                  onChange={(_, d) => { setStartsAt(d || startsAt); setShowStartPicker(false); }}
                />
              )}
            </>
          )}

          <Text style={styles.label}>End</Text>
          {Platform.OS === 'web' ? (
            <TextInput
              style={styles.input}
              value={endsAt.toISOString().slice(0, 16)}
              onChangeText={(v) => { const d = new Date(v); if (!isNaN(d.getTime())) setEndsAt(d); }}
              placeholder="2026-03-02T00:00"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
                <Ionicons name="calendar" size={20} color={colors.primaryLight} />
                <Text style={styles.dateBtnText}>{endsAt.toLocaleString()}</Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endsAt}
                  mode="datetime"
                  minimumDate={startsAt}
                  onChange={(_, d) => { setEndsAt(d || endsAt); setShowEndPicker(false); }}
                />
              )}
            </>
          )}

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

          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
            accessibilityRole="button"
            accessibilityLabel={showAdvanced ? 'Hide advanced options' : 'Show advanced options'}
          >
            <Ionicons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primaryLight} />
            <Text style={styles.advancedToggleText}>{showAdvanced ? 'Hide advanced' : 'Show advanced options'}</Text>
          </TouchableOpacity>

          {showAdvanced && (
          <>
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
            <Ionicons
              name={locationRevealedAfterRsvp ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={locationRevealedAfterRsvp ? colors.primaryLight : colors.textMuted}
            />
          </TouchableOpacity>
          </>
          )}

          <TouchableOpacity style={[styles.createBtn, saving && styles.createBtnDisabled]} onPress={handleCreate} disabled={saving}>
            <Text style={styles.createBtnText}>{saving ? 'Creating…' : 'Create event'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </PageShell>
    </PremiumDarkBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 48 },
  formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)' },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: 14, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  venueScroll: { marginBottom: spacing.lg },
  venueScrollContent: { flexDirection: 'row', gap: 8 },
  venueChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: borderRadius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  venueChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.borderGlow },
  venueChipText: { color: colors.textSecondary, fontSize: fontSize.sm },
  venueChipTextActive: { color: colors.primaryLight, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: borderRadius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.borderGlow },
  chipText: { color: colors.textSecondary, fontSize: fontSize.sm },
  chipTextActive: { color: colors.primaryLight, fontWeight: '600' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  dateBtnText: { color: colors.text, fontSize: fontSize.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  toggleRowActive: { borderColor: colors.borderGlow },
  toggleLabel: { color: colors.text, fontSize: fontSize.md },
  advancedToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, marginBottom: spacing.lg },
  advancedToggleText: { color: colors.primaryLight, fontSize: fontSize.sm, fontWeight: '600' },
  createBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.md },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
});
