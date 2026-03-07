import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { venuesApi } from '../../src/api/client';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';

const DEFAULT_LAT = 40.7128;
const DEFAULT_LNG = -74.006;

export default function CreateVenueScreen() {
  const location = useLocation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [submitting, setSubmitting] = useState(false);

  const useMyLocation = () => {
    if (location.loading) return;
    if (location.error || location.latitude == null) {
      Alert.alert('Location needed', 'Enable location access in settings to use your current position.');
      return;
    }
    setLat(location.latitude);
    setLng(location.longitude);
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Enter a venue name.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await venuesApi.create({
        name: trimmed,
        description: description.trim() || undefined,
        lat,
        lng,
        type: 'club',
      });
      setSubmitting(false);
      router.replace(`/profile/venue-dashboard/${res.data.id}`);
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert('Error', e?.message || 'Could not create venue.');
    }
  };

  return (
    <PremiumDarkBackground style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <PageShell>
          <SubPageHeader title="Create venue" />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.label}>Venue name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. The Purple Room"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Short description for your venue"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.label}>Location</Text>
            <TouchableOpacity style={styles.locationBtn} onPress={useMyLocation} disabled={location.loading}>
              {location.loading ? (
                <ActivityIndicator size="small" color={colors.primaryLight} />
              ) : (
                <Ionicons name="locate" size={20} color={colors.primaryLight} />
              )}
              <Text style={styles.locationBtnText}>
                {location.loading ? 'Getting location…' : 'Use my location'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.locationHint}>
              {lat.toFixed(4)}, {lng.toFixed(4)} — update in venue dashboard after creation.
            </Text>
            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitDisabled]} onPress={submit} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Creating…' : 'Create venue'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </PageShell>
      </KeyboardAvoidingView>
    </PremiumDarkBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)' },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: 14, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  hint: { color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: spacing.xl },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.card, borderRadius: borderRadius.lg, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(147,51,234,0.3)' },
  locationBtnText: { color: colors.primaryLight, fontSize: fontSize.md, fontWeight: '600' },
  locationHint: { color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: spacing.xl },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.lg, alignItems: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
});
