import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const { login, isLoading, error } = useAuthStore();

  const canSubmit = phone.length >= 10;

  const handleLogin = async () => {
    if (!canSubmit) return;
    try { await login(phone); } catch {}
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.glow} />

      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="finger-print" size={32} color={colors.primaryLight} />
          </View>
          <Text style={styles.logo}>Shhh</Text>
          <Text style={styles.tagline}>Your secret is safe</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>PHONE NUMBER</Text>
          <View style={[styles.inputWrap, phone.length > 0 && styles.inputWrapFocused]}>
            <Ionicons name="call-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={14} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading || !canSubmit}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkWrap}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Text style={styles.linkBold}>Sign up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  glow: {
    position: 'absolute', top: -120, left: '50%', marginLeft: -150,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: colors.primaryGlow, opacity: 0.4,
  },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, maxWidth: 420, width: '100%', alignSelf: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.borderGlow,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.glow,
  },
  logo: { fontSize: 48, fontWeight: '900', color: colors.text, letterSpacing: -2 },
  tagline: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs, letterSpacing: 2, textTransform: 'uppercase' },
  form: { marginBottom: spacing.xl },
  label: { color: colors.textMuted, fontSize: fontSize.xxs, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.sm },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg, paddingVertical: 16,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  inputWrapFocused: { borderColor: colors.primaryMuted },
  input: { flex: 1, color: colors.text, fontSize: fontSize.lg, fontWeight: '500' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.08)', padding: spacing.sm, borderRadius: borderRadius.sm, marginBottom: spacing.md },
  errorText: { color: colors.danger, fontSize: fontSize.sm },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: 18,
    borderRadius: borderRadius.lg,
    ...shadows.glow,
  },
  buttonDisabled: { backgroundColor: colors.surfaceLight, shadowOpacity: 0 },
  buttonText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
  linkWrap: { flexDirection: 'row', justifyContent: 'center', paddingVertical: spacing.md },
  linkText: { color: colors.textMuted, fontSize: fontSize.sm },
  linkBold: { color: colors.primaryLight, fontSize: fontSize.sm, fontWeight: '700' },
});
