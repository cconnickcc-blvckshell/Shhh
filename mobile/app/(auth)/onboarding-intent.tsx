import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { usersApi } from '../../src/api/client';

const ONBOARDING_DONE_KEY = 'shhh_onboarding_done';

const INTENTS = [
  { value: 'social', label: 'Social', icon: 'people-outline' as const },
  { value: 'curious', label: 'Curious', icon: 'compass-outline' as const },
  { value: 'lifestyle', label: 'Lifestyle', icon: 'sparkles-outline' as const },
  { value: 'couple', label: 'Couple', icon: 'heart-outline' as const },
] as const;

const VISIBILITY = [
  { value: 'all', label: 'Everyone', sub: 'Show in Discover to all' },
  { value: 'social_and_curious', label: 'Social & Curious only', sub: 'Only others with Social or Curious intent' },
  { value: 'same_intent', label: 'Same intent only', sub: 'Only others who chose the same vibe' },
] as const;

export default function OnboardingIntentScreen() {
  const [primaryIntent, setPrimaryIntent] = useState<string | null>(null);
  const [discoveryVisibleTo, setDiscoveryVisibleTo] = useState<string>('all');
  const [saving, setSaving] = useState(false);

  const goToTabs = () => {
    SecureStore.setItemAsync(ONBOARDING_DONE_KEY, '1').catch(() => {});
    router.replace('/(tabs)');
  };

  const handleContinue = async () => {
    if (!primaryIntent) return;
    setSaving(true);
    try {
      await usersApi.updateMe({
        primaryIntent: primaryIntent as 'social' | 'curious' | 'lifestyle' | 'couple',
        discoveryVisibleTo: discoveryVisibleTo as 'all' | 'social_and_curious' | 'same_intent',
      });
      goToTabs();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    goToTabs();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How do you want to show up?</Text>
        <Text style={styles.subtitle}>This helps others find you in Discover. You can change it anytime in Profile.</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Primary vibe</Text>
        <View style={styles.chipRow}>
          {INTENTS.map(({ value, label, icon }) => (
            <TouchableOpacity
              key={value}
              style={[styles.chip, primaryIntent === value && styles.chipActive]}
              onPress={() => setPrimaryIntent(value)}
              activeOpacity={0.8}
            >
              <Ionicons name={icon} size={20} color={primaryIntent === value ? '#fff' : colors.textMuted} />
              <Text style={[styles.chipText, primaryIntent === value && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Who can see you in Discover?</Text>
        <View style={styles.visibilityList}>
          {VISIBILITY.map(({ value, label, sub }) => (
            <TouchableOpacity
              key={value}
              style={[styles.visibilityRow, discoveryVisibleTo === value && styles.visibilityRowActive]}
              onPress={() => setDiscoveryVisibleTo(value)}
              activeOpacity={0.8}
            >
              <View style={styles.visibilityRadio}>
                {discoveryVisibleTo === value && <View style={styles.radioInner} />}
              </View>
              <View style={styles.visibilityText}>
                <Text style={[styles.visibilityLabel, discoveryVisibleTo === value && styles.visibilityLabelActive]}>{label}</Text>
                <Text style={styles.visibilitySub}>{sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.browseBtn, saving && styles.primaryBtnDisabled]}
          onPress={handleSkip}
          disabled={saving}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Browse first, set up later"
        >
          <Ionicons name="compass" size={20} color="#fff" />
          <Text style={styles.browseBtnText}>Browse first</Text>
        </TouchableOpacity>
        <Text style={styles.footerHint}>See who's nearby now. You can set your vibe anytime in Profile.</Text>
        <TouchableOpacity
          style={[styles.secondaryBtn, (!primaryIntent || saving) && styles.primaryBtnDisabled]}
          onPress={handleContinue}
          disabled={!primaryIntent || saving}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Set up my vibe and continue"
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryLight} />
          ) : (
            <Text style={styles.secondaryBtnText}>Set up my vibe</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: 48, paddingBottom: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800', marginBottom: spacing.sm },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  sectionLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600', textTransform: 'uppercase', marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceElevated, borderWidth: 2, borderColor: 'transparent',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  visibilityList: { gap: spacing.xs },
  visibilityRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated, borderWidth: 2, borderColor: 'transparent',
  },
  visibilityRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  visibilityRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  visibilityText: { flex: 1 },
  visibilityLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  visibilityLabelActive: { color: colors.primary },
  visibilitySub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: 40, gap: spacing.md },
  primaryBtnDisabled: { opacity: 0.5 },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: borderRadius.lg,
  },
  browseBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
  footerHint: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginTop: -4 },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryBtnText: { color: colors.primaryLight, fontSize: fontSize.md, fontWeight: '600' },
});
