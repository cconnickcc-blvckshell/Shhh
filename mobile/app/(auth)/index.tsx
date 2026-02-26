import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    if (phone.length < 10) return;
    try { await login(phone); } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSpace} />
      <View style={styles.card}>
        <Text style={styles.logo}>Shhh</Text>
        <Text style={styles.subtitle}>Welcome back</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Phone</Text>
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
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, phone.length < 10 && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading || phone.length < 10}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.lg },
  topSpace: { flex: 0.3 },
  card: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  logo: { fontSize: 44, fontWeight: '900', color: colors.primary, textAlign: 'center', marginBottom: spacing.xs, letterSpacing: -1 },
  subtitle: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  inputWrapper: { marginBottom: spacing.md },
  inputLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '600', marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.surfaceElevated, color: colors.text,
    padding: 16, borderRadius: borderRadius.md, fontSize: fontSize.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  errorBox: { backgroundColor: 'rgba(255,71,87,0.1)', padding: spacing.sm, borderRadius: borderRadius.sm, marginBottom: spacing.md },
  errorText: { color: colors.danger, fontSize: fontSize.sm },
  button: {
    backgroundColor: colors.primary, padding: 16, borderRadius: borderRadius.md,
    alignItems: 'center', marginBottom: spacing.lg,
  },
  buttonDisabled: { backgroundColor: colors.surfaceLight },
  buttonText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
  linkButton: { alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { color: colors.textMuted, fontSize: fontSize.sm },
  linkBold: { color: colors.primary, fontWeight: '600' },
});
