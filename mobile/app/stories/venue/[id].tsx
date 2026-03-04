import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, venuesApi, getMediaUrl } from '../../../src/api/client';
import { colors } from '../../../src/constants/theme';

const { width, height } = Dimensions.get('window');

export default function VenueStoriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [stories, setStories] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    venuesApi.getStories(id).then((r) => { setStories(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const story = stories[index];
  const mediaUrl = story?.media_storage_path ? getMediaUrl(story.media_storage_path) : null;

  useEffect(() => {
    if (!story?.id) return;
    api(`/v1/stories/${story.id}/view`).catch(() => {});
  }, [story?.id]);

  if (loading) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
      </View>
    );
  }
  if (stories.length === 0) {
    return (
      <View style={s.container}>
        <Text style={s.emptyText}>No stories</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {mediaUrl && (
        <Image source={{ uri: mediaUrl }} style={s.image} resizeMode="cover" />
      )}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={s.progressRow}>
        {stories.map((_, i) => (
          <View key={i} style={[s.progressBar, i <= index && s.progressBarActive]} />
        ))}
      </View>
      <View style={s.navArea}>
        <TouchableOpacity style={s.navBtn} onPress={() => setIndex((i) => Math.max(0, i - 1))}>
          <View style={{ width: width * 0.3, height: height }} />
        </TouchableOpacity>
        <TouchableOpacity style={s.navBtn} onPress={() => {
          if (index < stories.length - 1) setIndex((i) => i + 1);
          else router.back();
        }}>
          <View style={{ width: width * 0.7, height: height }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  image: { ...StyleSheet.absoluteFillObject },
  backBtn: { position: 'absolute', top: 50, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  progressRow: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', gap: 4, zIndex: 10 },
  progressBar: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  progressBarActive: { backgroundColor: '#fff' },
  navArea: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 5 },
  navBtn: { flex: 1 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
});
