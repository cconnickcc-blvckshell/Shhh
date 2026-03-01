import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, borderRadius, shadows } from '../constants/theme';
import { BrandMark } from './BrandMark';
import { SurfaceCard, PrimaryCTA, SecondaryAction } from './ui';

const MAX_WIDTH = 1100;
const HERO_FEATURES = [
  'Proximity grid',
  'Discreet + verified',
  'Events & venues',
  'Privacy controls',
];

/**
 * Web front page (unauthenticated): coming-soon layout with hero, logo, side card.
 * Top bar: BrandMark + Coming Soon pill. Grid: hero card (left) + side card (Enter form, links).
 * @see docs/SOFT_LAUNCH_WEB_PLAN.md §4.6
 */
export function WebEntryShell({ onEnter }: { onEnter: () => void }) {
  const [learnOpen, setLearnOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isNarrow = width < 960;

  return (
    <LinearGradient
      colors={['#06040A', '#0B0712', '#08050E', '#06040A']}
      locations={[0, 0.25, 0.6, 1]}
      style={styles.full}
    >
      {/* Ambient glows */}
      <View style={styles.glowPlum} />
      <View style={styles.glowPlum2} />
      <View style={styles.glowGold} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.wrap, { maxWidth: MAX_WIDTH }]}>
          {/* Top bar: logo + Coming Soon pill */}
          <View style={styles.top}>
            <Pressable style={styles.brandTouch} onPress={() => {}} accessibilityLabel="Shhh Social">
              <BrandMark />
            </Pressable>
            <View style={styles.pill}>
              <View style={styles.dot} />
              <Text style={styles.pillText}>Coming Soon</Text>
            </View>
          </View>

          {/* Grid: hero (left) + side card (right) */}
          <View style={[styles.grid, isNarrow && styles.gridStack]}>
            {/* Hero card */}
            <SurfaceCard style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={styles.kicker}>
                <View style={styles.spark} />
                <Text style={styles.kickerText}>Where consent meets curiosity</Text>
              </View>
              <View style={styles.h1Wrap}>
                <Text style={styles.h1}>A lifestyle community for</Text>
                <Text style={styles.h1Accent}>couples, singles, and explorers.</Text>
              </View>
              <Text style={styles.sub}>
                Built for real connections — discreet discovery, consent-first interactions, and events & venues that pull the community together.
              </Text>
              <View style={styles.features}>
                {HERO_FEATURES.map((label) => (
                  <View key={label} style={styles.chip}>
                    <View style={styles.chipDot} />
                    <Text style={styles.chipText}>{label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.glowline} />
              <Text style={styles.fineprint}>
                Launching first in Ontario. Join the list to get early access, venue drops, and beta invites.
              </Text>
            </SurfaceCard>

            {/* Side card: Enter + Learn */}
            <SurfaceCard style={styles.card}>
              <View style={styles.cardInner}>
                <Text style={styles.cardTitle}>Get early access</Text>
                <Text style={styles.cardP}>
                  Enter to sign in with your phone and join the community. Discreet. Verified. Consent-first.
                </Text>
                <View style={styles.ctaCol}>
                  <PrimaryCTA label="Enter" onPress={onEnter} accessibilityLabel="Enter Shhh" />
                  <SecondaryAction label="Learn how it works" onPress={() => setLearnOpen(true)} accessibilityLabel="Learn how it works" />
                </View>
                <Text style={styles.fineprintCard}>
                  By joining, you agree to our terms. <Text style={styles.fineprintBold}>18+ only.</Text>
                </Text>
                <View style={styles.links}>
                  <Text style={styles.linksLabel}>Consent-first. No harassment. No minors.</Text>
                </View>
              </View>
            </SurfaceCard>
          </View>
        </View>
      </ScrollView>

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
                <Text style={styles.modalBold}>Proximity-first.</Text> See who's actually nearby — at venues, events, or out in the world.
              </Text>
              <Text style={styles.modalP}>
                <Text style={styles.modalBold}>Consent-first.</Text> You choose who sees your profile. Blur and reveal on your terms.
              </Text>
              <Text style={styles.modalP}>
                <Text style={styles.modalBold}>Discreet by design.</Text> Private · Verified · Safe. We never sell your data.
              </Text>
              <Text style={styles.modalP}>
                Tap <Text style={styles.modalBold}>Enter</Text> to sign in with your phone and join.
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : undefined },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40, alignItems: 'center' },
  glowPlum: {
    position: 'absolute',
    top: '-10%',
    left: '5%',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(124,43,255,0.08)',
    opacity: 0.6,
  },
  glowPlum2: {
    position: 'absolute',
    top: '20%',
    right: '-5%',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(179,92,255,0.06)',
    opacity: 0.5,
  },
  glowGold: {
    position: 'absolute',
    bottom: '-15%',
    left: '30%',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(212,175,55,0.04)',
    opacity: 0.5,
  },
  wrap: {
    marginHorizontal: 'auto',
    paddingHorizontal: 18,
    paddingTop: 34,
    paddingBottom: 28,
    width: '100%',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brandTouch: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pillText: { fontSize: 12, color: colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.primaryLight,
  },
  grid: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 14,
  },
  gridStack: { flexDirection: 'column' },
  hero: {
    flex: 1.1,
    minHeight: 380,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: 30,
    ...shadows.card,
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
  },
  spark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accentGold,
  },
  kickerText: { fontSize: 12, color: colors.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' },
  h1Wrap: { marginTop: 16, marginBottom: 10 },
  h1: {
    fontSize: 32,
    lineHeight: 1.3,
    color: colors.text,
    fontWeight: '700',
  },
  h1Accent: {
    fontSize: 32,
    lineHeight: 1.3,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  sub: {
    fontSize: 16,
    lineHeight: 1.55,
    color: colors.textMuted,
    maxWidth: 480,
  },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryLight,
  },
  chipText: { fontSize: 13, color: colors.text },
  glowline: {
    height: 1,
    backgroundColor: colors.primaryLight,
    opacity: 0.4,
    marginTop: 18,
    marginBottom: 4,
  },
  fineprint: { fontSize: 12, color: colors.textMuted, lineHeight: 1.45, marginTop: 16, maxWidth: 520 },
  card: {
    flex: 0.9,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    ...shadows.card,
  },
  cardInner: { padding: 22 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  cardP: { fontSize: 14, color: colors.textMuted, lineHeight: 1.5, marginBottom: 14 },
  ctaCol: { gap: 10 },
  enterBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    ...shadows.glow,
  },
  enterBtnPressed: { opacity: 0.95 },
  enterBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
  learnBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  learnBtnPressed: { opacity: 0.85 },
  learnBtnText: { color: colors.primaryLight, fontSize: fontSize.md, fontWeight: '600' },
  fineprintCard: { fontSize: 12, color: colors.textMuted, lineHeight: 1.45, marginTop: 12 },
  fineprintBold: { color: colors.text, fontWeight: '700' },
  links: { marginTop: 14 },
  linksLabel: { fontSize: 11, color: colors.textMuted },
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  modalClose: { fontSize: 28, color: colors.textMuted, lineHeight: 28 },
  modalBody: { padding: spacing.lg, maxHeight: 360 },
  modalP: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 24, marginBottom: spacing.md },
  modalBold: { color: colors.text, fontWeight: '700' },
});
