import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { venuesApi } from '../../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';
import { PremiumDarkBackground } from '../../../src/components/Backgrounds';

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
      <View style={styles.container}>
        <Text style={styles.error}>Missing venue</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>Back</Text></TouchableOpacity>
      </View>
    );
  }

  if (loading && !venue) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <PremiumDarkBackground style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit venue</Text>
        <View style={{ width: 40 }} />
      </View>
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
    </KeyboardAvoidingView>
    </PremiumDarkBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.md },
  backBtn: { padding: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800', flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)' },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: 14, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.lg, alignItems: 'center' },
  saveDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  error: { color: colors.textMuted, padding: 24, textAlign: 'center' },
  backBtnText: { color: colors.primaryLight, fontWeight: '600' },
});
