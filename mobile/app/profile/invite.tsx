import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Share, Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { referralsApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';
import { SafeState } from '../../src/components/ui';

export default function InviteScreen() {
  const [data, setData] = useState<{ code: string; referredCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    referralsApi.getMe()
      .then((r) => setData(r.data))
      .catch(() => setError('Could not load invite info'))
      .finally(() => setLoading(false));
  }, []);

  const copyCode = async () => {
    if (!data?.code) return;
    await Clipboard.setStringAsync(data.code);
    Alert.alert('Copied', 'Your invite code has been copied.');
  };

  const shareInvite = async () => {
    if (!data?.code) return;
    const message = `Join me on Shhh — use my invite code ${data.code} when you sign up.`;
    try {
      await Share.share({
        message,
        title: 'Invite to Shhh',
        ...(Platform.OS === 'ios' && { url: undefined }),
      });
    } catch {
      // User cancelled
    }
  };

  if (loading && !data) {
    return (
      <PremiumDarkBackground style={s.wrapper}>
        <PageShell>
          <SafeState variant="loading" message="Loading..." />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  if (error && !data) {
    return (
      <PremiumDarkBackground style={s.wrapper}>
        <PageShell>
          <SafeState variant="error" message={error} />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={s.wrapper}>
      <PageShell>
        <SubPageHeader title="Invite Friends" subtitle="Share your code — they get in, you get credit." />
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          <View style={s.codeCard}>
            <Text style={s.codeLabel}>Your invite code</Text>
            <Text style={s.codeValue} selectable>{data?.code ?? '—'}</Text>
            <TouchableOpacity style={s.copyBtn} onPress={copyCode} activeOpacity={0.8}>
              <Ionicons name="copy-outline" size={18} color={colors.primaryLight} />
              <Text style={s.copyBtnText}>Copy code</Text>
            </TouchableOpacity>
          </View>

          <View style={s.statsRow}>
            <View style={s.statBlock}>
              <Text style={s.statValue}>{data?.referredCount ?? 0}</Text>
              <Text style={s.statLabel}>Friends joined</Text>
            </View>
          </View>

          <TouchableOpacity style={s.shareBtn} onPress={shareInvite} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={22} color="#fff" />
            <Text style={s.shareBtnText}>Share invite</Text>
          </TouchableOpacity>

          <Text style={s.hint}>
            When friends sign up with your code, they'll be linked to you. Share via message, social, or in person.
          </Text>
        </ScrollView>
      </PageShell>
    </PremiumDarkBackground>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  codeLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  codeValue: { color: colors.primaryLight, fontSize: 28, fontWeight: '800', letterSpacing: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: colors.primary + '30', borderRadius: borderRadius.md },
  copyBtnText: { color: colors.primaryLight, fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statBlock: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  shareBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
});
