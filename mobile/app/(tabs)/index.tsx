import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, useWindowDimensions, Alert, TextInput, Vibration } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { discoverApi, api } from '../../src/api/client';
import { ProfilePhoto } from '../../src/components/ProfilePhoto';
import { useAuthStore } from '../../src/stores/auth';
import { colors, fontSize, spacing, borderRadius } from '../../src/constants/theme';

interface NearbyUser {
  userId: string; displayName: string; bio: string; distance: number;
  verificationStatus: string; experienceLevel: string; isHost: boolean;
  gender: string | null; photosJson: string[];
  presenceState: string | null; activeIntents: string[];
}

const GAP = 1.5;

function formatDist(m: number): string { return m < 1000 ? `${Math.abs(m)}m` : `${(Math.abs(m) / 1000).toFixed(1)}km`; }

const PRESENCE_COLORS: Record<string, string> = {
  open_to_chat: '#34D399', browsing: '#A855F7', nearby: '#60A5FA', at_venue: '#FBBF24', at_event: '#F472B6',
};

const INTENT_ICONS: Record<string, { icon: string; label: string }> = {
  open_tonight: { icon: 'moon', label: 'Tonight' },
  traveling: { icon: 'airplane', label: 'Traveling' },
  hosting: { icon: 'home', label: 'Hosting' },
  looking_for_friends: { icon: 'people', label: 'Friends' },
  looking_for_more: { icon: 'heart', label: 'More' },
  couples_only: { icon: 'people-circle', label: 'Couples' },
};

const RADIUS_OPTIONS = [5, 25, 50] as const;
type SortMode = 'nearest' | 'active';

export default function DiscoverScreen() {
  const profile = useAuthStore((s) => s.profile);
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [whisperTarget, setWhisperTarget] = useState<string | null>(null);
  const [whisperText, setWhisperText] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('nearest');
  const { width } = useWindowDimensions();
  const cols = width > 500 ? 3 : 2;
  const tileW = (width - GAP * (cols + 1)) / cols;
  const tileH = tileW * 1.45;

  const primaryIntent = profile?.primaryIntent ?? undefined;

  const load = useCallback(async () => {
    try {
      await discoverApi.updateLocation(40.7128, -74.006);
      const res = await discoverApi.nearby(40.7128, -74.006, radiusKm, primaryIntent);
      let list = (res.data as NearbyUser[]).sort((a, b) => a.distance - b.distance);
      if (verifiedOnly) list = list.filter((u) => u.verificationStatus && u.verificationStatus !== 'unverified');
      setUsers(list);
    } catch {}
  }, [radiusKm, primaryIntent, verifiedOnly]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const sortedUsers = useMemo(() => {
    if (sortMode === 'active') {
      return [...users].sort((a, b) => {
        const aActive = a.presenceState ? 1 : 0;
        const bActive = b.presenceState ? 1 : 0;
        if (bActive !== aActive) return bActive - aActive;
        return a.distance - b.distance;
      });
    }
    return [...users].sort((a, b) => a.distance - b.distance);
  }, [users, sortMode]);

  const handleLongPress = (item: NearbyUser) => {
    Vibration.vibrate(10);
    setWhisperTarget(item.userId);
  };

  const sendWhisper = async () => {
    if (!whisperTarget || !whisperText.trim()) return;
    try {
      await api('/v1/whispers', { method: 'POST', body: JSON.stringify({ toUserId: whisperTarget, message: whisperText.trim() }) });
      Vibration.vibrate([0, 50, 30, 50]);
      setWhisperTarget(null);
      setWhisperText('');
    } catch (err: any) { Alert.alert('', err.message); }
  };

  const renderTile = ({ item }: { item: NearbyUser }) => {
    const presenceColor = item.presenceState ? PRESENCE_COLORS[item.presenceState] : null;
    const topIntent = item.activeIntents?.[0] ? INTENT_ICONS[item.activeIntents[0]] : null;

    return (
      <TouchableOpacity
        style={[s.tile, { width: tileW, height: tileH }]}
        activeOpacity={0.92}
        onPress={() => router.push(`/user/${item.userId}`)}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={400}
      >
        <ProfilePhoto photosJson={item.photosJson} fill borderRadius={0} size={tileW} />

        {/* Presence ring (left edge glow) */}
        {presenceColor && <View style={[s.presenceBar, { backgroundColor: presenceColor }]} />}

        {/* Top badges */}
        <View style={s.topRow}>
          {item.isHost && (
            <View style={s.hostBadge}><Ionicons name="home" size={8} color="#000" /><Text style={s.hostText}>HOST</Text></View>
          )}
          {item.verificationStatus !== 'unverified' && (
            <View style={[s.shieldBadge, { backgroundColor: (item.verificationStatus === 'reference_verified' ? '#34D399' : item.verificationStatus === 'id_verified' ? '#A855F7' : '#60A5FA') + '30' }]}>
              <Ionicons name={item.verificationStatus === 'reference_verified' ? 'shield-checkmark' : 'shield-half'} size={11} color={item.verificationStatus === 'reference_verified' ? '#34D399' : item.verificationStatus === 'id_verified' ? '#A855F7' : '#60A5FA'} />
            </View>
          )}
        </View>

        {/* Intent badge (top right) */}
        {topIntent && (
          <View style={s.intentBadge}>
            <Ionicons name={topIntent.icon as any} size={9} color="#fff" />
            <Text style={s.intentText}>{topIntent.label}</Text>
          </View>
        )}

        {/* Online dot with presence color */}
        {presenceColor && (
          <View style={[s.presenceDot, { backgroundColor: presenceColor }]} />
        )}

        {/* Bottom info */}
        <View style={s.bottomInfo}>
          <Text style={s.tileName} numberOfLines={1}>{item.displayName}</Text>
          <View style={s.metaRow}>
            <Ionicons name="navigate" size={9} color={presenceColor || 'rgba(255,255,255,0.5)'} />
            <Text style={s.tileDist}>{formatDist(item.distance)}</Text>
            {item.gender && <><View style={s.dot} /><Text style={s.tileGender}>{item.gender}</Text></>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      {/* Quick whisper overlay */}
      {whisperTarget && (
        <View style={s.whisperOverlay}>
          <View style={s.whisperBar}>
            <Ionicons name="ear" size={16} color={colors.primaryLight} />
            <TextInput style={s.whisperInput} value={whisperText} onChangeText={setWhisperText} placeholder="Whisper something..." placeholderTextColor="rgba(255,255,255,0.3)" maxLength={100} autoFocus />
            <TouchableOpacity onPress={sendWhisper} disabled={!whisperText.trim()} style={[s.whisperSend, !whisperText.trim() && { opacity: 0.3 }]}>
              <Ionicons name="send" size={14} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setWhisperTarget(null); setWhisperText(''); }} style={s.whisperClose}>
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={s.filterBar}>
        <View style={s.radiusRow}>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.radiusChip, radiusKm === r && s.radiusChipActive]}
              onPress={() => setRadiusKm(r)}
              activeOpacity={0.8}
            >
              <Text style={[s.radiusChipText, radiusKm === r && s.radiusChipTextActive]}>{r} km</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[s.toggleChip, verifiedOnly && s.toggleChipActive]} onPress={() => setVerifiedOnly((v) => !v)} activeOpacity={0.8}>
          <Ionicons name="shield-checkmark" size={14} color={verifiedOnly ? colors.background : colors.textMuted} />
          <Text style={[s.toggleChipText, verifiedOnly && s.toggleChipTextActive]}>Verified</Text>
        </TouchableOpacity>
        <View style={s.sortRow}>
          <TouchableOpacity style={[s.sortChip, sortMode === 'nearest' && s.sortChipActive]} onPress={() => setSortMode('nearest')} activeOpacity={0.8}>
            <Ionicons name="navigate" size={12} color={sortMode === 'nearest' ? colors.background : colors.textMuted} />
            <Text style={[s.sortChipText, sortMode === 'nearest' && s.sortChipTextActive]}>Nearest</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.sortChip, sortMode === 'active' && s.sortChipActive]} onPress={() => setSortMode('active')} activeOpacity={0.8}>
            <Ionicons name="pulse" size={12} color={sortMode === 'active' ? colors.background : colors.textMuted} />
            <Text style={[s.sortChipText, sortMode === 'active' && s.sortChipTextActive]}>Active now</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sortedUsers}
        keyExtractor={i => i.userId}
        renderItem={renderTile}
        numColumns={cols}
        key={`g${cols}`}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ paddingHorizontal: GAP / 2, paddingTop: GAP / 2 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyGlow}><Ionicons name="compass-outline" size={36} color={colors.primaryLight} /></View>
            <Text style={s.emptyTitle}>No one nearby</Text>
            <Text style={s.emptySub}>Pull down to refresh</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  filterBar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, paddingBottom: spacing.xs, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  radiusRow: { flexDirection: 'row', gap: 6 },
  radiusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  radiusChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.borderGlow },
  radiusChipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  radiusChipTextActive: { color: colors.primaryLight },
  toggleChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  toggleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleChipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  toggleChipTextActive: { color: colors.textOnPrimary },
  sortRow: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sortChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  sortChipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  sortChipTextActive: { color: colors.background },
  tile: { marginBottom: GAP, overflow: 'hidden', position: 'relative', backgroundColor: '#0A0A12' },
  presenceBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, zIndex: 5 },
  topRow: { position: 'absolute', top: 6, left: 8, flexDirection: 'row', gap: 4, zIndex: 5 },
  hostBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FBBF24', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  hostText: { color: '#000', fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  shieldBadge: { borderRadius: 6, padding: 3 },
  intentBadge: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, zIndex: 5 },
  intentText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  presenceDot: { position: 'absolute', bottom: 44, right: 8, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#000', zIndex: 5 },
  bottomInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 8, paddingVertical: 7, backgroundColor: 'rgba(0,0,0,0.75)' },
  tileName: { color: '#fff', fontSize: 13, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  tileDist: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
  dot: { width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  tileGender: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  whisperOverlay: { position: 'absolute', bottom: 60, left: 0, right: 0, zIndex: 100, paddingHorizontal: 12 },
  whisperBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(20,18,34,0.95)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(147,51,234,0.3)' },
  whisperInput: { flex: 1, color: '#fff', fontSize: 14 },
  whisperSend: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  whisperClose: { padding: 4 },
  empty: { alignItems: 'center', paddingTop: 160 },
  emptyGlow: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(147,51,234,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySub: { color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 4 },
});
