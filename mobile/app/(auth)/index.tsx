import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';
import { AuthScreenBackground, AppIconImage } from '../../src/components/Backgrounds';
import { WebEntryShell } from '../../src/components/WebEntryShell';
import { AuthOptions, type AuthMethod } from '../../src/components/AuthOptions';
import { useOAuth } from '../../src/hooks/useOAuth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const SNAP_CLIENT_ID = process.env.EXPO_PUBLIC_SNAP_CLIENT_ID;

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(Platform.OS !== 'web');
  const [authStep, setAuthStep] = useState<'choose' | 'phone'>('choose');
  const { sendOTP, login, oauthGoogle, oauthSnap, isLoading, error, clearError } = useAuthStore();
  const { signInWithApple } = useOAuth();
  const canSubmit = phone.length >= 10;

  const [googleRequest, , googlePrompt] = useIdTokenAuthRequest(
    GOOGLE_CLIENT_ID
      ? { clientId: GOOGLE_CLIENT_ID, webClientId: GOOGLE_CLIENT_ID }
      : { clientId: 'disabled', webClientId: 'disabled' }
  );

  const redirectUri = AuthSession.makeRedirectUri();
  const [snapRequest, , snapPrompt] = AuthSession.useAuthRequest(
    {
      clientId: SNAP_CLIENT_ID || 'placeholder',
      redirectUri,
      scopes: ['https://auth.snapchat.com/oauth2/api/user.display_name', 'https://auth.snapchat.com/oauth2/api/user.external_id'],
      responseType: AuthSession.ResponseType.Code,
    },
    {
      authorizationEndpoint: 'https://accounts.snapchat.com/accounts/oauth2/auth',
      tokenEndpoint: 'https://accounts.snapchat.com/accounts/oauth2/token',
    }
  );

  if (Platform.OS === 'web' && !showLoginForm) {
    return <WebEntryShell onEnter={() => setShowLoginForm(true)} />;
  }

  const handleAuthSelect = async (method: AuthMethod) => {
    if (method === 'phone') {
      setAuthStep('phone');
      return;
    }
    clearError();
    try {
      if (method === 'apple') {
        await signInWithApple();
      } else if (method === 'google') {
        if (!GOOGLE_CLIENT_ID || !googleRequest) {
          Alert.alert('Not configured', 'Google Sign-In needs EXPO_PUBLIC_GOOGLE_CLIENT_ID.');
          return;
        }
        const result = await googlePrompt();
        if (result?.type === 'success' && result.params.id_token) {
          await oauthGoogle(result.params.id_token);
        } else if (result?.type !== 'cancel') {
          throw new Error('Google sign-in failed');
        }
      } else if (method === 'snap') {
        if (!SNAP_CLIENT_ID || !snapRequest) {
          Alert.alert('Not configured', 'Snapchat Sign-In needs EXPO_PUBLIC_SNAP_CLIENT_ID.');
          return;
        }
        const result = await snapPrompt();
        if (result?.type === 'success' && result.params.code) {
          await oauthSnap(result.params.code);
        } else if (result?.type !== 'cancel') {
          throw new Error('Snapchat sign-in failed');
        }
      }
    } catch (err: any) {
      useAuthStore.setState({ error: err.message, isLoading: false });
    }
  };

  const handleContinue = async () => {
    if (!canSubmit) return;
    clearError();
    try {
      await login(phone);
    } catch {
      try {
        const result = await sendOTP(phone);
        if (result.devCode) {
          router.replace({ pathname: '/(auth)/verify-code', params: { phone, mode: 'login', devCode: result.devCode } });
          setTimeout(() => Alert.alert('Dev Mode', `Your OTP code is: ${result.devCode}\n\nEnter it below to continue.`, [{ text: 'OK' }]), 300);
        } else {
          router.replace({ pathname: '/(auth)/verify-code', params: { phone, mode: 'login' } });
        }
      } catch {}
    }
  };

  if (authStep === 'choose') {
    return (
      <AuthScreenBackground>
        <View style={styles.container}>
          <View style={styles.glow} />
          <View style={styles.content}>
            <View style={styles.logoWrap}>
              <View style={styles.iconFrame}>
                <AppIconImage size={72} />
              </View>
              <Text style={styles.logo}>Shhh</Text>
              <Text style={styles.tagline}>YOUR SECRET IS SAFE</Text>
            </View>
            <AuthOptions onSelect={handleAuthSelect} isLoading={isLoading} />
            {error && <View style={styles.errorBox}><Ionicons name="alert-circle" size={14} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View>}
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={styles.linkWrap}><Text style={styles.linkText}>Don't have an account? </Text><Text style={styles.linkBold}>Sign up</Text></TouchableOpacity>
            </Link>
          </View>
        </View>
      </AuthScreenBackground>
    );
  }

  return (
    <AuthScreenBackground>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.glow} />
        <View style={styles.content}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setAuthStep('choose')}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.logoWrap}>
            <View style={styles.iconFrame}>
              <AppIconImage size={72} />
            </View>
            <Text style={styles.logo}>Shhh</Text>
            <Text style={styles.tagline}>YOUR SECRET IS SAFE</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={[styles.inputWrap, phone.length > 0 && styles.inputFocused]}>
              <Ionicons name="call-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput style={styles.input} placeholder="+1 (555) 000-0000" placeholderTextColor={colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
            </View>

            {error && <View style={styles.errorBox}><Ionicons name="alert-circle" size={14} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View>}

            <TouchableOpacity style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleContinue} disabled={isLoading || !canSubmit} activeOpacity={0.8}>
              {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <><Text style={styles.buttonText}>Continue</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
            </TouchableOpacity>
          </View>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.linkWrap}><Text style={styles.linkText}>Don't have an account? </Text><Text style={styles.linkBold}>Sign up</Text></TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </AuthScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  glow: { position: 'absolute', top: -120, left: '50%', marginLeft: -150, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(147,51,234,0.12)', opacity: 0.6 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, maxWidth: 420, width: '100%', alignSelf: 'center' },
  backBtn: { position: 'absolute', top: 50, left: spacing.lg, zIndex: 10 },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  iconFrame: { width: 72, height: 72, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.borderGlow, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadows.glow },
  logo: { fontSize: 48, fontWeight: '900', color: colors.text, letterSpacing: -2 },
  tagline: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs, letterSpacing: 2, textTransform: 'uppercase' },
  form: { marginBottom: spacing.xl },
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
