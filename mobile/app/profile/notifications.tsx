import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '../../src/api/client';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';
import { SafeState } from '../../src/components/ui';

type NotificationPrefs = {
  push_messages?: boolean;
  push_whispers?: boolean;
  push_likes?: boolean;
  neutral_notifications?: boolean;
};

export default function NotificationsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    push_messages: true,
    push_whispers: true,
    push_likes: true,
    neutral_notifications: false,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    import('expo-notifications')
      .then((N) => N.getPermissionsAsync())
      .then((r) => setPermissionDenied(r.status === 'denied'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (profile?.preferencesJson && typeof profile.preferencesJson === 'object') {
      const p = profile.preferencesJson as Record<string, unknown>;
      setPrefs({
        push_messages: p.push_messages !== false,
        push_whispers: p.push_whispers !== false,
        push_likes: p.push_likes !== false,
        neutral_notifications: p.neutral_notifications === true,
      });
    }
    setLoading(false);
  }, [profile?.preferencesJson]);

  const updatePref = async (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      const current = (profile?.preferencesJson as Record<string, unknown>) || {};
      await usersApi.updateMe({
        preferencesJson: { ...current, [key]: value },
      });
      await loadProfile();
    } catch {
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PremiumDarkBackground style={s.wrapper}>
        <PageShell>
          <SafeState variant="loading" message="Loading preferences..." />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={s.wrapper}>
      <PageShell>
        <SubPageHeader title="Notifications" subtitle="Control push notifications and privacy." />
        <ScrollView style={s.container} contentContainerStyle={s.scrollContent} bounces={false}>
          {permissionDenied && (
        <TouchableOpacity style={s.permissionBanner} onPress={() => Linking.openSettings()} activeOpacity={0.8}>
          <Ionicons name="notifications-off-outline" size={22} color={colors.warning} />
          <View style={s.permissionBannerText}>
            <Text style={s.permissionBannerTitle}>Notifications are off</Text>
            <Text style={s.permissionBannerSub}>Tap to open Settings and enable notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      <View style={s.section}>
        <Text style={s.sectionTitle}>PUSH NOTIFICATIONS</Text>
        <View style={s.row}>
          <View style={s.iconWrap}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primaryLight} />
          </View>
          <View style={s.rowText}>
            <Text style={s.rowTitle}>New messages</Text>
            <Text style={s.rowSub}>Get notified when someone sends you a message</Text>
          </View>
          <Switch
            value={prefs.push_messages !== false}
            onValueChange={(v) => updatePref('push_messages', v)}
            disabled={saving}
            trackColor={{ false: colors.surface, true: colors.primary + '80' }}
            thumbColor={prefs.push_messages !== false ? colors.primaryLight : colors.textMuted}
          />
        </View>
        <View style={s.row}>
          <View style={s.iconWrap}>
            <Ionicons name="ear-outline" size={22} color={colors.primaryLight} />
          </View>
          <View style={s.rowText}>
            <Text style={s.rowTitle}>Whispers</Text>
            <Text style={s.rowSub}>Get notified when someone whispers to you</Text>
          </View>
          <Switch
            value={prefs.push_whispers !== false}
            onValueChange={(v) => updatePref('push_whispers', v)}
            disabled={saving}
            trackColor={{ false: colors.surface, true: colors.primary + '80' }}
            thumbColor={prefs.push_whispers !== false ? colors.primaryLight : colors.textMuted}
          />
        </View>
        <View style={s.row}>
          <View style={s.iconWrap}>
            <Ionicons name="heart-outline" size={22} color={colors.primaryLight} />
          </View>
          <View style={s.rowText}>
            <Text style={s.rowTitle}>Profile likes</Text>
            <Text style={s.rowSub}>Get notified when someone likes your profile</Text>
          </View>
          <Switch
            value={prefs.push_likes !== false}
            onValueChange={(v) => updatePref('push_likes', v)}
            disabled={saving}
            trackColor={{ false: colors.surface, true: colors.primary + '80' }}
            thumbColor={prefs.push_likes !== false ? colors.primaryLight : colors.textMuted}
          />
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>PRIVACY</Text>
        <View style={s.row}>
          <View style={s.iconWrap}>
            <Ionicons name="eye-off-outline" size={22} color={colors.primaryLight} />
          </View>
          <View style={s.rowText}>
            <Text style={s.rowTitle}>Stealth notifications</Text>
            <Text style={s.rowSub}>Show generic "You have a new notification" instead of sender or preview</Text>
          </View>
          <Switch
            value={prefs.neutral_notifications === true}
            onValueChange={(v) => updatePref('neutral_notifications', v)}
            disabled={saving}
            trackColor={{ false: colors.surface, true: colors.primary + '80' }}
            thumbColor={prefs.neutral_notifications ? colors.primaryLight : colors.textMuted}
          />
        </View>
      </View>

          <Text style={s.privacyNote}>
            Notifications help you stay connected. You can change these anytime. We never share your data with third parties for marketing.
          </Text>
        </ScrollView>
      </PageShell>
    </PremiumDarkBackground>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.xl },
  sectionTitle: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  rowText: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  rowSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  permissionBannerText: { flex: 1 },
  permissionBannerTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  permissionBannerSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  privacyNote: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 18,
    marginTop: spacing.lg,
  },
});
