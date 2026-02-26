import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, useWindowDimensions, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient' ;
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

const GAP = 1.5;

function formatDist(m: number): string {
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}

function PresenceDot({ state }: { state?: string }) {
  const dotColor = state === 'open_to_chat' ? '#34D399'
    : state === 'browsing' ? colors.primaryLight
    : state === 'at_venue' ? colors.warning
    : '#34D399';

  return (
    <View style={[pdStyles.outer, { borderColor: colors.background }]}>
      <View style={[pdStyles.inner, { backgroundColor: dotColor }]} />
    </View>
  );
}
const pdStyles = StyleSheet.create({
  outer: { width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 6, right: 6 },
  inner: { width: 7, height: 7, borderRadius: 3.5 },
});

function ShieldBadge({ status }: { status: string }) {
  if (status === 'unverified') return null;
  const color = status === 'reference_verified' ? '#34D399' : status === 'id_verified' ? colors.primaryLight : colors.info;
  return (
    <View style={[sbStyles.wrap, { backgroundColor: color + '30', borderColor: color + '50' }]}>
      <Ionicons name={status === 'reference_verified' ? 'shield-checkmark' : 'shield-half'} size={11} color={color} />
    </View>
  );
}
const sbStyles = StyleSheet.create({
  wrap: { borderRadius: 6, paddingHorizontal: 4, paddingVertical: 2, borderWidth: 0.5 },
});

export default function DiscoverScreen() {
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const cols = width > 500 ? 3 : 2;
  const tileW = (width - GAP * (cols + 1)) / cols;
  const tileH = tileW * 1.45;

  const load = useCallback(async () => {
    try {
      await discoverApi.updateLocation(40.7128, -74.006);
      const res = await discoverApi.nearby(40.7128, -74.006, 50);
      setUsers(res.data.sort((a: NearbyUser, b: NearbyUser) => a.distance - b.distance));
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderTile = ({ item }: { item: NearbyUser }) => (
    <TouchableOpacity
      style={[styles.tile, { width: tileW, height: tileH }]}
      activeOpacity={0.92}
      onPress={() => router.push(`/user/${item.userId}`)}
    >
      {/* Full-bleed photo */}
      <ProfilePhoto photosJson={item.photosJson} size={tileH} borderRadius={0} />

      {/* Top-left badges */}
      <View style={styles.topLeft}>
        {item.isHost && (
          <View style={styles.hostBadge}>
            <Ionicons name="home" size={9} color="#000" />
            <Text style={styles.hostText}>HOST</Text>
          </View>
        )}
        <ShieldBadge status={item.verificationStatus} />
      </View>

      {/* Online indicator */}
      <PresenceDot />

      {/* Bottom gradient overlay with info */}
      <View style={styles.bottomGradient}>
        <View style={styles.gradientInner}>
          <Text style={styles.tileName} numberOfLines={1}>{item.displayName}</Text>
          <View style={styles.tileMetaRow}>
            <Ionicons name="navigate" size={9} color={colors.primaryLight} />
            <Text style={styles.tileDist}>{formatDist(item.distance)}</Text>
            {item.gender && (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.tileGender}>{item.gender}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={i => i.userId}
        renderItem={renderTile}
        numColumns={cols}
        key={`g${cols}`}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ paddingHorizontal: GAP / 2, paddingTop: GAP / 2 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyGlow}><Ionicons name="compass-outline" size={36} color={colors.primaryLight} /></View>
            <Text style={styles.emptyTitle}>No one nearby</Text>
            <Text style={styles.emptySub}>Pull down to refresh</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  tile: {
    marginBottom: GAP, overflow: 'hidden', position: 'relative',
    backgroundColor: colors.surfaceElevated,
  },
  topLeft: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', gap: 4, alignItems: 'center',
  },
  hostBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: colors.host,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  hostText: { color: '#000', fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 40,
    backgroundColor: 'transparent',
  },
  gradientInner: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10, paddingVertical: 8,
  },
  tileName: {
    color: '#fff', fontSize: 14, fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  tileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  tileDist: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  metaDot: { width: 2.5, height: 2.5, borderRadius: 1.25, backgroundColor: 'rgba(255,255,255,0.35)' },
  tileGender: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 160 },
  emptyGlow: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  emptySub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
});
