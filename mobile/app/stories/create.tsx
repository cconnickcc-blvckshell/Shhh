import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePhotoUpload } from '../../src/hooks/usePhotoUpload';
import { storiesApi } from '../../src/api/client';
import { colors, spacing, fontSize } from '../../src/constants/theme';
import { mapApiError } from '../../src/utils/errorMapper';

export default function CreateStoryScreen() {
  const { pickAndUpload, takePhotoAndUpload, uploading } = usePhotoUpload();
  const [created, setCreated] = useState(false);

  const createStory = async (useCamera: boolean) => {
    const result = useCamera ? await takePhotoAndUpload('photos') : await pickAndUpload('photos');
    if (!result?.id) return;
    try {
      await storiesApi.create(result.id);
      setCreated(true);
      Alert.alert('Posted', 'Your story is live for 24 hours.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('', mapApiError(err));
    }
  };

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={s.title}>Add to Story</Text>
      <Text style={s.subtitle}>Visible for 24 hours</Text>
      <View style={s.btnRow}>
        <TouchableOpacity style={[s.btn, uploading && s.btnDisabled]} onPress={() => createStory(false)} disabled={uploading}>
          <Ionicons name="images" size={28} color="#fff" />
          <Text style={s.btnText}>Pick photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, uploading && s.btnDisabled]} onPress={() => createStory(true)} disabled={uploading}>
          <Ionicons name="camera" size={28} color="#fff" />
          <Text style={s.btnText}>Take photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 24, paddingTop: 80 },
  backBtn: { position: 'absolute', top: 50, left: 16, zIndex: 10 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 24 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8 },
  btnRow: { flexDirection: 'row', gap: 16, marginTop: 40 },
  btn: { flex: 1, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 20, borderRadius: 16, alignItems: 'center', gap: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
