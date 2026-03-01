import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';

export default function CreateEventScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Enter a title'); return; }
    const start = startsAt ? new Date(startsAt) : new Date(Date.now() + 2 * 60 * 60 * 1000);
    const end = endsAt ? new Date(endsAt) : new Date(start.getTime() + 4 * 60 * 60 * 1000);
    if (end <= start) { Alert.alert('Error', 'End time must be after start time'); return; }
    setSaving(true);
    try {
      const res = await eventsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
      });
      Alert.alert('Created', 'Event created successfully.', [
        { text: 'OK', onPress: () => router.replace(`/event/${res.data.id}`) },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PremiumDarkBackground style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Friday Night Social" placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="What's happening?" placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />

          <Text style={styles.label}>Start (ISO or leave blank for in 2 hours)</Text>
          <TextInput style={styles.input} value={startsAt} onChangeText={setStartsAt} placeholder="2026-03-01T19:00:00.000Z" placeholderTextColor={colors.textMuted} />

          <Text style={styles.label}>End (ISO or leave blank for start + 4h)</Text>
          <TextInput style={styles.input} value={endsAt} onChangeText={setEndsAt} placeholder="2026-03-02T00:00:00.000Z" placeholderTextColor={colors.textMuted} />

          <TouchableOpacity style={[styles.createBtn, saving && styles.createBtnDisabled]} onPress={handleCreate} disabled={saving}>
            <Text style={styles.createBtnText}>{saving ? 'Creating…' : 'Create event'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </PremiumDarkBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.md },
  backBtn: { padding: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: 48 },
  formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)' },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: 14, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  createBtn: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.md },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
});
