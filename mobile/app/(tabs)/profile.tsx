import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth';
import { safetyApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={sStyles.card}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[sStyles.value, { color }]}>{value}</Text>
      <Text style={sStyles.label}>{label}</Text>
    </View>
  );
}
const sStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', gap: 3, borderWidth: 0.5, borderColor: colors.border },
  value: { fontSize: fontSize.xs, fontWeight: '700', textTransform: 'capitalize' },
  label: { fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
});

function MenuItem({ icon, label, onPress, danger, badge }: { icon: string; label: string; onPress: () => void; danger?: boolean; badge?: string }) {
  return (
    <TouchableOpacity style={mStyles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={[mStyles.iconBox, danger && { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
        <Ionicons name={icon as any} size={17} color={danger ? colors.danger : colors.primaryLight} />
      </View>
      <Text style={[mStyles.label, danger && { color: colors.danger }]}>{label}</Text>
      {badge && <View style={mStyles.badge}><Text style={mStyles.badgeText}>{badge}</Text></View>}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}
const mStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md },
  iconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  label: { flex: 1, color: colors.text, fontSize: fontSize.md },
  badge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginRight: spacing.sm },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

export default function ProfileScreen() {
  const { profile, logout } = useAuthStore();
  const handlePanic = () => Alert.alert('Emergency Alert', 'Send panic alert to emergency contacts with your location?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'SEND ALERT', style: 'destructive', onPress: () => safetyApi.panic(40.7128, -74.006) },
  ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatar}><Ionicons name="person" size={36} color={colors.textMuted} /></View>
        </View>
        <Text style={styles.name}>{profile?.displayName || 'User'}</Text>
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard icon="shield-checkmark" label="Verified" value={profile?.verificationStatus?.replace('_', ' ') || 'none'} color={colors.verified} />
        <StatCard icon="star" label="Level" value={profile?.experienceLevel || 'new'} color={colors.host} />
        <StatCard icon="home" label="Host" value={profile?.isHost ? 'Yes' : 'No'} color={colors.info} />
      </View>

      {/* Interests */}
      {profile?.kinks?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INTERESTS</Text>
          <View style={styles.tags}>{profile.kinks.map((k: string) => (
            <View key={k} style={styles.tag}><Text style={styles.tagText}>{k}</Text></View>
          ))}</View>
        </View>
      )}

      {/* Menu */}
      <View style={styles.menuCard}>
          <MenuItem icon="radio-outline" label="Your Status" onPress={() => router.push('/profile/status')} badge="Live" />
          <View style={styles.menuDiv} />
          <MenuItem icon="create-outline" label="Edit Profile" onPress={() => router.push('/profile/edit')} />
        <View style={styles.menuDiv} />
        <MenuItem icon="images-outline" label="My Albums" onPress={() => router.push('/album')} />
        <View style={styles.menuDiv} />
        <MenuItem icon="heart-outline" label="Couple Settings" onPress={() => router.push('/couple')} />
        <View style={styles.menuDiv} />
        <MenuItem icon="shield-checkmark-outline" label="Verification" onPress={() => router.push('/verify')} badge="Tier 2" />
        <View style={styles.menuDiv} />
        <MenuItem icon="call-outline" label="Emergency Contacts" onPress={() => {}} />
        <View style={styles.menuDiv} />
        <MenuItem icon="lock-closed-outline" label="Privacy & Data" onPress={() => {}} />
      </View>

      {/* Panic */}
      <TouchableOpacity style={styles.panicBtn} onPress={handlePanic} activeOpacity={0.8}>
        <Ionicons name="alert-circle" size={20} color="#fff" />
        <Text style={styles.panicText}>Panic Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatarOuter: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadows.glow },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  bio: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: 'center', maxWidth: 280 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { backgroundColor: colors.primarySoft, paddingHorizontal: 14, paddingVertical: 7, borderRadius: borderRadius.full, borderWidth: 0.5, borderColor: colors.borderGlow },
  tagText: { color: colors.primaryLight, fontSize: fontSize.xs, fontWeight: '600' },
  menuCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.lg, borderWidth: 0.5, borderColor: colors.border },
  menuDiv: { height: 0.5, backgroundColor: colors.border, marginLeft: 60 },
  panicBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.danger, padding: 16, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  panicText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  logoutBtn: { backgroundColor: colors.card, padding: 16, borderRadius: borderRadius.md, alignItems: 'center', borderWidth: 0.5, borderColor: colors.border },
  logoutText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '600' },
});
