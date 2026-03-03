import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

export type AuthMethod = 'phone' | 'apple' | 'google' | 'snap';

const OPTIONS: { id: AuthMethod; label: string; icon: string; pros: string; cons: string }[] = [
  {
    id: 'phone',
    label: 'Phone number',
    icon: 'call',
    pros: 'Best for safety (panic, contacts). We never share it.',
    cons: 'Ties your number to the app.',
  },
  {
    id: 'apple',
    label: 'Sign in with Apple',
    icon: 'logo-apple',
    pros: 'Privacy-preserving. Apple hides your email.',
    cons: 'Requires Apple ID.',
  },
  {
    id: 'google',
    label: 'Sign in with Google',
    icon: 'logo-google',
    pros: 'Quick sign-up. One tap if you use Google.',
    cons: 'Google knows you use Shhh.',
  },
  {
    id: 'snap',
    label: 'Continue with Snapchat',
    icon: 'logo-snapchat',
    pros: 'Separate identity. Fast. Good for anonymity.',
    cons: 'Snapchat knows you use Shhh.',
  },
];

interface AuthOptionsProps {
  onSelect: (method: AuthMethod) => void;
  isLoading?: boolean;
}

export function AuthOptions({ onSelect, isLoading }: AuthOptionsProps) {
  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>How do you want to sign in?</Text>
      <Text style={s.subtitle}>Choose what fits you. You can always add more later.</Text>

      {OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={s.option}
          onPress={() => onSelect(opt.id)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <View style={s.optionHeader}>
            <View style={s.iconWrap}>
              <Ionicons name={opt.icon as any} size={24} color={colors.text} />
            </View>
            <Text style={s.optionLabel}>{opt.label}</Text>
          </View>
          <View style={s.prosCons}>
            <Text style={s.pros}>✓ {opt.pros}</Text>
            <Text style={s.cons}>• {opt.cons}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xl },
  option: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  optionLabel: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  prosCons: { marginLeft: 52 },
  pros: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 2 },
  cons: { fontSize: fontSize.xs, color: colors.textMuted },
});
