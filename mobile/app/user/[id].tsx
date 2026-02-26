import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, usersApi, messagingApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [refs, setRefs] = useState<any>(null);
  const [whisperText, setWhisperText] = useState('');
  const [showWhisper, setShowWhisper] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (!id) return;
    api<{ data: any }>(`/v1/users/${id}/trust-score`).catch(() => null);
    api<{ data: any }>(`/v1/references/${id}`).then(r => setRefs(r.data)).catch(() => {});
  }, [id]);

  const handleLike = async () => {
    if (!id) return;
    const res = await usersApi.like(id);
    if (res.data.matched) Alert.alert('It\'s a Match! 💕', 'You matched with this user');
    else Alert.alert('Liked', 'They\'ll see your interest');
  };

  const handleMessage = async () => {
    if (!id) return;
    try {
      const conv = await messagingApi.createConversation([id]);
      router.push(`/chat/${conv.data.id}`);
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const handleBlock = () => {
    Alert.alert('Block User', 'You won\'t see each other anymore.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: async () => { if (id) { await usersApi.block(id); router.back(); } } },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.photoArea, { height: width * 0.8 }]}>
        <Ionicons name="person" size={80} color={colors.textMuted} />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.name}>User Profile</Text>
        <Text style={styles.userId}>ID: {id?.slice(0, 12)}...</Text>
      </View>

      {refs && (
        <View style={styles.refsCard}>
          <Ionicons name="star" size={18} color={colors.warning} />
          <Text style={styles.refsText}>
            {refs.averageRating > 0 ? `${refs.averageRating.toFixed(1)} avg · ` : ''}
            {refs.totalCount} reference{refs.totalCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionCircle} onPress={handleBlock}>
          <Ionicons name="close" size={28} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCircle, styles.whisperCircle]} onPress={() => setShowWhisper(!showWhisper)}>
          <Ionicons name="ear" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCircle, styles.likeCircle]} onPress={handleLike}>
          <Ionicons name="heart" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionCircle, styles.msgCircle]} onPress={handleMessage}>
          <Ionicons name="chatbubble" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {showWhisper && (
        <View style={styles.whisperBox}>
          <Text style={styles.whisperLabel}>Send an anonymous whisper</Text>
          <Text style={styles.whisperHint}>They won't see your name unless you both reveal</Text>
          <View style={styles.whisperInputRow}>
            <TextInput
              style={styles.whisperInput}
              value={whisperText}
              onChangeText={setWhisperText}
              placeholder="Love your vibe..."
              placeholderTextColor={colors.textMuted}
              maxLength={100}
            />
            <TouchableOpacity
              style={[styles.whisperSend, !whisperText.trim() && { opacity: 0.4 }]}
              disabled={!whisperText.trim()}
              onPress={async () => {
                if (!id || !whisperText.trim()) return;
                try {
                  await api('/v1/whispers', { method: 'POST', body: JSON.stringify({ toUserId: id, message: whisperText.trim() }) });
                  Alert.alert('Whispered', 'Your anonymous message was sent');
                  setWhisperText('');
                  setShowWhisper(false);
                } catch (err: any) { Alert.alert('Error', err.message); }
              }}
            >
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.reportRow}>
        <TouchableOpacity onPress={() => { if (id) usersApi.report(id, 'inappropriate'); Alert.alert('Reported', 'Thank you for keeping the community safe'); }}>
          <Text style={styles.reportText}>Report this user</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  photoArea: { backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  infoSection: { padding: spacing.lg },
  name: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  userId: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 4 },
  refsCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.lg },
  refsText: { color: colors.textSecondary, fontSize: fontSize.sm },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.lg },
  actionCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border },
  likeCircle: { backgroundColor: colors.primary, borderColor: colors.primary, width: 72, height: 72, borderRadius: 36 },
  msgCircle: { backgroundColor: colors.info, borderColor: colors.info },
  whisperCircle: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  whisperBox: { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 0.5, borderColor: colors.borderGlow },
  whisperLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.xxs },
  whisperHint: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: spacing.md },
  whisperInputRow: { flexDirection: 'row', gap: spacing.sm },
  whisperInput: { flex: 1, backgroundColor: colors.surfaceElevated, color: colors.text, paddingHorizontal: 14, paddingVertical: 12, borderRadius: borderRadius.xl, fontSize: fontSize.md, borderWidth: 0.5, borderColor: colors.border },
  whisperSend: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  reportRow: { alignItems: 'center', paddingVertical: spacing.xl },
  reportText: { color: colors.textMuted, fontSize: fontSize.sm },
});
