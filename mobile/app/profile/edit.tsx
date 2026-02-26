import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usersApi } from '../../src/api/client';
import { usePhotoUpload } from '../../src/hooks/usePhotoUpload';
import { ProfilePhoto } from '../../src/components/ProfilePhoto';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

const GENDERS = ['man', 'woman', 'couple', 'trans_man', 'trans_woman', 'non_binary', 'other'];
const EXPERIENCE_LEVELS = ['new', 'curious', 'experienced', 'veteran'];

export default function EditProfileScreen() {
  const { profile, loadProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [sexuality, setSexuality] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [kinks, setKinks] = useState('');
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const { pickAndUpload, uploading } = usePhotoUpload();

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setGender(profile.gender || '');
      setSexuality(profile.sexuality || '');
      setExperienceLevel(profile.experienceLevel || '');
      setIsHost(profile.isHost || false);
      setKinks((profile.kinks || []).join(', '));
      setPhotos(profile.photosJson || []);
    }
  }, [profile]);

  const handleAddPhoto = async () => {
    const result = await pickAndUpload('photos');
    if (result) {
      setPhotos(prev => [...prev, result.url]);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await usersApi.updateMe({
        displayName, bio, gender, sexuality, experienceLevel, isHost,
        kinks: kinks.split(',').map((k: string) => k.trim()).filter(Boolean),
        photosJson: photos,
      });
      await loadProfile();
      Alert.alert('Saved', 'Profile updated successfully');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={save} disabled={saving} style={styles.saveBtn}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>PHOTOS</Text>
        <View style={styles.photoGrid}>
          {photos.map((p, i) => (
            <View key={i} style={styles.photoSlot}>
              <ProfilePhoto storagePath={p} size={80} borderRadius={12} />
              <TouchableOpacity style={styles.photoRemove} onPress={() => setPhotos(prev => prev.filter((_, j) => j !== i))}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 6 && (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto} disabled={uploading}>
              {uploading ? <ActivityIndicator color={colors.primaryLight} /> : <Ionicons name="add" size={28} color={colors.primaryLight} />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>DISPLAY NAME</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor={colors.textMuted} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>BIO</Text>
        <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} placeholder="Tell others about yourself..." placeholderTextColor={colors.textMuted} multiline numberOfLines={4} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>GENDER</Text>
        <View style={styles.chips}>
          {GENDERS.map(g => (
            <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
              <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>SEXUALITY</Text>
        <TextInput style={styles.input} value={sexuality} onChangeText={setSexuality} placeholder="e.g. bisexual, straight, pansexual" placeholderTextColor={colors.textMuted} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>EXPERIENCE LEVEL</Text>
        <View style={styles.chips}>
          {EXPERIENCE_LEVELS.map(e => (
            <TouchableOpacity key={e} style={[styles.chip, experienceLevel === e && styles.chipActive]} onPress={() => setExperienceLevel(e)}>
              <Text style={[styles.chipText, experienceLevel === e && styles.chipTextActive]}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>INTERESTS / KINKS</Text>
        <TextInput style={styles.input} value={kinks} onChangeText={setKinks} placeholder="social, dancing, parties (comma separated)" placeholderTextColor={colors.textMuted} />
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Available to Host</Text>
          <Text style={styles.switchSub}>Show host badge on your profile</Text>
        </View>
        <Switch value={isHost} onValueChange={setIsHost} trackColor={{ false: colors.surfaceLight, true: colors.primaryDark }} thumbColor={isHost ? colors.primary : colors.textMuted} />
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  backBtn: { padding: spacing.xs },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  saveBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  saveText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  field: { marginBottom: spacing.lg },
  label: { color: colors.textMuted, fontSize: fontSize.xxs, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm },
  input: { backgroundColor: colors.surfaceElevated, color: colors.text, padding: 14, borderRadius: borderRadius.md, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { backgroundColor: colors.surfaceElevated, paddingHorizontal: 16, paddingVertical: 10, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: fontSize.sm, textTransform: 'capitalize' },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoSlot: { position: 'relative' },
  photoRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.background, borderRadius: 10 },
  addPhotoBtn: { width: 80, height: 80, borderRadius: 12, backgroundColor: colors.surfaceElevated, borderWidth: 1.5, borderColor: colors.borderGlow, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  switchLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  switchSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
});
