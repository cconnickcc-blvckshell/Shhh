import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, borderRadius, shadows } from '../constants/theme';

/**
 * Web-only entry screen when unauthenticated: tone-setting first impression before auth.
 * Full-height dark, purple motif; "Enter" → login; "Learn how it works" → modal.
 * @see docs/SOFT_LAUNCH_WEB_PLAN.md §4.6
 */
export function WebEntryShell({ onEnter }: { onEnter: () => void }) {
  const [learnOpen, setLearnOpen] = useState(false);

  return (
    <LinearGradient
      colors={['#06040A', '#0B0712', '#08050E', '#06040A']}
      locations={[0, 0.25, 0.6, 1]}
      style={styles.full}
    >
      <View style={styles.glow} />
      <View style={styles.content}>
        <View style={styles.heroArea}>
          <Text style={styles.heroLine}>Your secret is safe.</Text>
          <Text style={styles.heroSub}>Discreet. Verified. Consent-first.</Text>
        </View>

        <View style={styles.ctaRow}>
          <Pressable
            style={({ pressed }) => [styles.enterBtn, pressed && styles.enterBtnPressed]}
            onPress={onEnter}
            accessibilityRole="button"
            accessibilityLabel="Enter Shhh"
          >
            <LinearGradient
              colors={['rgba(124,43,255,0.95)', 'rgba(179,92,255,0.65)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.enterBtnText}>Enter</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.learnBtn, pressed && styles.learnBtnPressed]}
            onPress={() => setLearnOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Learn how it works"
          >
            <Text style={styles.learnBtnText}>Learn how it works</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.wordmark}>Shhh</Text>
          <Text style={styles.trustLine}>You control who sees what. Always.</Text>
        </View>
      </View>

      <Modal visible={learnOpen} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setLearnOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How Shhh works</Text>
              <Pressable onPress={() => setLearnOpen(false)} hitSlop={12}>
                <Text style={styles.modalClose}>×</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalP}>
                <Text style={styles.modalBold}>Proximity-first.</Text> See who’s actually nearby — at venues, events, or out in the world. No algorithm guessing.
              </Text>
              <Text style={styles.modalP}>
                <Text style={styles.modalBold}>Consent-first.</Text> You choose who sees your profile. Blur and reveal on your terms. Messaging is opt-in.
              </Text>
              <Text style={styles.modalP}>
                <Text style={styles.modalBold}>Discreet by design.</Text> Private · Verified · Safe. We never sell your data. Your identity stays in your control.
              </Text>
              <Text style={styles.modalP}>Tap <Text style={styles.modalBold}>Enter</Text> to sign in with your phone and join.</Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : undefined },
  glow: {
    position: 'absolute',
    top: -80,
    left: '50%',
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(124,43,255,0.22)',
    opacity: 0.85,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  heroArea: { alignItems: 'center', marginBottom: spacing.xxl },
  heroLine: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
  ctaRow: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center', marginBottom: spacing.xxl },
  enterBtn: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
    position: 'relative',
    ...shadows.glow,
  },
  enterBtnPressed: { opacity: 0.98 },
  enterBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700', letterSpacing: 0.5 },
  learnBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  learnBtnPressed: { opacity: 0.85 },
  learnBtnText: { color: colors.primaryLight, fontSize: fontSize.md, fontWeight: '600' },
  footer: { position: 'absolute', bottom: spacing.xxl, alignItems: 'center' },
  wordmark: { fontSize: 28, fontWeight: '900', color: colors.primaryLight, letterSpacing: -1 },
  trustLine: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  modalClose: { fontSize: 28, color: colors.textMuted, lineHeight: 28 },
  modalBody: { padding: spacing.lg, maxHeight: 360 },
  modalP: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 24, marginBottom: spacing.md },
  modalBold: { color: colors.text, fontWeight: '700' },
});
