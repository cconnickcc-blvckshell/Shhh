import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, useWindowDimensions, Alert, TextInput, Vibration, ActivityIndicator, Platform, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { discoverApi, api, adsApi, storiesApi } from '../../src/api/client';
import { ProfilePhoto } from '../../src/components/ProfilePhoto';
import { useAuthStore } from '../../src/stores/auth';
import { useLocation } from '../../src/hooks/useLocation';
import { colors, fontSize, spacing, borderRadius, shadows, layout } from '../../src/constants/theme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { useHover } from '../../src/hooks/useHover';
import { useCanSeeUnblurred } from '../../src/hooks/useCanSeeUnblurred';
import { BrandMark } from '../../src/components/BrandMark';
import { PageShell } from '../../src/components/layout';
import { SafeState } from '../../src/components/ui';
import { mapApiError } from '../../src/utils/errorMapper';
import { useScreenView } from '../../src/hooks/useScreenView';
import { useDiscoverFiltersStore } from '../../src/stores/discoverFilters';
import { VenueAdCard } from '../../src/components/VenueAdCard';

const HOVER_DURATION_MS = 160;
const HOVER_EASING = Easing.out(Easing.ease);

/** Max width per discover tile on desktop so photos don't blow up. */
const MAX_TILE_WIDTH_DESKTOP = 300;
/** Grid gap on desktop for breathing room; mobile stays compact. */
const GAP_MOBILE = 6;
const GAP_DESKTOP = 16;

interface NearbyUser {
  userId: string; displayName: string; bio: string; distance: number;
  verificationStatus: string; experienceLevel: string; isHost: boolean;
  gender: string | null; photosJson: string[];
  presenceState: string | null; activeIntents: string[];
}

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

const FALLBACK_LAT = 40.7128;
const FALLBACK_LNG = -74.006;

/** Discover tile with signature hover: glow + depth (SOFT_LAUNCH_WEB_PLAN §4.5). */
function DiscoverTile({
  item,
  tileW,
  tileH,
  onPress,
  onLongPress,
  tileStyle,
  presenceBar,
  topRow,
  hostBadge,
  hostText,
  shieldBadge,
  intentBadge,
  intentText,
  presenceDot,
  bottomInfo,
  tileName,
  metaRow,
  tileDist,
  dot,
  tileGender,
}: {
  item: NearbyUser;
  tileW: number;
  tileH: number;
  onPress: () => void;
  onLongPress: () => void;
  tileStyle: any;
  presenceBar: any;
  topRow: any;
  hostBadge: any;
  hostText: any;
  shieldBadge: any;
  intentBadge: any;
  intentText: any;
  presenceDot: any;
  bottomInfo: any;
  tileName: any;
  metaRow: any;
  tileDist: any;
  dot: any;
  tileGender: any;
}) {
  const { isHovered, hoverProps } = useHover();
  const canSeeUnblurred = useCanSeeUnblurred(item.userId);
  const hoverProgress = useSharedValue(0);
  useEffect(() => {
    hoverProgress.value = withTiming(isHovered ? 1 : 0, {
      duration: HOVER_DURATION_MS,
      easing: HOVER_EASING,
    });
  }, [isHovered, hoverProgress]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.02 * hoverProgress.value }],
    shadowColor: '#7C2BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4 * hoverProgress.value,
    shadowRadius: 8 + 8 * hoverProgress.value,
    zIndex: hoverProgress.value > 0 ? 1 : 0,
  }));
  const presenceColor = item.presenceState ? PRESENCE_COLORS[item.presenceState] : null;
  const topIntent = item.activeIntents?.[0] ? INTENT_ICONS[item.activeIntents[0]] : null;
  const isWeb = Platform.OS === 'web';
  return (
    <TouchableOpacity
      style={[tileStyle, { width: tileW, height: tileH }]}
      activeOpacity={0.92}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      {...hoverProps}
      accessibilityLabel={`${item.displayName}, ${formatDist(item.distance)} away`}
      accessibilityRole="button"
      accessibilityHint="Double tap to view profile. Long press to whisper."
    >
      <Animated.View style={[isWeb ? animatedStyle : undefined, { flex: 1 }]}>
      <ProfilePhoto photosJson={item.photosJson} fill borderRadius={0} size={tileW} canSeeUnblurred={canSeeUnblurred ?? undefined} preferThumbnail />
      {presenceColor && <View style={[presenceBar, { backgroundColor: presenceColor }]} />}
      <View style={topRow}>
        {item.isHost && <View style={hostBadge}><Ionicons name="home" size={8} color="#000" /><Text style={hostText}>HOST</Text></View>}
        {item.verificationStatus !== 'unverified' && (
          <View style={[shieldBadge, { backgroundColor: (item.verificationStatus === 'reference_verified' ? '#34D399' : item.verificationStatus === 'id_verified' ? '#A855F7' : '#60A5FA') + '30' }]}>
            <Ionicons name={item.verificationStatus === 'reference_verified' ? 'shield-checkmark' : 'shield-half'} size={11} color={item.verificationStatus === 'reference_verified' ? '#34D399' : item.verificationStatus === 'id_verified' ? '#A855F7' : '#60A5FA'} />
          </View>
        )}
      </View>
      {topIntent && (
        <View style={intentBadge}>
          <Ionicons name={topIntent.icon as any} size={9} color="#fff" />
          <Text style={intentText}>{topIntent.label}</Text>
        </View>
      )}
      {presenceColor && <View style={[presenceDot, { backgroundColor: presenceColor }]} />}
      <View style={bottomInfo}>
        <Text style={tileName} numberOfLines={1}>{item.displayName}</Text>
        <View style={metaRow}>
          <Ionicons name="navigate" size={9} color={presenceColor || 'rgba(255,255,255,0.5)'} />
          <Text style={tileDist}>{formatDist(item.distance)}</Text>
          {item.gender && <><View style={dot} /><Text style={tileGender}>{item.gender}</Text></>}
        </View>
      </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function DiscoverScreen() {
  useScreenView('discover');
  const profile = useAuthStore((s) => s.profile);
  const location = useLocation();
  const lat = location.loading ? FALLBACK_LAT : location.latitude;
  const lng = location.loading ? FALLBACK_LNG : location.longitude;
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [whisperTarget, setWhisperTarget] = useState<string | null>(null);
  const [whisperText, setWhisperText] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('nearest');
  const { width } = useWindowDimensions();
  const { isDesktop, showSidebar } = useBreakpoint();
  const gap = isDesktop ? GAP_DESKTOP : GAP_MOBILE;
  const cols = isDesktop ? 3 : width > 500 ? 3 : 2;
  const contentWidth = isDesktop ? Math.min(width, layout.contentMaxWidth) : width;
  const rawTileW = (contentWidth - gap * (cols + 1)) / cols;
  const tileW = isDesktop ? Math.min(rawTileW, MAX_TILE_WIDTH_DESKTOP) : rawTileW;
  const tileH = tileW * 1.45;

  const primaryIntent = profile?.primaryIntent ?? undefined;

  const setFilterContext = useDiscoverFiltersStore((s) => s.setFilterContext);

  const [atDiscoveryCap, setAtDiscoveryCap] = useState(false);
  const [discoverAd, setDiscoverAd] = useState<any>(null);
  const [nearbyStories, setNearbyStories] = useState<any[]>([]);
  const [crossingPaths, setCrossingPaths] = useState<Array<{ venueId: string; otherUserId: string; count: number; venueName: string | null }>>([]);

  const load = useCallback(async () => {
    setLoadError(null);
    setAtDiscoveryCap(false);
    try {
      await discoverApi.updateLocation(lat, lng);
      const res = await discoverApi.nearby(lat, lng, radiusKm, primaryIntent);
      let list = (res.data as NearbyUser[]).sort((a, b) => a.distance - b.distance);
      if (verifiedOnly) list = list.filter((u) => u.verificationStatus && u.verificationStatus !== 'unverified');
      setUsers(list);
      setFilterContext({ radius: radiusKm, primaryIntent: primaryIntent ?? '', verifiedOnly, sortMode });
      const cap = res.discoveryCap ?? 30;
      if (res.count >= cap) setAtDiscoveryCap(true);
      adsApi.getFeed(lat, lng).then((r) => setDiscoverAd(r.data)).catch(() => setDiscoverAd(null));
      storiesApi.nearby(lat, lng, radiusKm).then((r) => setNearbyStories(r.data || [])).catch(() => setNearbyStories([]));
      discoverApi.crossingPaths(2).then((r) => setCrossingPaths(r.data || [])).catch(() => setCrossingPaths([]));
    } catch (err: any) {
      setLoadError(mapApiError(err));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusKm, primaryIntent, verifiedOnly, setFilterContext]);

  useEffect(() => {
    if (!location.loading) {
      setLoading(true);
      load();
    }
  }, [load, location.loading]);

  useEffect(() => {
    if (discoverAd?.id) adsApi.recordImpression(discoverAd.id, 'discover_feed').catch(() => {});
  }, [discoverAd?.id]);
  const onRefresh = async () => { setRefreshing(true); setLoadError(null); await load(); adsApi.getFeed(lat, lng).then((r) => setDiscoverAd(r.data)).catch(() => {}); storiesApi.nearby(lat, lng, radiusKm).then((r) => setNearbyStories(r.data || [])).catch(() => {}); discoverApi.crossingPaths(2).then((r) => setCrossingPaths(r.data || [])).catch(() => {}); setRefreshing(false); };

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
    } catch (err: any) { Alert.alert('', mapApiError(err)); }
  };

  const renderTile = ({ item }: { item: NearbyUser }) => (
    <DiscoverTile
      item={item}
      tileW={tileW}
      tileH={tileH}
      onPress={() => router.push(`/user/${item.userId}`)}
      onLongPress={() => handleLongPress(item)}
      tileStyle={[s.tile, { marginBottom: gap }, isDesktop && { borderRadius: borderRadius.xl }]}
      presenceBar={s.presenceBar}
      topRow={s.topRow}
      hostBadge={s.hostBadge}
      hostText={s.hostText}
      shieldBadge={s.shieldBadge}
      intentBadge={s.intentBadge}
      intentText={s.intentText}
      presenceDot={s.presenceDot}
      bottomInfo={s.bottomInfo}
      tileName={s.tileName}
      metaRow={s.metaRow}
      tileDist={s.tileDist}
      dot={s.dot}
      tileGender={s.tileGender}
    />
  );

  return (
    <PageShell>
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

      {/* Desktop hero: brand + tagline (coming-soon style) */}
      {showSidebar && (
        <View style={s.hero}>
          <BrandMark />
          <Text style={s.heroTagline}>Where consent meets curiosity.</Text>
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

      <View style={s.storiesRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.storiesScroll}>
          <TouchableOpacity style={s.storyAddCircle} onPress={() => router.push('/stories/create')}>
            <Ionicons name="add" size={28} color={colors.primaryLight} />
            <Text style={s.storyAddLabel}>Add</Text>
          </TouchableOpacity>
          {nearbyStories.slice(0, 11).map((st: any) => (
            <TouchableOpacity key={st.id} style={s.storyCircle} onPress={() => router.push(`/stories/view/${st.id}`)}>
              <ProfilePhoto photosJson={st.media_storage_path ? [st.media_storage_path] : []} size={56} borderRadius={28} canSeeUnblurred={true} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {discoverAd && (
        <View style={s.adWrap}>
          <VenueAdCard
            ad={{ id: discoverAd.id, venue_id: discoverAd.venue_id || '', headline: discoverAd.headline || 'Promoted', body: discoverAd.body, venue_name: discoverAd.venue_name }}
            onDismiss={() => { adsApi.dismiss(discoverAd.id).catch(() => {}); setDiscoverAd(null); }}
          />
        </View>
      )}
      {crossingPaths.length > 0 && (
        <View style={s.crossingPathsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.crossingPathsScroll}>
            {crossingPaths.slice(0, 5).map((cp) => (
              <TouchableOpacity
                key={`${cp.otherUserId}-${cp.venueId}`}
                style={s.crossingPathCard}
                onPress={() => router.push(`/user/${cp.otherUserId}`)}
                accessibilityLabel={`You've both been at ${cp.venueName || 'a venue'}. Say hi to this person.`}
                accessibilityRole="button"
              >
                <Ionicons name="location" size={14} color={colors.primaryLight} />
                <Text style={s.crossingPathText} numberOfLines={2}>
                  You've both been at {cp.venueName || 'a venue'} — say hi?
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {atDiscoveryCap && users.length > 0 && (
        <View style={s.capBanner}>
          <Ionicons name="information-circle" size={18} color={colors.host} />
          <Text style={s.capBannerText}>You've reached your discovery limit for this view. Change filters or refresh to see more.</Text>
        </View>
      )}
      {loading && users.length === 0 ? (
        <SafeState variant="loading" message="Finding people nearby..." />
      ) : loadError && users.length === 0 ? (
        <SafeState variant="error" message={loadError} onRetry={() => { setLoading(true); load(); }} />
      ) : (
      <FlatList
        data={sortedUsers}
        keyExtractor={i => i.userId}
        renderItem={renderTile}
        numColumns={cols}
        key={`g${cols}`}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ paddingHorizontal: gap, paddingTop: gap, paddingBottom: gap }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <SafeState variant="empty" title="No one nearby" message="Pull down to refresh" icon="compass-outline" />
          </View>
        }
      />
      )}
    </PageShell>
  );
}

const s = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    marginBottom: 0,
  },
  heroTagline: {
    fontSize: 13,
    color: 'rgba(179,92,255,0.6)',
    letterSpacing: 1.5,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  filterBar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(124,43,255,0.06)' },
  radiusRow: { flexDirection: 'row', gap: 6 },
  radiusChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  radiusChipActive: { backgroundColor: 'rgba(124,43,255,0.15)', borderColor: 'rgba(179,92,255,0.3)' },
  radiusChipText: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600' },
  radiusChipTextActive: { color: '#B35CFF' },
  toggleChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  toggleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleChipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  toggleChipTextActive: { color: colors.textOnPrimary },
  sortRow: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sortChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  sortChipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  sortChipTextActive: { color: colors.background },
  tile: { marginBottom: 0, overflow: 'hidden', position: 'relative', backgroundColor: '#0D0A14', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(124,43,255,0.08)' },
  presenceBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, zIndex: 5 },
  topRow: { position: 'absolute', top: 6, left: 8, flexDirection: 'row', gap: 4, zIndex: 5 },
  hostBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FBBF24', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  hostText: { color: '#000', fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },
  shieldBadge: { borderRadius: 6, padding: 3 },
  intentBadge: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, zIndex: 5 },
  intentText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  presenceDot: { position: 'absolute', bottom: 44, right: 8, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#000', zIndex: 5 },
  bottomInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 14, paddingVertical: 12, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.85))' } as any,
  tileName: { color: '#F7F2FF', fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  tileDist: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
  dot: { width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  tileGender: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  whisperOverlay: { position: 'absolute', bottom: 60, left: 0, right: 0, zIndex: 100, paddingHorizontal: 12 },
  whisperBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(20,18,34,0.95)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(147,51,234,0.3)' },
  whisperInput: { flex: 1, color: '#fff', fontSize: 14 },
  whisperSend: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  whisperClose: { padding: 4 },
  emptyWrap: { flex: 1, paddingVertical: 80 },
  capBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: 'rgba(251,191,36,0.12)', borderBottomWidth: 0.5, borderBottomColor: 'rgba(251,191,36,0.2)' },
  capBannerText: { flex: 1, color: colors.text, fontSize: fontSize.sm },
  adWrap: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  storiesRow: { paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  storiesScroll: { paddingHorizontal: spacing.md, gap: 12, flexDirection: 'row', alignItems: 'center' },
  storyAddCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: colors.primaryLight, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  storyAddLabel: { color: colors.primaryLight, fontSize: 10, fontWeight: '600', marginTop: 2 },
  storyCircle: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', borderWidth: 2, borderColor: colors.primaryLight },
  crossingPathsWrap: { paddingVertical: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' },
  crossingPathsScroll: { paddingHorizontal: spacing.md, gap: 10, flexDirection: 'row', alignItems: 'center' },
  crossingPathCard: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(147,51,234,0.12)', borderWidth: 1, borderColor: 'rgba(147,51,234,0.25)', maxWidth: 220 },
  crossingPathText: { color: colors.text, fontSize: fontSize.sm, flex: 1 },
});
