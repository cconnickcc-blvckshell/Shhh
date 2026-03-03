import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../constants/theme';

/**
 * Banner shown when device is offline. Mount in root layout.
 * @see docs/E2E_CAPABILITY_AUDIT_REPORT.md §4.1, MASTER_IMPLEMENTATION_CHECKLIST 2.2
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    NetInfo.fetch().then((state) => setIsOffline(state.isConnected === false));
    return () => unsub();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={18} color="#fff" />
      <Text style={styles.text}>You're offline. Some features may not work.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
