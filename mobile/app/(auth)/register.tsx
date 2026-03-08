import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';
import { AuthScreenBackground, AppIconImage } from '../../src/components/Backgrounds';
import { AuthOptions, type AuthMethod } from '../../src/components/AuthOptions';
import { useOAuth } from '../../src/hooks/useOAuth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const SNAP_CLIENT_ID = process.env.EXPO_PUBLIC_SNAP_CLIENT_ID;

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ ref?: string }>();
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [authStep, setAuthStep] = useState<'choose' | 'phone' | 'email'>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { sendOTP, register: registerDirect, registerEmail, oauthGoogle, oauthSnap, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    if (params.ref) setReferralCode(String(params.ref).toUpperCase().trim());
  }, [params.ref]);
  const { signInWithApple } = useOAuth();
  const canSubmit = phone.length >= 10 && displayName.length >= 2;

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
    { authorizationEndpoint: 'https://accounts.snapchat.com/accounts/oauth2/auth', tokenEndpoint: 'https://accounts.snapchat.com/accounts/oauth2/token' }
  );

  const handleAuthSelect = async (method: AuthMethod) => {
    if (method === 'phone') {
      setAuthStep('phone');
      return;
    }
    if (method === 'email') {
      setAuthStep('email');
      return;
    }
    clearError();
    const ref = referralCode.trim() || undefined;
    try {
      if (method === 'apple') {
        await signInWithApple(ref);
      } else if (method === 'google') {
        if (!GOOGLE_CLIENT_ID || !googleRequest) {
          Alert.alert('Not configured', 'Google Sign-In needs EXPO_PUBLIC_GOOGLE_CLIENT_ID.');
          return;
        }
        const result = await googlePrompt();
        if (result?.type === 'success' && result.params.id_token) {
          await oauthGoogle(result.params.id_token, undefined, ref);
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
          await oauthSnap(result.params.code, undefined, ref);
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
      const result = await sendOTP(phone);
      const ref = referralCode.trim() || undefined;
      if (result.devCode) {
        router.replace({ pathname: '/(auth)/verify-code', params: { phone, mode: 'register', displayName, devCode: result.devCode, ...(ref && { ref }) } });
        setTimeout(() => Alert.alert('Dev Mode', `Your OTP code is: ${result.devCode}\n\nEnter it below to continue.`, [{ text: 'OK' }]), 300);
      } else {
        router.replace({ pathname: '/(auth)/verify-code', params: { phone, mode: 'register', displayName, ...(ref && { ref }) } });
      }
    } catch {
      try { await registerDirect(phone, displayName, referralCode.trim() || undefined); } catch {}
    }
  };

  const handleEmailSignUp = async () => {
    if (!email.trim() || password.length < 8) return;
    clearError();
    try {
      const displayName = (email.split('@')[0] || 'User').slice(0, 50);
      await registerEmail(email.trim().toLowerCase(), password, displayName.length >= 2 ? displayName : 'User', referralCode.trim() || undefined);
    } catch {}
  };

  if (authStep === 'email') {
    return (
      <AuthScreenBackground>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.glow} />
          <View style={styles.content}>
            <TouchableOpacity style={styles.backBtn} onPress={() => { setAuthStep('choose'); setEmail(''); setPassword(''); clearError(); }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.logoWrap}>
              <View style={styles.iconFrame}><AppIconImage size={56} /></View>
              <Text style={styles.title}>Join Shhh</Text>
              <Text style={styles.subtitle}>Create your secret identity</Text>
            </View>
            <View style={styles.formCard}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={[styles.inputWrap, email.length > 0 && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              </View>
              <Text style={styles.label}>PASSWORD (min 8 characters)</Text>
              <View style={[styles.inputWrap, password.length > 0 && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
              </View>
              <Text style={styles.label}>INVITE CODE (optional)</Text>
              <View style={[styles.inputWrap, referralCode.length > 0 && styles.inputFocused]}>
                <Ionicons name="person-add-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput style={styles.input} placeholder="e.g. ABC12345" placeholderTextColor={colors.textMuted} value={referralCode} onChangeText={(t) => setReferralCode(t.toUpperCase())} autoCapitalize="characters" autoCorrect={false} />
              </View>
              {error && <View style={styles.errorBox}><Ionicons name="alert-circle" size={14} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View>}
              <TouchableOpacity style={[styles.button, (!email.trim() || password.length < 8) && styles.buttonDisabled]} onPress={handleEmailSignUp} disabled={isLoading || !email.trim() || password.length < 8} activeOpacity={0.8}>
                {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <><Text style={styles.buttonText}>Create account</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.linkWrap} onPress={() => router.push('/(auth)')}>
              <Text style={styles.linkText}>Already a member? </Text><Text style={styles.linkBold}>Log in</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </AuthScreenBackground>
    );
  }

  if (authStep === 'choose') {
    return (
      <AuthScreenBackground>
        <View style={styles.container}>
          <View style={styles.glow} />
          <View style={styles.content}>
            <View style={styles.logoWrap}>
              <View style={styles.iconFrame}><AppIconImage size={56} /></View>
              <Text style={styles.title}>Join Shhh</Text>
              <Text style={styles.subtitle}>Create your secret identity</Text>
            </View>
            <View style={[styles.formCard, { marginBottom: spacing.md }]}>
              <Text style={styles.label}>INVITE CODE (optional)</Text>
              <View style={[styles.inputWrap, referralCode.length > 0 && styles.inputFocused]}>
                <Ionicons name="person-add-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
                <TextInput style={styles.input} placeholder="e.g. ABC12345" placeholderTextColor={colors.textMuted} value={referralCode} onChangeText={(t) => setReferralCode(t.toUpperCase())} autoCapitalize="characters" autoCorrect={false} />
              </View>
            </View>
            <AuthOptions onSelect={handleAuthSelect} isLoading={isLoading} />
            {error && <View style={styles.errorBox}><Ionicons name="alert-circle" size={14} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View>}
            <TouchableOpacity style={styles.linkWrap} onPress={() => router.push('/(auth)')}>
              <Text style={styles.linkText}>Already a member? </Text><Text style={styles.linkBold}>Log in</Text>
            </TouchableOpacity>
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

            <Text style={styles.label}>INVITE CODE (optional)</Text>
            <View style={[styles.inputWrap, referralCode.length > 0 && styles.inputFocused]}>
              <Ionicons name="person-add-outline" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput style={styles.input} placeholder="e.g. ABC12345" placeholderTextColor={colors.textMuted} value={referralCode} onChangeText={(t) => setReferralCode(t.toUpperCase())} autoCapitalize="characters" autoCorrect={false} />
            </View>

            {error && <View style={styles.errorBox}><Ionicons name="alert-circle" size={14} color={colors.danger} /><Text style={styles.errorText}>{error}</Text></View>}

            <TouchableOpacity style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleContinue} disabled={isLoading || !canSubmit} activeOpacity={0.8}>
              {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <><Text style={styles.buttonText}>Get Started</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.linkWrap} onPress={() => router.push('/(auth)')}>
            <Text style={styles.linkText}>Already a member? </Text><Text style={styles.linkBold}>Log in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AuthScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  glow: { position: 'absolute', top: -100, left: '50%', marginLeft: -150, width: 300, height: 300, borderRadius: 150, backgroundColor: colors.primaryGlow, opacity: 0.3 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, maxWidth: 420, width: '100%', alignSelf: 'center' },
  backBtn: { position: 'absolute', top: 50, left: spacing.lg, zIndex: 10 },
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
