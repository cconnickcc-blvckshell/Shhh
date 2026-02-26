import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function CoupleScreen() {
  const [couple, setCouple] = useState<any>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api<{ data: any }>('/v1/couples/me');
      setCouple(res.data);
    } catch { setCouple(null); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createCouple = async () => {
    try {
      const res = await api<{ data: { inviteCode: string } }>('/v1/couples', { method: 'POST' });
      setNewCode(res.data.inviteCode);
      load();
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const linkPartner = async () => {
    if (linkCode.length !== 8) return;
    try {
      await api('/v1/couples/link', { method: 'POST', body: JSON.stringify({ inviteCode: linkCode }) });
      Alert.alert('Linked!', 'You are now a couple');
      load();
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const requestDissolution = async () => {
    Alert.alert('Dissolve Couple', 'This starts a 7-day cooling period. Both partners must confirm.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Proceed', style: 'destructive', onPress: async () => {
        await api('/v1/couples/dissolve', { method: 'POST', body: JSON.stringify({}) });
        load();
      }},
    ]);
  };

  if (loading) return <View style={styles.container}><Text style={styles.loadingText}>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={styles.title}>Couple Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {couple && couple.status === 'active' ? (
        <View style={styles.body}>
          <View style={styles.coupleCard}>
            <View style={styles.partnersRow}>
              <View style={styles.partnerAvatar}><Ionicons name="person" size={24} color={colors.textMuted} /></View>
              <Ionicons name="heart" size={24} color={colors.primary} />
              <View style={styles.partnerAvatar}><Ionicons name="person" size={24} color={colors.textMuted} /></View>
            </View>
            <Text style={styles.coupleNames}>{couple.partner_1_name} & {couple.partner_2_name}</Text>
            <Text style={styles.coupleStatus}>Active since {new Date(couple.verified_at).toLocaleDateString()}</Text>
          </View>

          {couple.dissolution_requested_at ? (
            <View style={styles.dissolutionBox}>
              <Ionicons name="hourglass" size={20} color={colors.warning} />
              <Text style={styles.dissolutionText}>Dissolution requested — cooling period ends {new Date(couple.cooldown_expires_at).toLocaleDateString()}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.dissolveBtn} onPress={requestDissolution}>
              <Text style={styles.dissolveText}>Request Dissolution</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Create a Couple Profile</Text>
            <Text style={styles.sectionSub}>Generate an invite code to share with your partner</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={createCouple}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Generate Invite Code</Text>
            </TouchableOpacity>
            {newCode ? (
              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>Share this code with your partner:</Text>
                <Text style={styles.code}>{newCode}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Link with Partner</Text>
            <Text style={styles.sectionSub}>Enter the invite code from your partner</Text>
            <View style={styles.linkRow}>
              <TextInput style={styles.codeInput} value={linkCode} onChangeText={setLinkCode} placeholder="ABCD1234" placeholderTextColor={colors.textMuted} maxLength={8} autoCapitalize="characters" />
              <TouchableOpacity style={[styles.primaryBtn, { flex: 0 }]} onPress={linkPartner}>
                <Text style={styles.primaryBtnText}>Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingText: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  body: { padding: spacing.lg },
  coupleCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  partnersRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.md },
  partnerAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  coupleNames: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  coupleStatus: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },
  dissolutionBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(255,165,2,0.1)', padding: spacing.md, borderRadius: borderRadius.md },
  dissolutionText: { color: colors.warning, fontSize: fontSize.sm, flex: 1 },
  dissolveBtn: { backgroundColor: colors.card, padding: 16, borderRadius: borderRadius.md, alignItems: 'center' },
  dissolveText: { color: colors.danger, fontSize: fontSize.md, fontWeight: '600' },
  section: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.xs },
  sectionSub: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.md },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, padding: 16, borderRadius: borderRadius.md },
  primaryBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  codeBox: { backgroundColor: colors.card, padding: spacing.lg, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.md },
  codeLabel: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.sm },
  code: { color: colors.primary, fontSize: fontSize.xxl, fontWeight: '900', letterSpacing: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  linkRow: { flexDirection: 'row', gap: spacing.sm },
  codeInput: { flex: 1, backgroundColor: colors.surfaceElevated, color: colors.text, padding: 16, borderRadius: borderRadius.md, fontSize: fontSize.xl, fontWeight: '700', letterSpacing: 3, textAlign: 'center', borderWidth: 1, borderColor: colors.border },
});
