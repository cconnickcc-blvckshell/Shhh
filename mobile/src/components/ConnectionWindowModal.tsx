import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  cap: number;
  used: number;
  tierOptions?: string[];
}

const TIER_LABELS: Record<string, { name: string; cap: string }> = {
  discreet: { name: 'Discreet', cap: '30' },
  phantom: { name: 'Phantom', cap: '50' },
  elite: { name: 'Elite', cap: 'Unlimited' },
};

export function ConnectionWindowModal({ visible, onClose, cap, used, tierOptions = ['discreet', 'phantom', 'elite'] }: Props) {
  const handleUpgrade = () => {
    onClose();
    router.push('/subscription');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.header}>
            <Ionicons name="people-outline" size={28} color={colors.primaryLight} />
            <Text style={s.title}>Connection window reached</Text>
          </View>
          <Text style={s.copy}>You've reached your limit for this view.</Text>
          <Text style={s.subcopy}>
            Change filters or refresh to see more — or expand with Phantom (50) or Elite (Unlimited).
          </Text>
          <View style={s.meter}>
            <Text style={s.meterLabel}>Connections used</Text>
            <Text style={s.meterValue}>{used}/{cap}</Text>
          </View>
          {tierOptions.length > 0 && (
            <View style={s.tiers}>
              {tierOptions.map((t) => {
                const tinfo = TIER_LABELS[t];
                if (!tinfo) return null;
                return (
                  <View key={t} style={s.tierRow}>
                    <Text style={s.tierName}>{tinfo.name}</Text>
                    <Text style={s.tierCap}>{tinfo.cap}</Text>
                  </View>
                );
              })}
            </View>
          )}
          <View style={s.actions}>
            <TouchableOpacity style={s.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.8}>
              <Text style={s.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.dismissBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={s.dismissBtnText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  copy: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  subcopy: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  meter: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  meterLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  meterValue: {
    color: colors.primaryLight,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  tiers: {
    marginBottom: spacing.lg,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  tierName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.sm,
  },
  tierCap: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: fontSize.sm,
  },
  actions: {
    gap: spacing.sm,
  },
  upgradeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  dismissBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: fontSize.sm,
  },
});
