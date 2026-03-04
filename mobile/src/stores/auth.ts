import { create } from 'zustand';
import { authApi, usersApi, setAuthToken, setRefreshToken, clearTokens, api } from '../api/client';
import { router } from 'expo-router';

interface AuthState {
  userId: string | null;
  token: string | null;
  refreshToken: string | null;
  profile: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  sendOTP: (phone: string) => Promise<{ devCode?: string }>;
  verifyAndLogin: (phone: string, code: string) => Promise<void>;
  verifyAndRegister: (phone: string, code: string, displayName: string) => Promise<void>;
  login: (phone: string) => Promise<void>;
  register: (phone: string, displayName: string) => Promise<void>;
  oauthApple: (idToken: string, displayName?: string) => Promise<void>;
  oauthGoogle: (idToken: string, displayName?: string) => Promise<void>;
  oauthSnap: (authCode: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  setTokens: (token: string, refreshToken: string, userId: string) => void;
  clearSession: () => void;
  clearError: () => void;
}

function getSavedToken(): string | null {
  try { return typeof window !== 'undefined' ? window.localStorage?.getItem('shhh_token') || null : null; } catch { return null; }
}

function clearSavedToken() {
  try { if (typeof window !== 'undefined') window.localStorage?.removeItem('shhh_token'); } catch {}
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  token: getSavedToken(),
  refreshToken: null,
  profile: null,
  isAuthenticated: !!getSavedToken(),
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  clearSession: () => {
    clearTokens();
    clearSavedToken();
    set({ userId: null, token: null, refreshToken: null, profile: null, isAuthenticated: false });
    router.replace('/(auth)');
  },

  setTokens: (token, refreshToken, userId) => {
    setAuthToken(token);
    if (refreshToken) setRefreshToken(refreshToken);
    set({ token, refreshToken, userId, isAuthenticated: true, error: null });
  },

  sendOTP: async (phone) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api<{ data: { sent: boolean; devCode?: string } }>('/v1/auth/phone/send-code', {
        method: 'POST', body: JSON.stringify({ phone }),
      });
      set({ isLoading: false });
      return { devCode: res.data.devCode };
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  verifyAndLogin: async (phone, code) => {
    set({ isLoading: true, error: null });
    try {
      const verifyRes = await api<{ data: { verified: boolean; sessionToken?: string } }>('/v1/auth/phone/verify', {
        method: 'POST', body: JSON.stringify({ phone, code }),
      });
      const sessionToken = verifyRes.data?.sessionToken;
      const res = await authApi.login(phone, sessionToken);
      get().setTokens(res.data.accessToken, res.data.refreshToken, res.data.userId);
      await get().loadProfile();
      router.replace('/(tabs)');
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  verifyAndRegister: async (phone, code, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const verifyRes = await api<{ data: { verified: boolean; sessionToken?: string } }>('/v1/auth/phone/verify', {
        method: 'POST', body: JSON.stringify({ phone, code }),
      });
      const sessionToken = verifyRes.data?.sessionToken;
      const res = await authApi.register(phone, displayName, sessionToken);
      get().setTokens(res.data.accessToken, res.data.refreshToken, res.data.userId);
      await get().loadProfile();
      router.replace('/(auth)/onboarding');
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  // Direct login/register (fallback for dev when OTP is bypassed)
  login: async (phone) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(phone);
      get().setTokens(res.data.accessToken, res.data.refreshToken, res.data.userId);
      await get().loadProfile();
      router.replace('/(tabs)');
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  register: async (phone, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(phone, displayName);
      get().setTokens(res.data.accessToken, res.data.refreshToken, res.data.userId);
      await get().loadProfile();
      router.replace('/(tabs)');
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  oauthApple: async (idToken, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.oauthApple(idToken, displayName);
      get().setTokens(res.data.accessToken, res.data.refreshToken, res.data.userId);
      await get().loadProfile();
      router.replace('/(tabs)');
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  oauthGoogle: async (idToken, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.oauthGoogle(idToken, displayName);
      get().setTokens(res.data.accessToken, res.data.refreshToken, res.data.userId);
      await get().loadProfile();
      router.replace('/(tabs)');
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  oauthSnap: async (authCode, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.oauthSnap(authCode, displayName);
      get().setTokens(res.data.accessToken, res.data.refreshToken, res.data.userId);
      await get().loadProfile();
      router.replace('/(tabs)');
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    clearTokens();
    clearSavedToken();
    set({ userId: null, token: null, refreshToken: null, profile: null, isAuthenticated: false });
    router.replace('/(auth)');
  },

  loadProfile: async () => {
    try {
      const res = await usersApi.getMe();
      set({ profile: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
