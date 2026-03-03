import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { usePhotoUpload } from '../../src/hooks/usePhotoUpload';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { mapApiError } from '../../src/utils/errorMapper';

const TIERS = [
  { tier: 0, label: 'Basic', desc: 'Phone verified — browse only', icon: 'phone-portrait', color: colors.textMuted },
  { tier: 1, label: 'Photo Verified', desc: 'Selfie match — can like & message', icon: 'camera', color: colors.info },
  { tier: 2, label: 'ID Verified', desc: 'Government ID — create events, full access', icon: 'shield-checkmark', color: colors.verified },
  { tier: 3, label: 'Reference Verified', desc: '3+ references from ID-verified users', icon: 'star', color: colors.trusted },
];

export default function VerificationScreen() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { pickAndUpload, takePhotoAndUpload, uploading } = usePhotoUpload();

  const load = async () => {
    try {
      const res = await api<{ data: any }>('/v1/verification/status');
      setStatus(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitPhotoVerification = async (useCamera: boolean) => {
    const result = useCamera
      ? await takePhotoAndUpload('photos')
      : await pickAndUpload('photos');
    if (!result?.url) return;
    const selfieUrl = result.url;
    try {
      await api('/v1/verification/photo', { method: 'POST', body: JSON.stringify({ selfieUrl }) });
      Alert.alert('Submitted', 'Your photo verification has been submitted for review.');
      load();
    } catch (err: any) {
      Alert.alert('', mapApiError(err));
    }
  };

  const currentTier = status?.currentTier || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={styles.title}>Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>Current Level</Text>
        <Text style={styles.progressTier}>Tier {currentTier}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentTier / 3) * 100}%` }]} />
        </View>
      </View>

      {TIERS.map((t) => {
        const isComplete = currentTier >= t.tier;
        const isCurrent = currentTier === t.tier;
        const pending = status?.verifications?.find((v: any) => (t.tier === 1 && v.type === 'photo' || t.tier === 2 && v.type === 'id') && v.status === 'pending');

        return (
          <View key={t.tier} style={[styles.tierCard, isComplete && styles.tierComplete, isCurrent && styles.tierCurrent]}>
            <View style={[styles.tierIcon, { backgroundColor: isComplete ? t.color + '25' : colors.surfaceLight }]}>
              <Ionicons name={t.icon as any} size={22} color={isComplete ? t.color : colors.textMuted} />
            </View>
            <View style={styles.tierInfo}>
              <Text style={[styles.tierLabel, isComplete && { color: t.color }]}>{t.label}</Text>
              <Text style={styles.tierDesc}>{t.desc}</Text>
              {pending && <Text style={styles.pendingBadge}>Pending review</Text>}
            </View>
            {isComplete ? (
              <Ionicons name="checkmark-circle" size={24} color={t.color} />
            ) : isCurrent && t.tier === 1 ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, uploading && { opacity: 0.6 }]} onPress={() => submitPhotoVerification(false)} disabled={uploading}>
                  {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.actionBtnText}>Pick photo</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, uploading && { opacity: 0.6 }]} onPress={() => submitPhotoVerification(true)} disabled={uploading}>
                  <Text style={styles.actionBtnText}>Take photo</Text>
                </TouchableOpacity>
              </View>
            ) : isCurrent && t.tier === 2 ? (
              <View style={[styles.actionBtn, { opacity: 0.7 }]}>
                <Text style={styles.actionBtnText}>Coming soon</Text>
              </View>
            ) : (
              <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
            )}
          </View>
        );
      })}

      {status?.verifications?.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Verification History</Text>
          {status.verifications.map((v: any) => (
            <View key={v.id} style={styles.historyItem}>
              <View style={[styles.historyDot, { backgroundColor: v.status === 'approved' ? colors.success : v.status === 'rejected' ? colors.danger : colors.warning }]} />
              <Text style={styles.historyType}>{v.type}</Text>
              <Text style={styles.historyStatus}>{v.status}</Text>
              <Text style={styles.historyDate}>{new Date(v.created_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  progressCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, alignItems: 'center' },
  progressLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  progressTier: { color: colors.primary, fontSize: fontSize.xxl, fontWeight: '800', marginVertical: spacing.sm },
  progressBar: { width: '100%', height: 6, backgroundColor: colors.surfaceLight, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  tierCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  tierComplete: { borderWidth: 1, borderColor: colors.border },
  tierCurrent: { borderWidth: 1, borderColor: colors.primary },
  tierIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  tierInfo: { flex: 1 },
  tierLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  tierDesc: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  pendingBadge: { color: colors.warning, fontSize: fontSize.xxs, fontWeight: '600', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.md },
  actionBtnText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' },
  historySection: { marginTop: spacing.lg },
  historyTitle: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyType: { color: colors.text, fontSize: fontSize.sm, flex: 1, textTransform: 'capitalize' },
  historyStatus: { color: colors.textSecondary, fontSize: fontSize.xs, textTransform: 'capitalize' },
  historyDate: { color: colors.textMuted, fontSize: fontSize.xs },
});
