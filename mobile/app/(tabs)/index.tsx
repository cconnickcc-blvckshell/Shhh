import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { discoverApi, usersApi } from '../../src/api/client';
import { ProfilePhoto } from '../../src/components/ProfilePhoto';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

interface NearbyUser {
  userId: string;
  displayName: string;
  bio: string;
  distance: number;
  verificationStatus: string;
  experienceLevel: string;
  isHost: boolean;
  gender: string | null;
  photosJson: string[];
}

const GAP = 2;

function formatDist(m: number): string {
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}

export default function DiscoverScreen() {
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const cols = width > 600 ? 3 : 2;
  const tileW = (width - GAP * (cols + 1)) / cols;

  const load = useCallback(async () => {
    try {
      await discoverApi.updateLocation(40.7128, -74.006);
      const res = await discoverApi.nearby(40.7128, -74.006, 50);
      setUsers(res.data.sort((a: NearbyUser, b: NearbyUser) => a.distance - b.distance));
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleLike = async (userId: string) => {
    const res = await usersApi.like(userId);
    if (res.data.matched) {
      setUsers(p => p.map(u => u.userId === userId ? { ...u, displayName: `${u.displayName} 💜` } : u));
    } else {
      setUsers(p => p.filter(u => u.userId !== userId));
    }
  };

  const renderTile = ({ item }: { item: NearbyUser }) => {
    const isVerified = item.verificationStatus !== 'unverified';
    return (
      <TouchableOpacity
        style={[styles.tile, { width: tileW, height: tileW * 1.4 }]}
        activeOpacity={0.9}
        onPress={() => router.push(`/user/${item.userId}`)}
        onLongPress={() => handleLike(item.userId)}
      >
        {/* Photo area */}
        <View style={styles.photoArea}>
          <ProfilePhoto photosJson={item.photosJson as any} size={tileW} borderRadius={0} blurred={false} />
        </View>

        {/* Top badges */}
        <View style={styles.topBadges}>
          {item.isHost && (
            <View style={styles.hostBadge}>
              <Ionicons name="home" size={8} color="#000" />
              <Text style={styles.hostText}>HOST</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.verified} />
            </View>
          )}
        </View>

        {/* Online dot */}
        <View style={styles.onlineDot} />

        {/* Bottom info overlay */}
        <View style={styles.bottomInfo}>
          <Text style={styles.tileName} numberOfLines={1}>{item.displayName}</Text>
          <View style={styles.distRow}>
            <Ionicons name="navigate" size={9} color={colors.primaryLight} />
            <Text style={styles.distText}>{formatDist(item.distance)}</Text>
            {item.gender && (
              <>
                <View style={styles.dot} />
                <Text style={styles.genderText}>{item.gender}</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={i => i.userId}
        renderItem={renderTile}
        numColumns={cols}
        key={`g${cols}`}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ padding: GAP / 2 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyGlow}>
              <Ionicons name="compass-outline" size={40} color={colors.primaryLight} />
            </View>
            <Text style={styles.emptyTitle}>No one nearby</Text>
            <Text style={styles.emptySub}>Pull down to refresh</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tile: { marginBottom: GAP, overflow: 'hidden', position: 'relative', backgroundColor: colors.card },
  photoArea: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated },
  topBadges: { position: 'absolute', top: 6, left: 6, right: 6, flexDirection: 'row', alignItems: 'flex-start' },
  hostBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.host, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  hostText: { color: '#000', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  verifiedBadge: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 2 },
  onlineDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.online, borderWidth: 1.5, borderColor: colors.card },
  bottomInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 8, paddingVertical: 8, backgroundColor: 'rgba(5,5,8,0.8)' },
  tileName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  distText: { color: colors.textSecondary, fontSize: fontSize.xxs, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted },
  genderText: { color: colors.textMuted, fontSize: fontSize.xxs },
  empty: { alignItems: 'center', paddingTop: 140 },
  emptyGlow: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  emptySub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
});
