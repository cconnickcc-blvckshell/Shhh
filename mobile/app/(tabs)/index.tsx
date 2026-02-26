import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { discoverApi, usersApi } from '../../src/api/client';
import { colors, spacing, fontSize } from '../../src/constants/theme';

interface NearbyUser {
  userId: string;
  displayName: string;
  bio: string;
  distance: number;
  verificationStatus: string;
  experienceLevel: string;
  isHost: boolean;
}

export default function DiscoverScreen() {
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      await discoverApi.updateLocation(40.7128, -74.006);
      const res = await discoverApi.nearby(40.7128, -74.006, 50);
      setUsers(res.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleLike = async (userId: string) => {
    const res = await usersApi.like(userId);
    if (res.data.matched) {
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, displayName: `💕 ${u.displayName}` } : u));
    } else {
      setUsers(prev => prev.filter(u => u.userId !== userId));
    }
  };

  const badgeColor = (status: string) => {
    if (status === 'reference_verified') return colors.trusted;
    if (status === 'id_verified') return colors.verified;
    if (status === 'photo_verified') return colors.info;
    return colors.textMuted;
  };

  const renderUser = ({ item }: { item: NearbyUser }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={colors.textMuted} />
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.displayName}</Text>
            {item.isHost && <Text style={styles.hostBadge}>🏠 Host</Text>}
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.badge, { color: badgeColor(item.verificationStatus) }]}>
              ● {item.verificationStatus.replace('_', ' ')}
            </Text>
            <Text style={styles.distance}>{(item.distance / 1000).toFixed(1)} km</Text>
          </View>
        </View>
      </View>
      {item.bio ? <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text> : null}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.passBtn} onPress={() => setUsers(prev => prev.filter(u => u.userId !== item.userId))}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.likeBtn} onPress={() => handleLike(item.userId)}>
          <Ionicons name="heart" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.userId}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="compass-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No one nearby yet</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  hostBadge: { fontSize: fontSize.xs, color: colors.warning, backgroundColor: 'rgba(253,203,110,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  badge: { fontSize: fontSize.xs },
  distance: { fontSize: fontSize.xs, color: colors.textMuted },
  bio: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  passBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  likeBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
});
