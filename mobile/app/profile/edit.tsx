import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '../../src/api/client';
import { useAuthStore } from '../../src/stores/auth';
import { usePhotoUpload } from '../../src/hooks/usePhotoUpload';
import { ProfilePhoto } from '../../src/components/ProfilePhoto';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

const GENDERS = ['man', 'woman', 'couple', 'trans_man', 'trans_woman', 'non_binary', 'other'];
const EXP = ['new', 'curious', 'experienced', 'veteran'];

export default function EditProfileScreen() {
  const { profile, loadProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [sexuality, setSexuality] = useState('');
  const [exp, setExp] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [kinks, setKinks] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { pickAndUpload, uploading } = usePhotoUpload();

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
    }
  }, [profile]);

  const addPhoto = async () => {
    const result = await pickAndUpload('photos');
    if (result) setPhotos(p => [...p, result.url]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await usersApi.updateMe({ displayName, bio, gender, sexuality, experienceLevel: exp, isHost, kinks: kinks.split(',').map(k => k.trim()).filter(Boolean), photosJson: photos });
      await loadProfile();
      router.back();
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setSaving(false); }
  };

  return (
    <PremiumDarkBackground style={s.wrapper}>
    <ScrollView style={s.container} contentContainerStyle={s.scrollContent} bounces={false}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} accessibilityRole="header">Edit Profile</Text>
        <TouchableOpacity onPress={save} disabled={saving} style={s.saveBtn}>
          <Text style={[s.saveText, saving && { opacity: 0.4 }]}>{saving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* Photo grid — HERO */}
      <View style={s.photoSection}>
        <View style={s.photoGrid}>
          {[0, 1, 2, 3, 4, 5].map(i => {
            const hasPhoto = photos[i];
            return (
              <TouchableOpacity
                key={i}
                style={[s.photoSlot, i === 0 && s.photoMain]}
                onPress={hasPhoto ? () => setPhotos(p => p.filter((_, j) => j !== i)) : addPhoto}
                disabled={!hasPhoto && uploading}
                activeOpacity={0.8}
              >
                {hasPhoto ? (
                  <View style={{ flex: 1 }}>
                    <ProfilePhoto storagePath={photos[i]} size={i === 0 ? 200 : 100} borderRadius={i === 0 ? 16 : 12} />
                    <View style={s.photoRemoveBtn}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </View>
                  </View>
                ) : (
                  <View style={s.photoEmpty}>
                    {uploading ? <ActivityIndicator size="small" color={colors.primaryLight} /> : (
                      <>
                        <Ionicons name="add" size={24} color={colors.primaryLight} />
                        {i === 0 && <Text style={s.photoLabel}>Main</Text>}
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Form */}
      <View style={s.form}>
        <Text style={s.label}>DISPLAY NAME</Text>
        <TextInput style={s.input} value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor="rgba(255,255,255,0.2)" />

        <Text style={s.label}>BIO</Text>
        <TextInput style={[s.input, s.textArea]} value={bio} onChangeText={setBio} placeholder="About you..." placeholderTextColor="rgba(255,255,255,0.2)" multiline />

        <Text style={s.label}>GENDER</Text>
        <View style={s.chips}>
          {GENDERS.map(g => (
            <TouchableOpacity key={g} style={[s.chip, gender === g && s.chipActive]} onPress={() => setGender(g)}>
              <Text style={[s.chipText, gender === g && s.chipTextActive]}>{g.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>SEXUALITY</Text>
        <TextInput style={s.input} value={sexuality} onChangeText={setSexuality} placeholder="e.g. bisexual" placeholderTextColor="rgba(255,255,255,0.2)" />

        <Text style={s.label}>EXPERIENCE</Text>
        <View style={s.chips}>
          {EXP.map(e => (
            <TouchableOpacity key={e} style={[s.chip, exp === e && s.chipActive]} onPress={() => setExp(e)}>
              <Text style={[s.chipText, exp === e && s.chipTextActive]}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>INTERESTS</Text>
        <TextInput style={s.input} value={kinks} onChangeText={setKinks} placeholder="social, dancing, parties" placeholderTextColor="rgba(255,255,255,0.2)" />

        <View style={s.switchRow}>
          <View>
            <Text style={s.switchLabel}>Available to Host</Text>
            <Text style={s.switchHint}>Show host badge</Text>
          </View>
          <Switch value={isHost} onValueChange={setIsHost} trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.primaryDark }} thumbColor={isHost ? colors.primaryLight : 'rgba(255,255,255,0.5)'} />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
    </PremiumDarkBackground>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  photoSection: { paddingHorizontal: 16, paddingVertical: 16 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  photoSlot: { width: '31.5%', aspectRatio: 0.85, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)' },
  photoMain: { width: '48%', aspectRatio: 0.75, borderColor: 'rgba(147,51,234,0.3)', borderWidth: 2 },
  photoRemoveBtn: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700' },
  form: { paddingHorizontal: 16 },
  label: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 20, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', padding: 16, borderRadius: 14, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  chipActive: { backgroundColor: 'rgba(147,51,234,0.15)', borderColor: 'rgba(147,51,234,0.5)' },
  chipText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  chipTextActive: { color: colors.primaryLight },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 14, marginTop: 20 },
  switchLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  switchHint: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2 },
});
