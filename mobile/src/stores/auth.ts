import { create } from 'zustand';
import { router } from 'expo-router';
import { authApi, usersApi, setAuthToken } from '../api/client';

interface AuthState {
  userId: string | null;
  token: string | null;
  refreshToken: string | null;
  profile: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (phone: string) => Promise<void>;
  register: (phone: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  setTokens: (token: string, refreshToken: string, userId: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userId: null,
  token: null,
  refreshToken: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setTokens: (token, refreshToken, userId) => {
    setAuthToken(token);
    set({ token, refreshToken, userId, isAuthenticated: true, error: null });
  },

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
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    setAuthToken('');
    set({ userId: null, token: null, refreshToken: null, profile: null, isAuthenticated: false });
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
