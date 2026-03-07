import { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch, ActivityIndicator, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '../../src/api/client';
import { useAuthStore } from '../../src/stores/auth';
import { usePhotoUpload } from '../../src/hooks/usePhotoUpload';
import { useInAppToast } from '../../src/context/InAppToastContext';
import { ProfilePhoto } from '../../src/components/ProfilePhoto';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell, Card } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';
import { colors, spacing, layout } from '../../src/constants/theme';

const BIO_MAX_LENGTH = 500;

const GENDERS = ['man', 'woman', 'couple', 'trans_man', 'trans_woman', 'non_binary', 'other'];
const EXP = ['new', 'curious', 'experienced', 'veteran'];

const PRIMARY_INTENTS = [
  { value: 'social', label: 'Social', icon: 'people-outline' as const },
  { value: 'curious', label: 'Curious', icon: 'compass-outline' as const },
  { value: 'lifestyle', label: 'Lifestyle', icon: 'sparkles-outline' as const },
  { value: 'couple', label: 'Couple', icon: 'heart-outline' as const },
] as const;

const DISCOVERY_VISIBLE = [
  { value: 'all', label: 'Everyone' },
  { value: 'social_and_curious', label: 'Social & Curious' },
  { value: 'same_intent', label: 'Same intent only' },
] as const;

const PROFILE_VISIBILITY = [
  { value: 'all', label: 'Everyone' },
  { value: 'after_reveal', label: 'After reveal' },
  { value: 'after_match', label: 'After match' },
] as const;

/** Match discover tile aspect: tileH = tileW * 1.45 */
const PHOTO_ASPECT = 1 / 1.45;
const GAP = 6;
/** Cap grid width so photos stay proportionate on desktop */
const MAX_GRID_WIDTH = 360;

export default function EditProfileScreen() {
  const { profile, loadProfile } = useAuthStore();
  const { width } = useWindowDimensions();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [sexuality, setSexuality] = useState('');
  const [exp, setExp] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [kinks, setKinks] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [primaryIntent, setPrimaryIntent] = useState<string | null>(null);
  const [discoveryVisibleTo, setDiscoveryVisibleTo] = useState<string>('all');
  const [profileVisibilityTier, setProfileVisibilityTier] = useState<string>('all');
  const [crossingPathsVisible, setCrossingPathsVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const { pickAndUpload, uploading, progress } = usePhotoUpload();
  const { show: showToast } = useInAppToast();

  const isDirty = useMemo(() => {
    if (!profile) return false;
    return (
      displayName !== (profile.displayName || '') ||
      bio !== (profile.bio || '') ||
      gender !== (profile.gender || '') ||
      sexuality !== (profile.sexuality || '') ||
      exp !== (profile.experienceLevel || '') ||
      isHost !== (profile.isHost || false) ||
      kinks !== ((profile.kinks || []).join(', ')) ||
      JSON.stringify(photos) !== JSON.stringify(profile.photosJson || []) ||
      primaryIntent !== (profile.primaryIntent ?? null) ||
      discoveryVisibleTo !== (profile.discoveryVisibleTo ?? 'all') ||
      profileVisibilityTier !== (profile.profileVisibilityTier ?? 'all') ||
      crossingPathsVisible !== (profile.crossingPathsVisible ?? false)
    );
  }, [profile, displayName, bio, gender, sexuality, exp, isHost, kinks, photos, primaryIntent, discoveryVisibleTo, profileVisibilityTier, crossingPathsVisible]);

  const handleBack = () => {
    if (isDirty) {
      Alert.alert('Unsaved changes', 'You have unsaved changes. Discard?', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setGender(profile.gender || '');
      setSexuality(profile.sexuality || '');
      setExp(profile.experienceLevel || '');
      setIsHost(profile.isHost || false);
      setKinks((profile.kinks || []).join(', '));
      setPhotos(profile.photosJson || []);
      setPrimaryIntent(profile.primaryIntent ?? null);
      setDiscoveryVisibleTo(profile.discoveryVisibleTo ?? 'all');
      setProfileVisibilityTier(profile.profileVisibilityTier ?? 'all');
      setCrossingPathsVisible(profile.crossingPathsVisible ?? false);
    }
  }, [profile]);

  const addPhoto = async () => {
    const result = await pickAndUpload('photos');
    if (result) {
      const path = result.storagePath ?? result.url;
      setPhotos(p => [...p, path]);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await usersApi.updateMe({
        displayName,
        bio,
        gender,
        sexuality,
        experienceLevel: exp,
        isHost,
        kinks: kinks.split(',').map(k => k.trim()).filter(Boolean),
        photosJson: photos,
        primaryIntent: primaryIntent as 'social' | 'curious' | 'lifestyle' | 'couple' | null,
        discoveryVisibleTo: discoveryVisibleTo as 'all' | 'social_and_curious' | 'same_intent',
        profileVisibilityTier: profileVisibilityTier as 'all' | 'after_reveal' | 'after_match',
        crossingPathsVisible,
      });
      await loadProfile();
      showToast({ title: 'Saved', body: 'Your profile has been updated.' });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const contentWidth = Math.min(width, layout.contentMaxWidth);
  const rawGridWidth = contentWidth - 2 * spacing.lg;
  const gridWidth = Math.min(rawGridWidth, MAX_GRID_WIDTH);
  const cellW = (gridWidth - 2 * GAP) / 3;
  const cellH = cellW / PHOTO_ASPECT;
  const smallSlotW = cellW;
  const smallSlotH = cellH;
  const mainSlotW = cellW * 2 + GAP;
  const mainSlotH = cellH * 2 + GAP;

  return (
    <PremiumDarkBackground style={s.wrapper}>
      <PageShell style={s.pageShell}>
        <SubPageHeader
          title="Edit Profile"
          backIcon="close"
          onBackPress={handleBack}
          rightAction={
            <TouchableOpacity onPress={save} disabled={saving || !isDirty} style={s.saveBtn} accessibilityRole="button" accessibilityLabel={saving ? 'Saving' : 'Save profile'} accessibilityState={{ disabled: saving || !isDirty }}>
              <Text style={[s.saveText, (saving || !isDirty) && { opacity: 0.4 }]}>{saving ? '...' : 'Save'}</Text>
            </TouchableOpacity>
          }
        />
        <ScrollView style={s.container} contentContainerStyle={s.scrollContent} bounces={false}>
          {/* Photo grid — proportionate 3-col layout: main 2x2, small 1x1 */}
          <View style={s.photoSection}>
            <Text style={s.sectionLabel}>PHOTOS</Text>
            <View style={[s.photoGrid, { width: gridWidth }]}>
              {[0, 1, 2, 3, 4, 5].map(i => {
                const hasPhoto = photos[i];
                const isMain = i === 0;
                const slotW = isMain ? mainSlotW : smallSlotW;
                const slotH = isMain ? mainSlotH : smallSlotH;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[s.photoSlot, isMain ? s.photoMain : null, { width: slotW, height: slotH }]}
                    onPress={hasPhoto ? () => setPhotos(p => p.filter((_, j) => j !== i)) : addPhoto}
                    disabled={!hasPhoto && uploading}
                    activeOpacity={0.8}
                  >
                    {hasPhoto ? (
                      <View style={StyleSheet.absoluteFill}>
                        <ProfilePhoto
                          storagePath={photos[i]}
                          fill
                          size={slotW}
                          canSeeUnblurred={true}
                          preferThumbnail={!isMain}
                        />
                        <View style={s.photoRemoveBtn}>
                          <Ionicons name="close" size={14} color="#fff" />
                        </View>
                      </View>
                    ) : (
                      <View style={s.photoEmpty}>
                        {uploading ? (
                          <View style={s.uploadProgressWrap}>
                            <View style={[s.uploadProgressBar, { width: `${progress}%` }]} />
                            <Text style={s.uploadProgressText}>{progress}%</Text>
                          </View>
                        ) : (
                          <>
                            <View style={s.addIconRing}>
                              <Ionicons name="add" size={22} color={colors.primaryLight} />
                            </View>
                            {isMain && <Text style={s.photoLabel}>Main photo</Text>}
                          </>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* About — card section */}
          <Card style={s.cardSection}>
            <Text style={s.sectionLabel}>ABOUT</Text>
            <Text style={s.label}>Display name</Text>
            <TextInput style={s.input} value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor="rgba(255,255,255,0.2)" />

            <Text style={s.label}>Bio</Text>
            <TextInput style={[s.input, s.textArea]} value={bio} onChangeText={setBio} placeholder="About you..." placeholderTextColor="rgba(255,255,255,0.2)" multiline maxLength={BIO_MAX_LENGTH} />
            <Text style={s.charCount}>{bio.length}/{BIO_MAX_LENGTH}</Text>

            <Text style={s.label}>Gender</Text>
            <View style={s.chips}>
              {GENDERS.map(g => (
                <TouchableOpacity key={g} style={[s.chip, gender === g && s.chipActive]} onPress={() => setGender(g)}>
                  <Text style={[s.chipText, gender === g && s.chipTextActive]}>{g.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Sexuality</Text>
            <TextInput style={s.input} value={sexuality} onChangeText={setSexuality} placeholder="e.g. bisexual" placeholderTextColor="rgba(255,255,255,0.2)" />

            <Text style={s.label}>Experience</Text>
            <View style={s.chips}>
              {EXP.map(e => (
                <TouchableOpacity key={e} style={[s.chip, exp === e && s.chipActive]} onPress={() => setExp(e)}>
                  <Text style={[s.chipText, exp === e && s.chipTextActive]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Interests</Text>
            <TextInput style={s.input} value={kinks} onChangeText={setKinks} placeholder="social, dancing, parties" placeholderTextColor="rgba(255,255,255,0.2)" />
          </Card>

          {/* Discovery & privacy — card section */}
          <Card style={s.cardSection}>
            <Text style={s.sectionLabel}>DISCOVERY & PRIVACY</Text>

            <Text style={s.label}>Primary vibe</Text>
            <Text style={s.hint}>How you show up in Discover</Text>
            <View style={s.chips}>
              {PRIMARY_INTENTS.map(({ value, label, icon }) => (
                <TouchableOpacity key={value} style={[s.chip, primaryIntent === value && s.chipActive]} onPress={() => setPrimaryIntent(value)}>
                  <Ionicons name={icon} size={14} color={primaryIntent === value ? colors.primaryLight : 'rgba(255,255,255,0.35)'} />
                  <Text style={[s.chipText, primaryIntent === value && s.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Who can see you in Discover?</Text>
            <View style={s.chips}>
              {DISCOVERY_VISIBLE.map(({ value, label }) => (
                <TouchableOpacity key={value} style={[s.chip, discoveryVisibleTo === value && s.chipActive]} onPress={() => setDiscoveryVisibleTo(value)}>
                  <Text style={[s.chipText, discoveryVisibleTo === value && s.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Full profile visible to</Text>
            <Text style={s.hint}>When others see your full bio, kinks, photos</Text>
            <View style={s.chips}>
              {PROFILE_VISIBILITY.map(({ value, label }) => (
                <TouchableOpacity key={value} style={[s.chip, profileVisibilityTier === value && s.chipActive]} onPress={() => setProfileVisibilityTier(value)}>
                  <Text style={[s.chipText, profileVisibilityTier === value && s.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.switchRow}>
              <View>
                <Text style={s.switchLabel}>Crossing Paths</Text>
                <Text style={s.switchHint}>Show me when we've both been at the same venue</Text>
              </View>
              <Switch value={crossingPathsVisible} onValueChange={setCrossingPathsVisible} trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.primaryDark }} thumbColor={crossingPathsVisible ? colors.primaryLight : 'rgba(255,255,255,0.5)'} />
            </View>
          </Card>

          {/* Hosting */}
          <Card style={s.cardSection}>
            <View style={s.switchRow}>
              <View>
                <Text style={s.switchLabel}>Available to Host</Text>
                <Text style={s.switchHint}>Show host badge</Text>
              </View>
              <Switch value={isHost} onValueChange={setIsHost} trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.primaryDark }} thumbColor={isHost ? colors.primaryLight : 'rgba(255,255,255,0.5)'} />
            </View>
          </Card>

          <View style={{ height: 40 }} />
        </ScrollView>
      </PageShell>
    </PremiumDarkBackground>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1 },
  pageShell: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: 24, maxWidth: layout.contentMaxWidth, alignSelf: 'center', width: '100%' },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  sectionLabel: { color: 'rgba(179,92,255,0.6)', fontSize: 11, fontWeight: '800', letterSpacing: 2.5, marginBottom: 14 },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  hint: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: -4, marginBottom: 8 },

  photoSection: { paddingHorizontal: spacing.lg, paddingVertical: 20, alignItems: 'center' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  photoSlot: {
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(179,92,255,0.15)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  photoMain: { borderColor: 'rgba(179,92,255,0.35)', borderWidth: 2 },
  photoRemoveBtn: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  addIconRing: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(179,92,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(179,92,255,0.25)' },
  photoLabel: { color: 'rgba(179,92,255,0.5)', fontSize: 11, fontWeight: '700' },
  uploadProgressWrap: { width: '80%', height: 24, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, overflow: 'hidden', justifyContent: 'center' },
  uploadProgressBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.primary, borderRadius: 12 },
  uploadProgressText: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center', zIndex: 1 },

  cardSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: 16, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  charCount: { color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: { backgroundColor: 'rgba(124,43,255,0.15)', borderColor: 'rgba(179,92,255,0.3)' },
  chipText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  chipTextActive: { color: colors.primaryLight },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  switchLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  switchHint: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2 },
});
