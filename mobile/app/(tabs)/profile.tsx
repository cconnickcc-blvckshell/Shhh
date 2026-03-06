import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth';
import { safetyApi } from '../../src/api/client';
import { useLocation } from '../../src/hooks/useLocation';
import { ProfilePhoto } from '../../src/components/ProfilePhoto';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';
import { PageShell, ContentColumn, Card } from '../../src/components/layout';
import { SafeState } from '../../src/components/ui';
import { useScreenView } from '../../src/hooks/useScreenView';

function StatPill({ icon, value, color }: { icon: string; value: string; color: string }) {
  return (
    <View style={[spStyles.pill, { borderColor: color + '40' }]}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[spStyles.text, { color }]}>{value}</Text>
    </View>
  );
}
const spStyles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  text: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
});

function MenuItem({ icon, label, onPress, badge, accent }: { icon: string; label: string; onPress: () => void; badge?: string; accent?: boolean }) {
  return (
    <TouchableOpacity style={mStyles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[mStyles.iconBox, accent && { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon as any} size={17} color={accent ? colors.primaryLight : 'rgba(255,255,255,0.5)'} />
      </View>
      <Text style={mStyles.label}>{label}</Text>
      {badge && <View style={mStyles.badge}><Text style={mStyles.badgeText}>{badge}</Text></View>}
      <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.2)" />
    </TouchableOpacity>
  );
}
const mStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(124,43,255,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  label: { flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 15, fontWeight: '500', letterSpacing: 0.1 },
  badge: { backgroundColor: 'rgba(124,43,255,0.8)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginRight: 10 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});

export default function ProfileScreen() {
  useScreenView('profile');
  const { profile, logout, loadProfile, isAuthenticated } = useAuthStore();
  const location = useLocation();
  useEffect(() => {
    if (isAuthenticated && !profile) loadProfile();
  }, [isAuthenticated, profile, loadProfile]);

  if (!profile) {
    return (
      <PageShell>
        <SafeState variant="loading" message="Loading profile..." />
      </PageShell>
    );
  }
  const handlePanic = () => Alert.alert('Emergency Alert', 'Record a panic alert with your location? Your emergency contacts will be notified when possible.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'SEND ALERT',
      style: 'destructive',
        onPress: async () => {
        try {
          const lat = location?.latitude;
          const lng = location?.longitude;
          const res = await safetyApi.panic(lat, lng) as { data?: { message?: string; contactsNotified?: number } };
          const msg = res?.data?.message || 'Alert recorded.';
          Alert.alert('Alert Recorded', msg);
        } catch {
          Alert.alert('Error', 'Could not send alert. Try again.');
        }
      },
    },
  ]);

  return (
    <PageShell>
      <ContentColumn>
    <ScrollView style={styles.scroll} bounces={false}>
      {/* Hero section */}
      <Card style={styles.heroCard}>
        <ProfilePhoto photosJson={profile?.photosJson} size={110} borderRadius={55} canSeeUnblurred={true} />
        <Text style={styles.name} accessibilityRole="header">{profile?.displayName || 'User'}</Text>
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {/* Stat pills */}
        <View style={styles.pillRow}>
          <StatPill icon="shield-half" value={profile?.verificationStatus?.replace('_', ' ') || 'unverified'} color={colors.verified} />
          <StatPill icon="star" value={profile?.experienceLevel || 'new'} color={colors.host} />
          {profile?.isHost && <StatPill icon="home" value="Host" color={colors.success} />}
        </View>
      </Card>

      {/* Interests */}
      {profile?.kinks?.length > 0 && (
        <Card style={styles.section} accessibilityRole="none">
          <Text style={styles.sectionHeader} accessibilityRole="header">Interests</Text>
          <View style={styles.tagRow}>
            {profile.kinks.map((k: string) => (
              <View key={k} style={styles.tag}><Text style={styles.tagText}>{k}</Text></View>
            ))}
          </View>
        </Card>
      )}

      {/* Menu */}
      <Card noPadding style={styles.menuCard} accessibilityRole="none">
        <Text style={[styles.sectionHeader, { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }]} accessibilityRole="header">Menu</Text>
        <MenuItem icon="radio-outline" label="Your Status" onPress={() => router.push('/profile/status')} badge="Live" accent />
        <View style={styles.div} />
        <MenuItem icon="create-outline" label="Edit Profile" onPress={() => router.push('/profile/edit')} />
        {profile?.isHost && (
          <>
            <View style={styles.div} />
            <MenuItem icon="home" label="Hosting" onPress={() => router.push('/profile/hosting')} accent />
          </>
        )}
        {(profile?.verificationTier ?? 0) >= 2 && (
          <>
            <View style={styles.div} />
            <MenuItem icon="business" label="Venues" onPress={() => router.push('/profile/venues')} accent />
          </>
        )}
        <View style={styles.div} />
        <MenuItem icon="images-outline" label="My Albums" onPress={() => router.push('/album')} />
        <View style={styles.div} />
        <MenuItem icon="heart-outline" label="Couple" onPress={() => router.push('/couple')} />
        <View style={styles.div} />
        <MenuItem icon="shield-checkmark-outline" label="Verification" onPress={() => router.push('/verify')} />
        <View style={styles.div} />
        <MenuItem icon="business-outline" label="My Venues" onPress={() => router.push('/profile/venues')} />
        <View style={styles.div} />
        <MenuItem icon="call-outline" label="Emergency Contacts" onPress={() => router.push('/profile/emergency')} />
        <View style={styles.div} />
        <MenuItem icon="ear-outline" label="Whispers" onPress={() => router.push('/whispers')} />
        <View style={styles.div} />
        <MenuItem icon="people" label="Groups" onPress={() => router.push('/groups')} />
        <View style={styles.div} />
        <MenuItem icon="diamond-outline" label="Premium" onPress={() => router.push('/subscription')} badge={undefined} />
        <View style={styles.div} />
        <MenuItem icon="lock-closed-outline" label="Privacy & Data" onPress={() => router.push('/profile/privacy')} />
        <View style={styles.div} />
        <MenuItem icon="book-outline" label="Guides" onPress={() => router.push('/content/guides')} />
        <View style={styles.div} />
        <MenuItem icon="hand-left-outline" label="Community Norms" onPress={() => router.push('/content/norms')} />
      </Card>

      {/* Safety */}
      <TouchableOpacity style={styles.panicBtn} onPress={handlePanic} activeOpacity={0.8} accessibilityLabel="Panic alert" accessibilityRole="button" accessibilityHint="Double tap to send emergency alert with your location">
        <Ionicons name="alert-circle" size={18} color="#fff" />
        <Text style={styles.panicText}>Panic Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
      </ContentColumn>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, paddingHorizontal: spacing.lg },
  heroCard: { alignItems: 'center', paddingTop: 40, paddingBottom: 28, marginTop: spacing.lg, marginBottom: spacing.lg, backgroundColor: 'rgba(11,7,18,0.6)', borderColor: 'rgba(124,43,255,0.1)' },
  name: { color: '#F7F2FF', fontSize: 26, fontWeight: '800', marginTop: 18, letterSpacing: -0.5 },
  bio: { color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 8, textAlign: 'center', maxWidth: 280, lineHeight: 22 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 20 },
  section: { paddingHorizontal: 20, paddingVertical: 18, marginBottom: spacing.md },
  sectionHeader: { color: 'rgba(179,92,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10, textTransform: 'uppercase' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: 'rgba(147,51,234,0.12)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(147,51,234,0.25)' },
  tagText: { color: colors.primaryLight, fontSize: 12, fontWeight: '600' },
  menuCard: { marginBottom: spacing.lg, backgroundColor: 'rgba(11,7,18,0.5)', borderColor: 'rgba(124,43,255,0.06)' },
  div: { height: 1, backgroundColor: 'rgba(255,255,255,0.03)', marginLeft: 64 },
  panicBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(220,38,38,0.9)', padding: 18, borderRadius: 14, marginBottom: 12 },
  panicText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 18, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  logoutText: { color: 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: '600' },
});
