import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { venuesApi } from '../../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';
import { PremiumDarkBackground } from '../../../src/components/Backgrounds';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function VenueAddSpecialScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!id) return;
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Title required', 'Enter a special title.');
      return;
    }
    setSubmitting(true);
    try {
      await venuesApi.createSpecial(id, {
        title: trimmed,
        description: description.trim() || undefined,
        dayOfWeek: dayOfWeek,
        startTime: startTime.trim() || undefined,
        endTime: endTime.trim() || undefined,
        isRecurring: true,
      });
      setSubmitting(false);
      router.back();
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert('Error', e?.message || 'Could not add special.');
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

  return (
    <PremiumDarkBackground style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Add special</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Happy Hour" placeholderTextColor={colors.textMuted} />
            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Details" placeholderTextColor={colors.textMuted} multiline numberOfLines={2} />
            <Text style={styles.label}>Day of week</Text>
            <View style={styles.dayRow}>
              {DAYS.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayChip, dayOfWeek === i && styles.dayChipActive]}
                  onPress={() => setDayOfWeek(dayOfWeek === i ? undefined : i)}
                >
                  <Text style={[styles.dayChipText, dayOfWeek === i && styles.dayChipTextActive]}>{DAYS[i].slice(0, 2)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Start time (e.g. 21:00)</Text>
            <TextInput style={styles.input} value={startTime} onChangeText={setStartTime} placeholder="21:00" placeholderTextColor={colors.textMuted} />
            <Text style={styles.label}>End time (e.g. 23:00)</Text>
            <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="23:00" placeholderTextColor={colors.textMuted} />
            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitDisabled]} onPress={submit} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Adding…' : 'Add special'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PremiumDarkBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.md },
  backBtn: { padding: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800', flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)' },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: 14, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.lg },
  textArea: { minHeight: 64, textAlignVertical: 'top' },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  dayChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: borderRadius.md, backgroundColor: colors.card },
  dayChipActive: { backgroundColor: colors.primary + '44', borderWidth: 1, borderColor: colors.primary },
  dayChipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  dayChipTextActive: { color: colors.primaryLight },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.lg, alignItems: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  error: { color: colors.textMuted, padding: 24, textAlign: 'center' },
  backBtnText: { color: colors.primaryLight, fontWeight: '600' },
});
