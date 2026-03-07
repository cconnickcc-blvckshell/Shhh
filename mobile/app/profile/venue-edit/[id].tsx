import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { venuesApi } from '../../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';
import { PremiumDarkBackground } from '../../../src/components/Backgrounds';
import { PageShell } from '../../../src/components/layout';
import { SubPageHeader } from '../../../src/components/SubPageHeader';
import { SafeState } from '../../../src/components/ui';

export default function VenueEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venue, setVenue] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagline, setTagline] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [capacity, setCapacity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    venuesApi.get(id).then((r) => {
      if (cancelled) return;
      const v = r.data;
      setVenue(v);
      setName(v?.name ?? '');
      setDescription(v?.description ?? '');
      setTagline(v?.tagline ?? '');
      setDressCode(v?.dress_code ?? '');
      setCapacity(v?.capacity != null ? String(v.capacity) : '');
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const save = async () => {
    if (!id) return;
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Enter a venue name.');
      return;
    }
    setSaving(true);
    try {
      await venuesApi.updateProfile(id, {
        name: trimmed,
        description: description.trim() || undefined,
        tagline: tagline.trim() || undefined,
        dressCode: dressCode.trim() || undefined,
        capacity: capacity.trim() ? parseInt(capacity, 10) : undefined,
      });
      setSaving(false);
      router.back();
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e?.message || 'Could not update venue.');
    }
  };

  if (!id) {
    return (
      <PremiumDarkBackground style={styles.container}>
        <PageShell>
          <SafeState variant="error" message="Missing venue" onRetry={() => router.back()} />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  if (loading && !venue) {
    return (
      <PremiumDarkBackground style={styles.container}>
        <PageShell>
          <SafeState variant="loading" message="Loading venue..." />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <PageShell>
          <SubPageHeader title="Edit venue" />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Venue name" placeholderTextColor={colors.textMuted} />
          <Text style={styles.label}>Tagline</Text>
          <TextInput style={styles.input} value={tagline} onChangeText={setTagline} placeholder="Short tagline" placeholderTextColor={colors.textMuted} />
          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />
          <Text style={styles.label}>Dress code</Text>
          <TextInput style={styles.input} value={dressCode} onChangeText={setDressCode} placeholder="e.g. Smart casual" placeholderTextColor={colors.textMuted} />
          <Text style={styles.label}>Capacity</Text>
          <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} placeholder="e.g. 200" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />
          <TouchableOpacity style={[styles.saveBtn, saving && styles.saveDisabled]} onPress={save} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
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
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)' },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: 14, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.lg, alignItems: 'center' },
  saveDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
});
