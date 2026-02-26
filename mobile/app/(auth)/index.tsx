import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize } from '../../src/constants/theme';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    if (phone.length < 10) return;
    try {
      await login(phone);
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>🔐</Text>
        <Text style={styles.title}>Shhh</Text>
        <Text style={styles.subtitle}>Welcome back</Text>

        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor={colors.textMuted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>New here? Create account</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.lg },
  card: { backgroundColor: colors.surface, padding: spacing.xl, borderRadius: 16, width: '100%', maxWidth: 400, alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xl },
  input: { width: '100%', backgroundColor: colors.surfaceLight, color: colors.text, padding: 14, borderRadius: 10, fontSize: fontSize.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  error: { color: colors.danger, fontSize: fontSize.sm, marginBottom: spacing.sm },
  button: { width: '100%', backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: spacing.md },
  buttonText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '600' },
  linkButton: { padding: spacing.sm },
  linkText: { color: colors.textSecondary, fontSize: fontSize.sm },
});
