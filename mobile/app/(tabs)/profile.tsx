import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth';
import { safetyApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={statStyles.card}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', gap: 4 },
  value: { fontSize: fontSize.sm, fontWeight: '700', textTransform: 'capitalize' },
  label: { fontSize: fontSize.xxs, color: colors.textMuted },
});

function MenuItem({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={menuStyles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={[menuStyles.iconBox, danger && { backgroundColor: 'rgba(255,71,87,0.15)' }]}>
        <Ionicons name={icon as any} size={18} color={danger ? colors.danger : colors.textSecondary} />
      </View>
      <Text style={[menuStyles.label, danger && { color: colors.danger }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.md },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  label: { flex: 1, color: colors.text, fontSize: fontSize.md },
});

export default function ProfileScreen() {
  const { profile, logout } = useAuthStore();

  const handlePanic = () => {
    Alert.alert(
      'Emergency Alert',
      'This will immediately notify all your emergency contacts with your current location.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'SEND ALERT', style: 'destructive', onPress: () => safetyApi.panic(40.7128, -74.006) },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.textMuted} />
          </View>
        </View>
        <Text style={styles.name}>{profile?.displayName || 'User'}</Text>
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>

      <View style={styles.statsRow}>
        <StatCard icon="shield-checkmark" label="Verification" value={profile?.verificationStatus?.replace('_', ' ') || 'none'} color={colors.verified} />
        <StatCard icon="star" label="Experience" value={profile?.experienceLevel || 'new'} color={colors.warning} />
        <StatCard icon="home" label="Host" value={profile?.isHost ? 'Yes' : 'No'} color={colors.info} />
      </View>

      {profile?.kinks?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tags}>
            {profile.kinks.map((k: string) => (
              <View key={k} style={styles.tag}>
                <Text style={styles.tagText}>{k}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.menuSection}>
        <View style={styles.menuCard}>
          <MenuItem icon="create-outline" label="Edit Profile" onPress={() => router.push('/profile/edit')} />
          <View style={styles.menuDivider} />
          <MenuItem icon="images-outline" label="My Albums" onPress={() => router.push('/album')} />
          <View style={styles.menuDivider} />
          <MenuItem icon="people-outline" label="Couple Settings" onPress={() => router.push('/couple')} />
          <View style={styles.menuDivider} />
          <MenuItem icon="shield-outline" label="Verification" onPress={() => router.push('/verify')} />
          <View style={styles.menuDivider} />
          <MenuItem icon="call-outline" label="Emergency Contacts" onPress={() => {}} />
          <View style={styles.menuDivider} />
          <MenuItem icon="document-text-outline" label="Privacy & Data" onPress={() => {}} />
        </View>
      </View>

      <TouchableOpacity style={styles.panicButton} onPress={handlePanic} activeOpacity={0.8}>
        <Ionicons name="alert-circle" size={22} color="#fff" />
        <Text style={styles.panicText}>Panic Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatarRing: {
    width: 92, height: 92, borderRadius: 46,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  bio: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: 'center', maxWidth: 280 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { backgroundColor: colors.surfaceLight, paddingHorizontal: 14, paddingVertical: 7, borderRadius: borderRadius.full },
  tagText: { color: colors.info, fontSize: fontSize.xs, fontWeight: '600' },
  menuSection: { marginBottom: spacing.lg },
  menuCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, overflow: 'hidden' },
  menuDivider: { height: 0.5, backgroundColor: colors.border, marginLeft: 60 },
  panicButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.danger, padding: 16, borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  panicText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  logoutButton: {
    backgroundColor: colors.card, padding: 16, borderRadius: borderRadius.md, alignItems: 'center',
  },
  logoutText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '600' },
});
