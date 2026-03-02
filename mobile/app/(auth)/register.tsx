import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';
import { AuthScreenBackground, AppIconImage } from '../../src/components/Backgrounds';

export default function RegisterScreen() {
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { sendOTP, register: registerDirect, isLoading, error, clearError } = useAuthStore();
  const canSubmit = phone.length >= 10 && displayName.length >= 2;

  const handleContinue = async () => {
    if (!canSubmit) return;
    clearError();
    try {
        const result = await sendOTP(phone);
        if (result.devCode) {
          router.replace({ pathname: '/(auth)/verify-code', params: { phone, mode: 'register', displayName, devCode: result.devCode } });
          setTimeout(() => Alert.alert('Dev Mode', `Your OTP code is: ${result.devCode}\n\nEnter it below to continue.`, [{ text: 'OK' }]), 300);
        } else {
          router.replace({ pathname: '/(auth)/verify-code', params: { phone, mode: 'register', displayName } });
        }
    } catch {
      try { await registerDirect(phone, displayName); } catch {}
    }
  };

  return (
    <AuthScreenBackground>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.glow} />
        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <View style={styles.iconFrame}><AppIconImage size={56} /></View>
            <Text style={styles.title}>Join Shhh</Text>
            <Text style={styles.subtitle}>Create your secret identity</Text>
          </View>

          <View style={styles.formCard}>
              <Text style={styles.label}>DISPLAY NAME</Text>
              <View style={[styles.inputWrap, displayName.length > 0 && styles.inputFocused]}>
                <Ionicons name="person-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput style={styles.input} placeholder="Alex & Jamie" placeholderTextColor={colors.textMuted} value={displayName} onChangeText={setDisplayName} />
              </View>

              <Text style={styles.label}>PHONE NUMBER</Text>
              <View style={[styles.inputWrap, phone.length > 0 && styles.inputFocused]}>
                <Ionicons name="call-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput style={styles.input} placeholder="+1 (555) 000-0000" placeholderTextColor={colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>

              {error && <View style={styles.errorBox}><Ionicons name="alert-circle" size={14} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View>}

              <TouchableOpacity style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleContinue} disabled={isLoading || !canSubmit} activeOpacity={0.8}>
                {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <><Text style={styles.buttonText}>Get Started</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
              </TouchableOpacity>
          </View>

          <Link href="/(auth)" asChild>
            <TouchableOpacity style={styles.linkWrap}><Text style={styles.linkText}>Already a member? </Text><Text style={styles.linkBold}>Log in</Text></TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </AuthScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  glow: { position: 'absolute', top: -100, left: '50%', marginLeft: -150, width: 300, height: 300, borderRadius: 150, backgroundColor: colors.primaryGlow, opacity: 0.3 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, maxWidth: 420, width: '100%', alignSelf: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  iconFrame: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.borderGlow, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadows.glow },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  formCard: { backgroundColor: 'rgba(14,11,22,0.92)', borderRadius: 16, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: 'rgba(147,51,234,0.25)' },
  label: { color: colors.textMuted, fontSize: fontSize.xxs, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.sm },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, paddingHorizontal: spacing.lg, paddingVertical: 16, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  inputFocused: { borderColor: colors.primaryMuted },
  input: { flex: 1, color: colors.text, fontSize: fontSize.lg, fontWeight: '500' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.08)', padding: spacing.sm, borderRadius: borderRadius.sm, marginBottom: spacing.md },
  errorText: { color: colors.danger, fontSize: fontSize.sm },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: 18, borderRadius: borderRadius.lg, ...shadows.glow },
  buttonDisabled: { backgroundColor: colors.surfaceLight, shadowOpacity: 0 },
  buttonText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
  linkWrap: { flexDirection: 'row', justifyContent: 'center', paddingVertical: spacing.md },
  linkText: { color: colors.textMuted, fontSize: fontSize.sm },
  linkBold: { color: colors.primaryLight, fontSize: fontSize.sm, fontWeight: '700' },
});
