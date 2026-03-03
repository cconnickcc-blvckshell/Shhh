import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, useWindowDimensions, Vibration, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, usersApi, messagingApi, ApiError } from '../../src/api/client';
import { ProfilePhoto } from '../../src/components/ProfilePhoto';
import { ConnectionWindowModal } from '../../src/components/ConnectionWindowModal';
import { useDiscoverFiltersStore } from '../../src/stores/discoverFilters';
import { colors, spacing, fontSize, borderRadius, layout } from '../../src/constants/theme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { useCanSeeUnblurred } from '../../src/hooks/useCanSeeUnblurred';
import { mapApiError } from '../../src/utils/errorMapper';

const PRESENCE_LABELS: Record<string, { label: string; color: string }> = {
  open_to_chat: { label: 'Open to chat', color: '#34D399' },
  browsing: { label: 'Browsing', color: '#A855F7' },
  nearby: { label: 'Nearby', color: '#60A5FA' },
  at_venue: { label: 'At a venue', color: '#FBBF24' },
};

const INTENT_ICONS: Record<string, string> = {
  open_tonight: 'moon', traveling: 'airplane', hosting: 'home',
  looking_for_friends: 'people', looking_for_more: 'heart', couples_only: 'people-circle',
};

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const canSeeUnblurred = useCanSeeUnblurred(id ?? null);
  const [profile, setProfile] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [whisperText, setWhisperText] = useState('');
  const [showWhisper, setShowWhisper] = useState(false);
  const [liked, setLiked] = useState(false);
  const [connectionWindowModal, setConnectionWindowModal] = useState<{ cap: number; used: number; tierOptions: string[] } | null>(null);
  const filterContext = useDiscoverFiltersStore((s) => s.filterContext);
  const { width } = useWindowDimensions();
  const { isDesktop } = useBreakpoint();
  const heroSize = Platform.OS === 'web' && isDesktop ? Math.min(width, 480) : width;

  const load = useCallback(() => {
    if (!id) return;
    setLoadError(null);
    setLoading(true);
    api<{ data: any }>(`/v1/users/${id}/profile`)
      .then(r => { setProfile(r.data); setLoadError(null); })
      .catch((err: any) => setLoadError(mapApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading && !profile) {
    return <View style={s.container}><View style={s.loadingWrap}><Ionicons name="hourglass-outline" size={24} color="rgba(255,255,255,0.2)" /></View></View>;
  }
  if (loadError && !profile) {
    return (
      <View style={s.container}>
        <View style={s.errorWrap}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={s.errorMsg}>{loadError}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}><Text style={s.retryBtnText}>Try again</Text></TouchableOpacity>
          <TouchableOpacity style={s.backLink} onPress={() => router.back()}><Text style={s.backLinkText}>Go back</Text></TouchableOpacity>
        </View>
      </View>
    );
  }
  if (!profile) return null;

  const handleLike = async () => {
    if (!id) return;
    Vibration.vibrate(15);
    const res = await usersApi.like(id);
    setLiked(true);
    if (res.data.matched) {
      Vibration.vibrate([0, 80, 40, 80]);
      Alert.alert('It\'s a Match! 💜', `You and ${profile.displayName} are interested in each other`);
    }
  };

  const handleMessage = async () => {
    if (!id) return;
    try {
      const conv = await messagingApi.createConversation([id], filterContext);
      router.push(`/chat/${conv.data.id}`);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'INITIATION_CAP_REACHED' && apiErr.cap != null && apiErr.used != null) {
        setConnectionWindowModal({
          cap: apiErr.cap,
          used: apiErr.used,
          tierOptions: apiErr.tierOptions ?? ['discreet', 'phantom', 'elite'],
        });
      } else {
        Alert.alert('', mapApiError(err));
      }
    }
  };

  const sendWhisper = async () => {
    if (!id || !whisperText.trim()) return;
    try {
      await api('/v1/whispers', { method: 'POST', body: JSON.stringify({ toUserId: id, message: whisperText.trim() }) });
      Vibration.vibrate([0, 50, 30, 50]);
      setWhisperText('');
      setShowWhisper(false);
      Alert.alert('Whispered', 'Your anonymous message was sent');
    } catch (err: any) { Alert.alert('', mapApiError(err)); }
  };

  const presence = profile.presenceState ? PRESENCE_LABELS[profile.presenceState] : null;
  const shieldColor = profile.verificationStatus === 'reference_verified' ? '#34D399' : profile.verificationStatus === 'id_verified' ? '#A855F7' : profile.verificationStatus === 'photo_verified' ? '#60A5FA' : null;

  return (
  <>
    <ScrollView style={s.container} bounces={false}>
      {/* Hero photo — capped on desktop so it doesn't blow up */}
      <View style={[s.heroWrap, isDesktop && s.heroWrapDesktop]}>
        <View style={[s.hero, { height: heroSize * 0.9, width: heroSize }]}>
          <ProfilePhoto photosJson={profile.photosJson} fill borderRadius={0} size={heroSize} canSeeUnblurred={canSeeUnblurred ?? undefined} />
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Presence badge */}
        {presence && (
          <View style={[s.presenceBadge, { backgroundColor: presence.color + '20', borderColor: presence.color + '40' }]}>
            <View style={[s.presenceDotSmall, { backgroundColor: presence.color }]} />
            <Text style={[s.presenceLabel, { color: presence.color }]}>{presence.label}</Text>
          </View>
        )}

        {/* Bottom gradient info */}
        <View style={s.heroBottom}>
          <View style={s.nameRow}>
            <Text style={s.name}>{profile.displayName}</Text>
            {profile.age && <Text style={s.age}>{profile.age}</Text>}
            {shieldColor && <Ionicons name={profile.verificationStatus === 'reference_verified' ? 'shield-checkmark' : 'shield-half'} size={18} color={shieldColor} />}
          </View>
          <View style={s.metaRow}>
            {profile.gender && <Text style={s.metaText}>{profile.gender}</Text>}
            {profile.showAsRole && profile.showAsRole !== 'n_a' && <><Text style={s.metaDot}>·</Text><Text style={s.metaText}>{profile.showAsRole}</Text></>}
            {profile.showAsRelationship && <><Text style={s.metaDot}>·</Text><Text style={s.metaText}>{profile.showAsRelationship}</Text></>}
          </View>
        </View>
        </View>
      </View>

      <View style={s.body}>
        {/* Intent flags */}
        {profile.activeIntents?.length > 0 && (
          <View style={s.intentRow}>
            {([...new Set(profile.activeIntents)] as string[]).map((f: string) => (
              <View key={f} style={s.intentChip}>
                <Ionicons name={(INTENT_ICONS[f] || 'flag') as any} size={11} color={colors.primaryLight} />
                <Text style={s.intentText}>{f.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bio */}
        {profile.bio && <Text style={s.bio}>{profile.bio}</Text>}

        {/* Kinks/Interests */}
        {profile.kinks?.length > 0 && (
          <View style={s.section} accessibilityRole="none">
            <Text style={s.sectionLabel} accessibilityRole="header">INTERESTS</Text>
            <View style={s.tagRow}>
              {profile.kinks.map((k: string) => (
                <View key={k} style={s.tag}><Text style={s.tagText}>{k}</Text></View>
              ))}
            </View>
          </View>
        )}

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{profile.experienceLevel}</Text>
            <Text style={s.statLabel}>Experience</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>{profile.references?.total || 0}</Text>
            <Text style={s.statLabel}>References</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>{profile.references?.avgRating > 0 ? profile.references.avgRating.toFixed(1) : '—'}</Text>
            <Text style={s.statLabel}>Rating</Text>
          </View>
          {profile.isHost && <><View style={s.statDivider} /><View style={s.statItem}><Ionicons name="home" size={16} color="#FBBF24" /><Text style={s.statLabel}>Host</Text></View></>}
        </View>

        {/* Trust badge */}
        {profile.trustScore && (
          <View style={s.trustRow}>
            <Ionicons name="shield-checkmark" size={14} color={shieldColor || '#888'} />
            <Text style={s.trustText}>{profile.trustScore.badge} · Score {Math.round(profile.trustScore.score)}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity style={s.actionCircle} onPress={() => { if (id) { usersApi.block(id); router.back(); } }}>
            <Ionicons name="close" size={26} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCircleSmall} onPress={() => setShowWhisper(!showWhisper)}>
            <Ionicons name="ear" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionCirclePrimary, liked && { backgroundColor: '#34D399' }]} onPress={handleLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCircleSmall} onPress={handleMessage}>
            <Ionicons name="chatbubble" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Whisper input */}
        {showWhisper && (
          <View style={s.whisperBox}>
            <Text style={s.whisperHint}>Send an anonymous whisper — they won't see your name</Text>
            <View style={s.whisperInputRow}>
              <TextInput style={s.whisperInput} value={whisperText} onChangeText={setWhisperText} placeholder="Love your vibe..." placeholderTextColor="rgba(255,255,255,0.2)" maxLength={100} />
              <TouchableOpacity onPress={sendWhisper} disabled={!whisperText.trim()} style={[s.whisperSend, !whisperText.trim() && { opacity: 0.3 }]}>
                <Ionicons name="send" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Report */}
        <TouchableOpacity style={s.reportBtn} onPress={() => { if (id) { usersApi.report(id, 'inappropriate'); Alert.alert('Reported', 'Thank you for keeping the community safe'); } }}>
          <Text style={s.reportText}>Report this user</Text>
        </TouchableOpacity>

        {/* Joined */}
        <Text style={s.joinedText}>Member since {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>

    <ConnectionWindowModal
      visible={!!connectionWindowModal}
      onClose={() => setConnectionWindowModal(null)}
      cap={connectionWindowModal?.cap ?? 30}
      used={connectionWindowModal?.used ?? 30}
      tierOptions={connectionWindowModal?.tierOptions}
    />
  </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 200 },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 120 },
  errorMsg: { color: colors.text, fontSize: 14, textAlign: 'center', marginTop: spacing.md },
  retryBtn: { marginTop: spacing.lg, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: borderRadius.lg },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  backLink: { marginTop: spacing.md, paddingVertical: 8 }, backLinkText: { color: colors.textMuted, fontSize: 14 },
  heroWrap: {},
  heroWrapDesktop: { alignItems: 'center', maxWidth: layout.contentMaxWidth, alignSelf: 'center', width: '100%' },
  hero: { position: 'relative', backgroundColor: '#0A0A12', overflow: 'hidden' },
  backBtn: { position: 'absolute', top: 50, left: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  presenceBadge: { position: 'absolute', top: 50, right: 16, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, zIndex: 10 },
  presenceDotSmall: { width: 6, height: 6, borderRadius: 3 },
  presenceLabel: { fontSize: 11, fontWeight: '700' },
  heroBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingTop: 60, backgroundColor: 'rgba(0,0,0,0.6)' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  age: { color: 'rgba(255,255,255,0.8)', fontSize: 22, fontWeight: '300' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 0, marginTop: 4 },
  metaText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  metaDot: { color: 'rgba(255,255,255,0.3)', fontSize: 13, marginHorizontal: 6 },
  body: { padding: 16 },
  intentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  intentChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(147,51,234,0.1)', borderWidth: 1, borderColor: 'rgba(147,51,234,0.25)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  intentText: { color: colors.primaryLight, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  bio: { color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 23, marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  tagText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 16, marginBottom: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 15, fontWeight: '700', textTransform: 'capitalize' },
  statLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.08)' },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  trustText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 16 },
  actionCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  actionCircleSmall: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(147,51,234,0.2)', borderWidth: 1, borderColor: 'rgba(147,51,234,0.3)', alignItems: 'center', justifyContent: 'center' },
  actionCirclePrimary: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  whisperBox: { backgroundColor: 'rgba(147,51,234,0.06)', borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)', borderRadius: 14, padding: 14, marginBottom: 16 },
  whisperHint: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 8 },
  whisperInputRow: { flexDirection: 'row', gap: 8 },
  whisperInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, fontSize: 14 },
  whisperSend: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  reportBtn: { alignItems: 'center', paddingVertical: 12 },
  reportText: { color: 'rgba(255,255,255,0.2)', fontSize: 12 },
  joinedText: { color: 'rgba(255,255,255,0.15)', fontSize: 11, textAlign: 'center', marginTop: 4 },
});
