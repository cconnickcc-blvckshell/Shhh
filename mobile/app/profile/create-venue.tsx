import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { venuesApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';

const DEFAULT_LAT = 40.7128;
const DEFAULT_LNG = -74.006;

export default function CreateVenueScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Create venue</Text>
          <View style={{ width: 40 }} />
        </View>
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
            <Text style={styles.hint}>Location is set to a default; you can update it later in the venue dashboard.</Text>
            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitDisabled]} onPress={submit} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Creating…' : 'Create venue'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PremiumDarkBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.md },
  backBtn: { padding: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)' },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: 14, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  hint: { color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: spacing.xl },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.lg, alignItems: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
});
