import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { venuesApi } from '../../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

const ROLES = ['manager', 'staff', 'security', 'dj'] as const;

export default function VenueInviteStaffScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<string>('staff');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!id) return;
    const trimmed = userId.trim();
    if (!trimmed) {
      Alert.alert('User ID required', 'Enter the user’s ID (UUID) to invite. They can find this in their profile.');
      return;
    }
    setSubmitting(true);
    try {
      await venuesApi.inviteStaff(id, trimmed, role);
      setSubmitting(false);
      router.back();
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert('Error', e?.message || 'Could not invite staff.');
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Invite staff</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>User ID (UUID) *</Text>
        <TextInput
          style={styles.input}
          value={userId}
          onChangeText={setUserId}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.hint}>The person must have a Shhh account. They can find their User ID in Me → Edit profile or in app settings.</Text>
        <Text style={styles.label}>Role</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity key={r} style={[styles.roleChip, role === r && styles.roleChipActive]} onPress={() => setRole(r)}>
              <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitDisabled]} onPress={submit} disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? 'Inviting…' : 'Invite'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.md },
  backBtn: { padding: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800', flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: 14, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.sm },
  hint: { color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: spacing.lg },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl },
  roleChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: borderRadius.md, backgroundColor: colors.card },
  roleChipActive: { backgroundColor: colors.primary + '44', borderWidth: 1, borderColor: colors.primary },
  roleChipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  roleChipTextActive: { color: colors.primaryLight },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.lg, alignItems: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  error: { color: colors.textMuted, padding: 24, textAlign: 'center' },
  backBtnText: { color: colors.primaryLight, fontWeight: '600' },
});
