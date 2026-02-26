import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth';
import { safetyApi } from '../../src/api/client';
import { colors, spacing, fontSize } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { profile, logout, userId } = useAuthStore();

  const handlePanic = () => {
    Alert.alert('Emergency Alert', 'Send panic alert to your emergency contacts?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'SEND ALERT', style: 'destructive', onPress: () => safetyApi.panic(40.7128, -74.006) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color={colors.textMuted} />
        </View>
        <Text style={styles.name}>{profile?.displayName || 'User'}</Text>
        <Text style={styles.id}>ID: {userId?.slice(0, 8)}...</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile?.experienceLevel || 'new'}</Text>
          <Text style={styles.statLabel}>Experience</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.verified }]}>{profile?.verificationStatus || 'unverified'}</Text>
          <Text style={styles.statLabel}>Verification</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile?.isHost ? '🏠 Yes' : 'No'}</Text>
          <Text style={styles.statLabel}>Host</Text>
        </View>
      </View>

      {profile?.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>
      ) : null}

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety</Text>
        <TouchableOpacity style={styles.panicButton} onPress={handlePanic}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.panicText}>Panic Alert</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  name: { fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text },
  id: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginBottom: spacing.lg },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  bio: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: colors.surfaceLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  tagText: { fontSize: fontSize.xs, color: colors.info },
  panicButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.danger, padding: 14, borderRadius: 10 },
  panicText: { color: '#fff', fontSize: fontSize.md, fontWeight: '600' },
  logoutButton: { backgroundColor: colors.surface, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: spacing.lg },
  logoutText: { color: colors.textSecondary, fontSize: fontSize.md },
});
