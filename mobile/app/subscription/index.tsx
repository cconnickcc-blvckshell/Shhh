import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';

const TIER_DETAILS = [
  { id: 'free', name: 'Free', price: '$0', icon: 'person-outline', color: 'rgba(255,255,255,0.3)',
    features: ['1 persona', 'Basic discovery', 'Standard messaging', 'Ads shown'] },
  { id: 'discreet', name: 'Discreet', price: '$9.99/mo', icon: 'eye-off-outline', color: '#818CF8',
    features: ['2 personas', 'Ghost browsing', 'No ads', 'See who revealed to you'] },
  { id: 'phantom', name: 'Phantom', price: '$19.99/mo', icon: 'moon-outline', color: colors.primaryLight, popular: true,
    features: ['3 personas', 'Presence scheduling', 'Timed auto-revoke', 'No ads', 'Advanced filters'] },
  { id: 'elite', name: 'Elite', price: '$39.99/mo', icon: 'diamond-outline', color: '#FBBF24',
    features: ['5 personas', 'Priority safety response', 'Profile view analytics', 'Unlimited albums', 'No ads', 'Everything in Phantom'] },
];

export default function SubscriptionScreen() {
  const [currentTier, setCurrentTier] = useState('free');

  const fetchSubscription = useCallback(() => {
    api<{ data: any }>('/v1/billing/subscription')
      .then(r => setCurrentTier(r.data.tier || 'free'))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  useFocusEffect(useCallback(() => { fetchSubscription(); }, [fetchSubscription]));

  const handleUpgrade = async (tier: string) => {
    try {
      const res = await api<{ data: { checkoutUrl: string } }>('/v1/billing/checkout', {
        method: 'POST', body: JSON.stringify({ tier }),
      });
      const url = res?.data?.checkoutUrl;
      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Checkout', 'Open this link in your browser: ' + url);
        }
      } else {
        Alert.alert('Checkout', 'No checkout URL returned. Try again later.');
      }
    } catch (err: any) {
      const msg = err.message || 'Stripe not configured yet.';
      if (/not configured|coming soon/i.test(msg)) {
        Alert.alert('Coming Soon', 'Premium plans are launching soon. We\'ll notify you when they\'re available.');
      } else {
        Alert.alert('Info', msg);
      }
    }
  };

  return (
    <PremiumDarkBackground style={s.wrapper}>
      <PageShell>
        <SubPageHeader title="Premium" subtitle="More privacy. More control." />

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} bounces={false}>
      <View style={s.heroSection}>
        <Text style={s.heroTitle}>More privacy.{'\n'}More control.</Text>
        <Text style={s.heroSub}>Pay for discretion, not exposure.</Text>
      </View>

      {TIER_DETAILS.map(tier => {
        const isCurrent = currentTier === tier.id;
        const isPopular = tier.popular;
        return (
          <View key={tier.id} style={[s.tierCard, isCurrent && s.tierCurrent, isPopular && s.tierPopular]}>
            {isPopular && <View style={s.popularBadge}><Text style={s.popularText}>MOST POPULAR</Text></View>}
            <View style={s.tierHeader}>
              <View style={[s.tierIcon, { backgroundColor: tier.color + '20' }]}>
                <Ionicons name={tier.icon as any} size={22} color={tier.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.tierName}>{tier.name}</Text>
                <Text style={[s.tierPrice, { color: tier.color }]}>{tier.price}</Text>
              </View>
              {isCurrent ? (
                <View style={s.currentBadge}><Text style={s.currentText}>Current</Text></View>
              ) : tier.id !== 'free' ? (
                <TouchableOpacity style={s.upgradeBtn} onPress={() => handleUpgrade(tier.id)}>
                  <Text style={s.upgradeBtnText}>Upgrade</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={s.featureList}>
              {tier.features.map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <Ionicons name="checkmark" size={14} color={tier.color} />
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      <Text style={s.disclaimer}>Cancel anytime. No hidden fees.</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
      </PageShell>
    </PremiumDarkBackground>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  heroSection: { paddingHorizontal: spacing.lg, paddingVertical: 30, alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', lineHeight: 36 },
  heroSub: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 8 },
  tierCard: { marginHorizontal: spacing.lg, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' },
  tierCurrent: { borderColor: colors.primaryLight },
  tierPopular: { borderColor: colors.primaryLight, backgroundColor: 'rgba(147,51,234,0.06)' },
  popularBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 10 },
  popularText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  tierHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  tierIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tierName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  tierPrice: { fontSize: 14, fontWeight: '600', marginTop: 1 },
  currentBadge: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  currentText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  upgradeBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 16, ...shadows.glow },
  upgradeBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  featureList: { gap: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
  disclaimer: { color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
