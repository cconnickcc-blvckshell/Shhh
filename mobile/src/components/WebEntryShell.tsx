import React from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, ScrollView,
  Platform, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Use public folder assets so hero/logo display on Vercel (expo export copies public/ to dist/)
// require() assets are not reliably bundled for web static export; public/ is the standard fix
const HERO_URI = '/hero.png';
const LOGO_URI = '/logo.png';

const FEATURES = [
  { icon: 'compass', title: 'Proximity Grid', desc: 'See who\'s nearby right now. No algorithms. Just proximity and intention.' },
  { icon: 'eye-off', title: 'Privacy First', desc: 'Blur your photos. Control who sees you. Everything expires.' },
  { icon: 'shield-checkmark', title: 'Verified & Trusted', desc: 'Multi-tier verification. References from real people. Trust you can see.' },
  { icon: 'timer', title: 'Ephemeral by Design', desc: 'Chats are sessions. Media self-destructs. Presence decays. Nothing lingers.' },
  { icon: 'business', title: 'Venues & Events', desc: 'Discover lifestyle venues, themed nights, and private events near you.' },
  { icon: 'ear', title: 'Whisper', desc: 'Send anonymous signals to people nearby. They see your distance, not your name.' },
];

const TRUST_POINTS = [
  'End-to-end encryption infrastructure',
  'No data sold. No targeted ads. Ever.',
  'GDPR/CCPA compliant with 1-click data export',
  'Panic wipe destroys all data instantly',
  'Open safety reporting with 24hr SLA',
];

export function WebEntryShell({ onEnter }: { onEnter: () => void }) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>
      {/* ====== HERO SECTION ====== */}
      <View style={s.heroSection}>
        {/* Background image — from public/ so it works on Vercel static export */}
        <Image
          source={{ uri: HERO_URI }}
          style={s.heroBgImage}
          resizeMode="cover"
        />
        <View style={s.heroOverlay} pointerEvents="none" />

        {/* Nav bar */}
        <View style={[s.nav, isDesktop && s.navDesktop]}>
          <Image
            source={{ uri: LOGO_URI }}
            style={s.navLogo}
            resizeMode="contain"
          />
          <View style={s.navRight}>
            <Pressable onPress={onEnter} style={s.navSignUpBtn}>
              <Text style={s.navSignUpText}>Sign Up</Text>
            </Pressable>
            <Pressable onPress={onEnter} style={s.navLoginBtn}>
              <Text style={s.navLoginText}>Log In</Text>
            </Pressable>
          </View>
        </View>

        {/* Hero content */}
        <View style={[s.heroContent, isDesktop && s.heroContentDesktop]}>
          <Text style={[s.heroTag]}>PRIVACY-NATIVE SOCIAL</Text>
          <Text style={[s.heroTitle, isDesktop && s.heroTitleDesktop]}>
            Who's nearby.{'\n'}Who's open.{'\n'}Right now.
          </Text>
          <Text style={[s.heroSub, isDesktop && s.heroSubDesktop]}>
            Shhh is a discreet, proximity-driven social platform for adults who value
            privacy, safety, and authentic connections.
          </Text>

          <View style={s.heroCTARow}>
            <Pressable onPress={onEnter} style={s.heroCTA}>
              <Text style={s.heroCTAText}>Enter Shhh</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
            <View style={s.heroMeta}>
              <Ionicons name="shield-checkmark" size={14} color="rgba(147,51,234,0.8)" />
              <Text style={s.heroMetaText}>Free · No credit card · 18+</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ====== FEATURES GRID ====== */}
      <View style={[s.section, s.featuresSection]}>
        <Text style={s.sectionTag}>HOW IT WORKS</Text>
        <Text style={s.sectionTitle}>A radar, not a feed</Text>
        <Text style={s.sectionSub}>
          Shhh shows you who's around you and what they're open to — without
          exposing who you are tomorrow.
        </Text>

        <View style={[s.featureGrid, isDesktop && s.featureGridDesktop]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[s.featureCard, isDesktop && s.featureCardDesktop]}>
              <View style={s.featureIconWrap}>
                <Ionicons name={f.icon as any} size={22} color="#A855F7" />
              </View>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ====== TRUST SECTION ====== */}
      <View style={[s.section, s.trustSection]}>
        <View style={[s.trustInner, isDesktop && s.trustInnerDesktop]}>
          <View style={s.trustLeft}>
            <Text style={s.sectionTag}>TRUST & SAFETY</Text>
            <Text style={s.trustTitle}>Built to disappear{'\n'}when you need it to</Text>
            <Text style={s.trustSub}>
              Most apps want your data. We want your trust. Every feature is designed
              so you feel safe being unseen.
            </Text>
          </View>
          <View style={s.trustRight}>
            {TRUST_POINTS.map((point, i) => (
              <View key={i} style={s.trustPoint}>
                <Ionicons name="checkmark-circle" size={18} color="#34D399" />
                <Text style={s.trustPointText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ====== PREMIUM SECTION ====== */}
      <View style={[s.section, s.premiumSection]}>
        <Text style={s.sectionTag}>PREMIUM</Text>
        <Text style={s.sectionTitle}>Pay for control,{'\n'}not exposure</Text>
        <Text style={s.sectionSub}>
          Free users are never punished. Premium gives you more privacy, more personas,
          and more control — not more visibility.
        </Text>
        <View style={s.premiumTiers}>
          {[
            { name: 'Free', price: '$0', features: ['1 persona', 'Proximity grid', 'Safety tools'] },
            { name: 'Phantom', price: '$19.99/mo', features: ['3 personas', 'Ghost browsing', 'Timed reveals', 'No ads'], popular: true },
            { name: 'Elite', price: '$39.99/mo', features: ['5 personas', 'Priority safety', 'View analytics', 'Everything'] },
          ].map((tier, i) => (
            <View key={i} style={[s.tierCard, tier.popular && s.tierCardPopular]}>
              {tier.popular && <View style={s.popularBadge}><Text style={s.popularText}>POPULAR</Text></View>}
              <Text style={s.tierName}>{tier.name}</Text>
              <Text style={[s.tierPrice, tier.popular && { color: '#A855F7' }]}>{tier.price}</Text>
              {tier.features.map((f, j) => (
                <View key={j} style={s.tierFeature}>
                  <Ionicons name="checkmark" size={14} color={tier.popular ? '#A855F7' : 'rgba(255,255,255,0.4)'} />
                  <Text style={s.tierFeatureText}>{f}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* ====== FINAL CTA ====== */}
      <View style={[s.section, s.ctaSection]}>
        <Text style={s.ctaTitle}>Your secret is safe</Text>
        <Text style={s.ctaSub}>Join the community that knows when to disappear.</Text>
        <Pressable onPress={onEnter} style={s.finalCTA}>
          <Text style={s.finalCTAText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </View>

      {/* ====== FOOTER ====== */}
      <View style={s.footer}>
        <Text style={s.footerText}>© 2026 Shhh · Privacy Policy · Terms · 18+</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { flexGrow: 1 },

  // Hero
  heroSection: { minHeight: 700, position: 'relative', justifyContent: 'flex-end' },
  heroBgImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' } as any,
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  nav: { position: 'absolute' as const, top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, zIndex: 10 },
  navDesktop: { paddingHorizontal: 60, paddingTop: 30 },
  navLogo: { width: 100, height: 40 },
  navRight: { flexDirection: 'row', gap: 12 },
  navSignUpBtn: { backgroundColor: '#9333EA', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 },
  navSignUpText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  navLoginBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 },
  navLoginText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  heroContent: { padding: 24, paddingBottom: 60, zIndex: 5 },
  heroContentDesktop: { paddingHorizontal: 80, paddingBottom: 80, maxWidth: 700 },
  heroTag: { color: '#A855F7', fontSize: 11, fontWeight: '800', letterSpacing: 3, marginBottom: 16 },
  heroTitle: { color: '#fff', fontSize: 36, fontWeight: '900', lineHeight: 44, letterSpacing: -1 },
  heroTitleDesktop: { fontSize: 56, lineHeight: 64 },
  heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 26, marginTop: 16, maxWidth: 500 },
  heroSubDesktop: { fontSize: 18, lineHeight: 30 },
  heroCTARow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 32 },
  heroCTA: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#9333EA', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 28 },
  heroCTAText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  // Sections
  section: { paddingHorizontal: 24, paddingVertical: 60 },
  sectionTag: { color: '#A855F7', fontSize: 11, fontWeight: '800', letterSpacing: 3, marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 32, fontWeight: '900', lineHeight: 40, letterSpacing: -0.5 },
  sectionSub: { color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 26, marginTop: 12, maxWidth: 500 },

  // Features
  featuresSection: { backgroundColor: '#050510' },
  featureGrid: { marginTop: 32, gap: 12 },
  featureGridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
  featureCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  featureCardDesktop: { width: '31%' },
  featureIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(147,51,234,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  featureTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  featureDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 22 },

  // Trust
  trustSection: { backgroundColor: '#08060F' },
  trustInner: {},
  trustInnerDesktop: { flexDirection: 'row', gap: 60 },
  trustLeft: { flex: 1, marginBottom: 24 },
  trustTitle: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 36, marginBottom: 12 },
  trustSub: { color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 24 },
  trustRight: { flex: 1, gap: 14 },
  trustPoint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trustPointText: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },

  // Premium
  premiumSection: { backgroundColor: '#050510', alignItems: 'center' },
  premiumTiers: { flexDirection: 'row', gap: 12, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' },
  tierCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, width: 220, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', position: 'relative' as const, overflow: 'hidden' },
  tierCardPopular: { borderColor: 'rgba(147,51,234,0.4)', backgroundColor: 'rgba(147,51,234,0.05)' },
  popularBadge: { position: 'absolute' as const, top: 0, right: 0, backgroundColor: '#9333EA', paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 10 },
  popularText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  tierName: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  tierPrice: { color: 'rgba(255,255,255,0.5)', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  tierFeature: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tierFeatureText: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },

  // Final CTA
  ctaSection: { alignItems: 'center', paddingVertical: 80, backgroundColor: '#08060F' },
  ctaTitle: { color: '#fff', fontSize: 36, fontWeight: '900', textAlign: 'center', letterSpacing: -1 },
  ctaSub: { color: 'rgba(255,255,255,0.4)', fontSize: 16, marginTop: 8, textAlign: 'center' },
  finalCTA: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#9333EA', paddingHorizontal: 32, paddingVertical: 18, borderRadius: 30, marginTop: 28 },
  finalCTAText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // Footer
  footer: { padding: 24, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  footerText: { color: 'rgba(255,255,255,0.2)', fontSize: 12 },
});
