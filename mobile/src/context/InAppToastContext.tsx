import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSocket } from '../hooks/useSocket';
import { useAuthStore } from '../stores/auth';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

type ToastData = { title: string; body: string; conversationId?: string; whisperId?: string };

const ToastContext = createContext<{ show: (data: ToastData) => void } | null>(null);

const AUTO_DISMISS_MS = 4000;

export function InAppToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { onNotification } = useSocket();

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setToast(null);
    });
  }, [opacity]);

  const show = useCallback((data: ToastData) => {
    setToast(data);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [opacity]);

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return;

    const unsub = onNotification((data: any) => {
      const type = data?.type;
      const conversationId = data?.conversationId;
      const preview = data?.preview || 'New message';

      if (type === 'new_message' && conversationId) {
        const inChat = pathname?.startsWith('/chat/');
        const currentConvId = pathname?.replace('/chat/', '');
        if (inChat && currentConvId === conversationId) return;

        show({ title: 'New message', body: preview, conversationId });
      }
    });

    return unsub;
  }, [isAuthenticated, onNotification, pathname, show]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(hide, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [toast, hide]);

  const onView = useCallback(() => {
    if (toast?.conversationId) {
      hide();
      router.push(`/chat/${toast.conversationId}` as any);
    } else if (toast?.whisperId) {
      hide();
      router.push('/whispers');
    }
  }, [toast, hide]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View style={[s.toast, { opacity }]} pointerEvents="box-none">
          <View style={s.toastInner}>
            <Text style={s.toastTitle} numberOfLines={1}>{toast.title}</Text>
            <Text style={s.toastBody} numberOfLines={2}>{toast.body}</Text>
            {(toast.conversationId || toast.whisperId) && (
              <TouchableOpacity style={s.toastBtn} onPress={onView} activeOpacity={0.7}>
                <Text style={s.toastBtnText}>View</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 60 : 50,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  toastInner: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  toastBody: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 4 },
  toastBtn: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: 4 },
  toastBtnText: { color: colors.primaryLight, fontSize: fontSize.sm, fontWeight: '600' },
});

export function useInAppToast() {
  const ctx = useContext(ToastContext);
  return ctx ?? { show: (_: ToastData) => {} };
}
