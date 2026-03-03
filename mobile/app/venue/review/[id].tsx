import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../../src/constants/theme';
import { mapApiError } from '../../../src/utils/errorMapper';

export default function VenueReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!id || rating < 1) return;
    setSubmitting(true);
    try {
      await api(`/v1/venues/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      Alert.alert('Thanks!', 'Your review has been submitted.');
      router.back();
    } catch (err: any) {
      Alert.alert('', mapApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.title}>Leave a Review</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={s.label}>Rating</Text>
      <View style={s.starRow}>
        {[1, 2, 3, 4, 5].map((r) => (
          <TouchableOpacity key={r} onPress={() => setRating(r)} style={s.starBtn}>
            <Ionicons name={r <= rating ? 'star' : 'star-outline'} size={36} color={colors.host} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Comment (optional)</Text>
      <TextInput
        style={s.commentInput}
        value={comment}
        onChangeText={setComment}
        placeholder="Share your experience..."
        placeholderTextColor="rgba(255,255,255,0.3)"
        multiline
        maxLength={500}
      />

      <TouchableOpacity
        style={[s.submitBtn, (rating < 1 || submitting) && s.submitDisabled]}
        onPress={submit}
        disabled={rating < 1 || submitting}
      >
        <Text style={s.submitText}>{submitting ? 'Submitting...' : 'Submit Review'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', marginBottom: 12 },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  starBtn: { padding: 4 },
  commentInput: { height: 100, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, marginBottom: 24, color: '#fff', fontSize: 14, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
