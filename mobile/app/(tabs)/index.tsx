import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Dimensions, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { discoverApi, usersApi } from '../../src/api/client';
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
}

const TILE_GAP = 3;

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function verificationIcon(status: string): { icon: string; color: string } | null {
  if (status === 'reference_verified') return { icon: 'shield-checkmark', color: colors.trusted };
  if (status === 'id_verified') return { icon: 'checkmark-circle', color: colors.verified };
  if (status === 'photo_verified') return { icon: 'camera', color: colors.info };
  return null;
}

export default function DiscoverScreen() {
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();

  const numCols = width > 600 ? 3 : 2;
  const tileSize = (width - TILE_GAP * (numCols + 1)) / numCols;

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
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, displayName: `${u.displayName} 💕` } : u));
    } else {
      setUsers(prev => prev.filter(u => u.userId !== userId));
    }
  };

  const renderTile = ({ item }: { item: NearbyUser }) => {
    const badge = verificationIcon(item.verificationStatus);
    return (
      <TouchableOpacity
        style={[styles.tile, { width: tileSize, height: tileSize * 1.35 }]}
        activeOpacity={0.85}
        onLongPress={() => handleLike(item.userId)}
      >
        <View style={styles.tilePhoto}>
          <Ionicons name="person" size={tileSize * 0.3} color={colors.textMuted} />
        </View>

        <View style={styles.tileOverlay}>
          <View style={styles.tileTopRow}>
            {item.isHost && (
              <View style={styles.hostPill}>
                <Text style={styles.hostText}>HOST</Text>
              </View>
            )}
            {badge && (
              <Ionicons name={badge.icon as any} size={14} color={badge.color} />
            )}
          </View>

          <View style={styles.tileBottom}>
            <Text style={styles.tileName} numberOfLines={1}>{item.displayName}</Text>
            <View style={styles.tileMetaRow}>
              <View style={styles.distancePill}>
                <Ionicons name="location" size={10} color={colors.primary} />
                <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
              </View>
              {item.gender && (
                <Text style={styles.tileGender}>{item.gender}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.onlineDot} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.userId}
        renderItem={renderTile}
        numColumns={numCols}
        key={`grid-${numCols}`}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="compass-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No one nearby</Text>
            <Text style={styles.emptySub}>Pull down to refresh or expand your radius</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  grid: { padding: TILE_GAP / 2 },
  row: { gap: TILE_GAP },
  tile: {
    marginBottom: TILE_GAP,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.card,
    position: 'relative',
  },
  tilePhoto: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  tileOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  tileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hostPill: {
    backgroundColor: 'rgba(255,165,2,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  hostText: { color: '#000', fontSize: fontSize.xxs, fontWeight: '800', letterSpacing: 0.5 },
  tileBottom: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    marginHorizontal: -spacing.sm,
    marginBottom: -spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  tileName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  tileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distanceText: {
    color: colors.textSecondary,
    fontSize: fontSize.xxs,
    fontWeight: '600',
  },
  tileGender: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
  },
  onlineDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.online,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  empty: { alignItems: 'center', paddingTop: 120 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  emptySub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
});
