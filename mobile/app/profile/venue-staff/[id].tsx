import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { venuesApi } from '../../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';

function loadStaff(venueId: string) {
  return venuesApi.getStaff(venueId).then((res) => res.data || []);
}

export default function VenueStaffScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const refresh = () => {
    if (!id) return;
    setLoading(true);
    loadStaff(id).then(setStaff).catch(() => setStaff([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    refresh();
  }, [id]);

  const removeStaff = (staffId: string, displayName: string) => {
    if (!id) return;
    Alert.alert('Remove staff', `Remove ${displayName || 'this person'} from venue staff?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setRemovingId(staffId);
          venuesApi.removeStaff(id, staffId).then(() => refresh()).catch((e) => Alert.alert('Error', e?.message || 'Could not remove')).finally(() => setRemovingId(null));
        },
      },
    ]);
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
        <Text style={styles.title}>Staff</Text>
        <View style={{ width: 40 }} />
      </View>
      <TouchableOpacity style={styles.inviteBtn} onPress={() => router.push(`/profile/venue-invite-staff/${id}`)}>
        <Ionicons name="person-add-outline" size={20} color="#fff" />
        <Text style={styles.inviteBtnText}>Invite staff</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : staff.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No staff listed</Text>
          <Text style={styles.emptySub}>Tap “Invite staff” to add someone by their User ID.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {staff.map((s: any) => (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardMain}>
                <Text style={styles.name}>{s.display_name || 'Staff'}</Text>
                <Text style={styles.role}>{s.role}</Text>
              </View>
              <TouchableOpacity
                style={[styles.removeBtn, removingId === s.id && styles.removeBtnDisabled]}
                onPress={() => removeStaff(s.id, s.display_name)}
                disabled={removingId !== null}
              >
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.md },
  backBtn: { padding: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: spacing.lg, marginBottom: spacing.lg, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: borderRadius.lg },
  inviteBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  error: { color: colors.textMuted, padding: 24, textAlign: 'center' },
  backBtnText: { color: colors.primaryLight, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.sm },
  cardMain: { flex: 1 },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  role: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4, textTransform: 'capitalize' },
  removeBtn: { padding: spacing.sm },
  removeBtnDisabled: { opacity: 0.5 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.md },
  emptySub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4, textAlign: 'center', paddingHorizontal: 24 },
});
