import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, useWindowDimensions, Alert, TextInput, Vibration, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { discoverApi, api, adsApi, storiesApi, usersApi } from '../../src/api/client';
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
import { useInAppToast } from '../../src/context/InAppToastContext';
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

const RADIUS_OPTIONS = [5, 25, 50, 100] as const;
const RADIUS_ALL = 100;
type SortMode = 'nearest' | 'active';

const FALLBACK_LAT = 40.7128;
const FALLBACK_LNG = -74.006;

/** Discover tile with signature hover: glow + depth. Swipe right = like, swipe left = pass (native only). */
function DiscoverTile({
  item,
  tileW,
  tileH,
  onPress,
  onLongPress,
  onSwipeRight,
  onSwipeLeft,
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
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
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
  const translateX = useSharedValue(0);
  useEffect(() => {
    hoverProgress.value = withTiming(isHovered ? 1 : 0, {
      duration: HOVER_DURATION_MS,
      easing: HOVER_EASING,
    });
  }, [isHovered, hoverProgress]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: 1 + 0.02 * hoverProgress.value },
    ],
    shadowColor: '#7C2BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4 * hoverProgress.value,
    shadowRadius: 8 + 8 * hoverProgress.value,
    zIndex: hoverProgress.value > 0 ? 1 : 0,
  }));
  const panGesture = useMemo(() => {
    if (Platform.OS === 'web' || (!onSwipeRight && !onSwipeLeft)) return null;
    return Gesture.Pan()
      .activeOffsetX(15)
      .failOffsetY([-20, 20])
      .onUpdate((e) => { translateX.value = Math.max(-80, Math.min(80, e.translationX * 0.5)); })
      .onEnd((e) => {
        'worklet';
        const t = e.translationX;
        const v = e.velocityX;
        if (t > 40 && v > 30 && onSwipeRight) {
          translateX.value = withTiming(400, { duration: 120 }, () => { translateX.value = 0; });
          runOnJS(onSwipeRight)();
        } else if (t < -40 && v < -30 && onSwipeLeft) {
          translateX.value = withTiming(-400, { duration: 120 }, () => { translateX.value = 0; });
          runOnJS(onSwipeLeft)();
        } else {
          translateX.value = withTiming(0);
        }
      });
  }, [onSwipeRight, onSwipeLeft, translateX]);
  const presenceColor = item.presenceState ? PRESENCE_COLORS[item.presenceState] : null;
  const topIntent = item.activeIntents?.[0] ? INTENT_ICONS[item.activeIntents[0]] : null;
  const isWeb = Platform.OS === 'web';
  const tileContent = (
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
      <Animated.View style={[panGesture || isWeb ? animatedStyle : undefined, { flex: 1 }]}>
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
  if (panGesture) {
    return <GestureDetector gesture={panGesture}>{tileContent}</GestureDetector>;
  }
  return tileContent;
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
  const [radiusKm, setRadiusKm] = useState<number>(RADIUS_ALL);
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
  const { show: showToast } = useInAppToast();

  const [atDiscoveryCap, setAtDiscoveryCap] = useState(false);
  const [discoverAd, setDiscoverAd] = useState<any>(null);
  const [nearbyStories, setNearbyStories] = useState<any[]>([]);
  const [crossingPaths, setCrossingPaths] = useState<Array<{ venueId: string; otherUserId: string; count: number; venueName: string | null }>>([]);
  const [activityCounts, setActivityCounts] = useState<{ nearbyCount: number; eventsTonightCount: number } | null>(null);

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
      discoverApi.getActivity(lat, lng, radiusKm).then((r) => setActivityCounts(r.data)).catch(() => setActivityCounts(null));
      return list.length;
    } catch (err: any) {
      setLoadError(mapApiError(err));
      setUsers([]);
      return 0;
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
  const onRefresh = async () => {
    setRefreshing(true);
    setLoadError(null);
    const prevCount = users.length;
    const newCount = await load();
    setRefreshing(false);
    if (newCount > prevCount && prevCount > 0) {
      const diff = newCount - prevCount;
      showToast({ title: 'New people nearby', body: `${diff} ${diff === 1 ? 'person' : 'people'} just appeared.` });
    }
  };

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

  const sendWhisper = async () => {
    if (!whisperTarget || !whisperText.trim()) return;
    try {
      await api('/v1/whispers', { method: 'POST', body: JSON.stringify({ toUserId: whisperTarget, message: whisperText.trim() }) });
      Vibration.vibrate([0, 50, 30, 50]);
      setWhisperTarget(null);
      setWhisperText('');
    } catch (err: any) { Alert.alert('', mapApiError(err)); }
  };

  const isProfileComplete = profile?.displayName && !['New User', 'User'].includes(profile.displayName);

  const requireProfileComplete = useCallback((action: () => void) => {
    if (!isProfileComplete) {
      Alert.alert(
        'Complete your profile',
        'Add your name and photo to connect with others.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Complete profile', onPress: () => router.push('/profile/edit') },
        ]
      );
      return;
    }
    action();
  }, [isProfileComplete]);

  const handleSwipeRight = useCallback((item: NearbyUser) => {
    requireProfileComplete(async () => {
      Vibration.vibrate(15);
      try {
        const res = await usersApi.like(item.userId);
        setUsers((prev) => prev.filter((u) => u.userId !== item.userId));
        if (res.data.matched) {
          Vibration.vibrate([0, 80, 40, 80]);
          Alert.alert("It's a Match! 💜", `You and ${item.displayName} are interested in each other`);
        }
      } catch {}
    });
  }, [requireProfileComplete]);

  const handleSwipeLeft = useCallback((item: NearbyUser) => {
    Vibration.vibrate(10);
    usersApi.pass(item.userId).catch(() => {});
    setUsers((prev) => prev.filter((u) => u.userId !== item.userId));
  }, []);

  const handleLongPress = useCallback((item: NearbyUser) => {
    requireProfileComplete(() => {
      Vibration.vibrate(10);
      setWhisperTarget(item.userId);
    });
  }, [requireProfileComplete]);

  const renderTile = ({ item }: { item: NearbyUser }) => (
    <DiscoverTile
      item={item}
      tileW={tileW}
      tileH={tileH}
      onPress={() => router.push(`/user/${item.userId}`)}
      onLongPress={() => handleLongPress(item)}
      onSwipeRight={() => handleSwipeRight(item)}
      onSwipeLeft={() => handleSwipeLeft(item)}
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

  const swipeRightToMessages = useMemo(() => {
    if (Platform.OS === 'web') return null;
    return Gesture.Pan()
      .activeOffsetX(15)
      .failOffsetY([-25, 25])
      .onEnd((e) => {
        if (e.translationX > 60 && e.velocityX > 80) {
          router.push('/(tabs)/messages');
        }
      });
  }, []);

  return (
    <PageShell>
      {/* Swipe-right edge to open messages (native only) */}
      {swipeRightToMessages && (
        <GestureDetector gesture={swipeRightToMessages}>
          <View style={s.swipeEdge} />
        </GestureDetector>
      )}
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

      {/* Brand header */}
      <View style={s.hero}>
        <View style={s.heroLogo}>
          <Text style={s.heroLogoText}>{'Shhh'}</Text>
        </View>
        <Text style={s.heroTagline}>{'Where consent meets curiosity.'}</Text>
      </View>

      {/* Wave 1: Activity indicators — real counts only, always visible when loaded */}
      {!loading && (
        <View style={s.activityBar}>
          <Ionicons name="people" size={14} color={colors.primaryLight} />
          <Text style={s.activityText}>
            {activityCounts ? `${activityCounts.nearbyCount} ${activityCounts.nearbyCount === 1 ? 'person' : 'people'} nearby` : `${users.length} ${users.length === 1 ? 'person' : 'people'} nearby`}
          </Text>
          <Text style={s.activityDot}>•</Text>
          <Ionicons name="calendar" size={14} color={colors.primaryLight} />
          <Text style={s.activityText}>
            {activityCounts ? `${activityCounts.eventsTonightCount} ${activityCounts.eventsTonightCount === 1 ? 'event' : 'events'} tonight` : '—'}
          </Text>
        </View>
      )}
      {/* Consolidated filter bar */}
      <View style={s.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          <TouchableOpacity style={[s.radiusChip, s.radiusChipActive]} onPress={() => setRadiusKm(radiusKm === 5 ? 25 : radiusKm === 25 ? 50 : radiusKm === 50 ? RADIUS_ALL : 5)} activeOpacity={0.8}>
            <Ionicons name="locate-outline" size={13} color="#B35CFF" />
            <Text style={s.radiusChipTextActive}>{radiusKm === RADIUS_ALL ? 'All' : `${radiusKm} km`}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.radiusChip, sortMode === 'nearest' && s.radiusChipActive]} onPress={() => setSortMode('nearest')} activeOpacity={0.8}>
            <Ionicons name="navigate-outline" size={13} color={sortMode === 'nearest' ? '#B35CFF' : 'rgba(255,255,255,0.35)'} />
            <Text style={sortMode === 'nearest' ? s.radiusChipTextActive : s.radiusChipText}>{'Nearest'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.radiusChip, sortMode === 'active' && s.radiusChipActive]} onPress={() => setSortMode('active')} activeOpacity={0.8}>
            <Ionicons name="pulse-outline" size={13} color={sortMode === 'active' ? '#B35CFF' : 'rgba(255,255,255,0.35)'} />
            <Text style={sortMode === 'active' ? s.radiusChipTextActive : s.radiusChipText}>{'Active now'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.radiusChip, verifiedOnly && s.radiusChipActive]} onPress={() => setVerifiedOnly((v) => !v)} activeOpacity={0.8}>
            <Ionicons name="shield-checkmark-outline" size={13} color={verifiedOnly ? '#B35CFF' : 'rgba(255,255,255,0.35)'} />
            <Text style={verifiedOnly ? s.radiusChipTextActive : s.radiusChipText}>{'Verified'}</Text>
          </TouchableOpacity>
        </ScrollView>
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
            <TouchableOpacity style={s.emptyCta} onPress={() => router.push('/(tabs)/events')} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Create an event">
              <Text style={s.emptyCtaText}>Start something → Create an event</Text>
            </TouchableOpacity>
          </View>
        }
      />
      )}
    </PageShell>
  );
}

const s = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: 20,
    paddingBottom: 8,
  },
  heroLogo: {
    marginBottom: 4,
  },
  heroLogoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#B35CFF',
    letterSpacing: -2,
  },
  heroTagline: {
    fontSize: 13,
    color: 'rgba(179,92,255,0.4)',
    letterSpacing: 0.5,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,43,255,0.06)',
    paddingVertical: 12,
  },
  filterScroll: { paddingHorizontal: spacing.lg, gap: 8 },
  radiusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  radiusChipActive: { backgroundColor: 'rgba(124,43,255,0.15)', borderColor: 'rgba(179,92,255,0.3)' },
  radiusChipText: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600' },
  radiusChipTextActive: { color: '#B35CFF', fontSize: 12, fontWeight: '600' },
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
  activityBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: 'rgba(124,43,255,0.06)', borderBottomWidth: 0.5, borderBottomColor: 'rgba(124,43,255,0.1)' },
  activityText: { color: colors.primaryLight, fontSize: 12, fontWeight: '600' },
  activityDot: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginHorizontal: 2 },
  emptyCta: { marginTop: spacing.lg, paddingVertical: 14, paddingHorizontal: 24, backgroundColor: 'rgba(124,43,255,0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(179,92,255,0.3)' },
  emptyCtaText: { color: colors.primaryLight, fontSize: 14, fontWeight: '700' },
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
  swipeEdge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, zIndex: 10 },
});
