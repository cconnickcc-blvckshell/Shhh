import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, getMediaUrl } from '../../../src/api/client';
import { colors } from '../../../src/constants/theme';

const { width, height } = Dimensions.get('window');

export default function StoryViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api<{ data: any }>(`/v1/stories/${id}/view`).catch(() => {});
    api<{ data: any }>(`/v1/stories/${id}`)
      .then((r) => { setStory(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const mediaUrl = story?.media_storage_path ? getMediaUrl(story.media_storage_path) : null;

  if (loading || !story) {
    return (
      <View style={s.container}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {mediaUrl && <Image source={{ uri: mediaUrl }} style={s.image} resizeMode="cover" />}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      {story.venue_name && (
        <View style={s.venueBadge}>
          <Ionicons name="business" size={14} color="#fff" />
          <Text style={s.venueText}>{story.venue_name}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  image: { ...StyleSheet.absoluteFillObject },
  backBtn: { position: 'absolute', top: 50, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  venueBadge: { position: 'absolute', bottom: 80, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  venueText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
