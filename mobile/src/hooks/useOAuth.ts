import { useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuthStore } from '../stores/auth';

export function useOAuth() {
  const oauthApple = useAuthStore((s) => s.oauthApple);

  const signInWithApple = useCallback(async (referralCode?: string) => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not available', 'Sign in with Apple is only available on iOS.');
      return;
    }
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error('No identity token from Apple');
      }
      const displayName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
        : undefined;
      await oauthApple(credential.identityToken, displayName, referralCode);
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      throw err;
    }
  }, [oauthApple]);

  return { signInWithApple };
}
