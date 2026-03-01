import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';

const CODE_LENGTH = 6;

export default function VerifyCodeScreen() {
  const { phone, mode, displayName, devCode } = useLocalSearchParams<{ phone: string; mode: string; displayName?: string; devCode?: string }>();
  const [digits, setDigits] = useState<string[]>(() => {
    const code = (devCode as string)?.replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (code?.length === CODE_LENGTH) return code.split('');
    return Array(CODE_LENGTH).fill('');
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { verifyAndLogin, verifyAndRegister, sendOTP } = useAuthStore();

  const missingParams = (!phone || !mode) && !devCode;

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const interval = setInterval(() => {
      setResendTimer(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const code = (devCode as string)?.replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (code?.length === CODE_LENGTH) setDigits(code.split(''));
  }, [devCode]);

  const handleVerify = () => {
    const code = digits.join('');
    if (code.length === CODE_LENGTH) submitCode(code);
  };

  const handleDigit = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError('');

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every(d => d) && next.join('').length === CODE_LENGTH) {
      submitCode(next.join(''));
    }
  };

  const handleBackspace = (index: number) => {
    if (!digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
    }
  };

  const submitCode = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      if (mode === 'register' && displayName) {
        await verifyAndRegister(phone!, code, displayName);
      } else {
        await verifyAndLogin(phone!, code);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendTimer > 0) return;
    try {
      await sendOTP(phone!);
      setResendTimer(60);
    } catch {}
  };

  if (missingParams) {
    return (
      <PremiumDarkBackground style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="warning-outline" size={48} color={colors.warning} />
          <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center', marginTop: 16 }}>
            Missing verification details. Please start from login or sign up.
          </Text>
          <TouchableOpacity style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: borderRadius.md }} onPress={() => router.replace('/(auth)')}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.formCard}>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="chatbubble-outline" size={28} color={colors.primaryLight} />
              </View>
              <Text style={styles.title}>Verify your number</Text>
              <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
              <Text style={styles.phone}>{phone}</Text>
            </View>

            <View style={styles.codeRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={r => { inputRefs.current[i] = r; }}
                  style={[styles.codeInput, d ? styles.codeInputFilled : null, error ? styles.codeInputError : null]}
                  value={d}
                  onChangeText={v => handleDigit(i, v)}
                  onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Backspace') handleBackspace(i); }}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={14} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.verifyBtn, digits.join('').length !== CODE_LENGTH && styles.verifyBtnDisabled]}
              onPress={handleVerify}
              disabled={loading || digits.join('').length !== CODE_LENGTH}
            >
              <Text style={styles.verifyBtnText}>Verify</Text>
            </TouchableOpacity>

            {loading && <ActivityIndicator color={colors.primaryLight} size="large" style={{ marginTop: spacing.lg }} />}

            <TouchableOpacity onPress={resend} disabled={resendTimer > 0} style={styles.resendBtn}>
              <Text style={[styles.resendText, resendTimer > 0 && { color: colors.textMuted }]}>
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend verification code'}
              </Text>
            </TouchableOpacity>
        </View>
      </View>
    </PremiumDarkBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: 60, maxWidth: 420, width: '100%', alignSelf: 'center' },
  back: { marginBottom: spacing.xl },
  formCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)' },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.borderGlow, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadows.glow },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted },
  phone: { fontSize: fontSize.md, color: colors.primaryLight, fontWeight: '700', marginTop: spacing.xs },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  codeInput: {
    width: 48, height: 56, borderRadius: borderRadius.md,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    color: colors.text, fontSize: fontSize.xl, fontWeight: '800',
    textAlign: 'center',
  },
  codeInputFilled: { borderColor: colors.primaryLight, backgroundColor: colors.primarySoft },
  codeInputError: { borderColor: colors.danger },
  errorBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  errorText: { color: colors.danger, fontSize: fontSize.sm },
  verifyBtn: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.lg,
  },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  resendBtn: { alignItems: 'center', marginTop: spacing.xxl, paddingVertical: spacing.md },
  resendText: { color: colors.primaryLight, fontSize: fontSize.sm, fontWeight: '600' },
});
