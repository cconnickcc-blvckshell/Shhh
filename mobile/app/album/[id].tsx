import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, useWindowDimensions, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { albumsApi, getMediaUrl } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [album, setAlbum] = useState<any>(null);
  const [shareUserId, setShareUserId] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [watermarkMode, setWatermarkMode] = useState<'off' | 'subtle' | 'invisible'>('subtle');
  const [notifyOnView, setNotifyOnView] = useState(true);
  const { width } = useWindowDimensions();
  const cols = 3;
  const tileSize = (width - spacing.md * 2 - 4 * (cols - 1)) / cols;

  const load = async () => {
    if (!id) return;
    try {
      const res = await albumsApi.getAlbum(id);
      setAlbum(res.data);
    } catch { Alert.alert('Error', 'Album not found or access denied'); router.back(); }
  };

  useEffect(() => { load(); }, [id]);

  const handleShare = async () => {
    if (!shareUserId.trim() || !id) return;
    try {
      await albumsApi.share(id, { userId: shareUserId.trim(), expiresInHours: 24, watermarkMode, notifyOnView });
      setShareUserId('');
      setShowShare(false);
      Alert.alert('Shared', 'Album shared for 24 hours');
      load();
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const handleRevoke = async (userId: string) => {
    if (!id) return;
    await albumsApi.revokeShare(id, userId);
    load();
  };

  if (!album) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{album.name}</Text>
          <Text style={styles.subtitle}>{album.media?.length || 0} photos{album.is_private ? ' · Private' : ''}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowShare(!showShare)}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showShare && (
        <View style={styles.shareBox}>
          <Text style={styles.shareTitle}>Share Album</Text>
          <View style={styles.shareRow}>
            <TextInput style={styles.shareInput} value={shareUserId} onChangeText={setShareUserId} placeholder="User ID to share with..." placeholderTextColor={colors.textMuted} />
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Share (24h)</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.shareOptions}>
            <Text style={styles.shareOptLabel}>Watermark</Text>
            <View style={styles.shareOptRow}>
              {(['off', 'subtle', 'invisible'] as const).map((m) => (
                <TouchableOpacity key={m} style={[styles.shareOptChip, watermarkMode === m && styles.shareOptChipActive]} onPress={() => setWatermarkMode(m)}>
                  <Text style={[styles.shareOptChipText, watermarkMode === m && styles.shareOptChipTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.shareOptToggle} onPress={() => setNotifyOnView((v) => !v)}>
              <Ionicons name={notifyOnView ? 'notifications' : 'notifications-off'} size={18} color={notifyOnView ? colors.primaryLight : colors.textMuted} />
              <Text style={styles.shareOptToggleText}>Notify when viewed</Text>
            </TouchableOpacity>
          </View>
          {album.shares?.length > 0 && (
            <View style={styles.shareList}>
              <Text style={styles.shareListTitle}>Shared with:</Text>
              {album.shares.map((s: any) => (
                <View key={s.shared_with_user_id} style={styles.shareItem}>
                  <Text style={styles.shareName}>{s.display_name}</Text>
                  <TouchableOpacity onPress={() => handleRevoke(s.shared_with_user_id)}>
                    <Text style={styles.revokeText}>Revoke</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <FlatList
        data={album.media || []}
        keyExtractor={item => item.id}
        numColumns={cols}
        columnWrapperStyle={{ gap: 4 }}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => {
          const url = item.storage_path ? getMediaUrl(item.storage_path) : null;
          return (
            <View style={[styles.photoTile, { width: tileSize, height: tileSize }]}>
              {url ? (
                <Image source={{ uri: url }} style={[styles.photoImage, { width: tileSize, height: tileSize }]} resizeMode="cover" />
              ) : (
                <Ionicons name="image" size={24} color={colors.textMuted} />
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No photos in this album</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  headerCenter: { flex: 1 },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  shareBox: { backgroundColor: colors.card, margin: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg },
  shareTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  shareRow: { flexDirection: 'row', gap: spacing.sm },
  shareInput: { flex: 1, backgroundColor: colors.surfaceElevated, color: colors.text, padding: 12, borderRadius: borderRadius.md, fontSize: fontSize.sm },
  shareBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: borderRadius.md },
  shareBtnText: { color: '#fff', fontWeight: '600', fontSize: fontSize.sm },
  shareOptions: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 0.5, borderTopColor: colors.border },
  shareOptLabel: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: 6 },
  shareOptRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  shareOptChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surfaceElevated },
  shareOptChipActive: { backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary },
  shareOptChipText: { color: colors.textMuted, fontSize: fontSize.sm },
  shareOptChipTextActive: { color: '#fff' },
  shareOptToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareOptToggleText: { color: colors.text, fontSize: fontSize.sm },
  shareList: { marginTop: spacing.md },
  shareListTitle: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: spacing.sm },
  shareItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  shareName: { color: colors.text, fontSize: fontSize.sm },
  revokeText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '600' },
  grid: { padding: spacing.md },
  photoTile: { backgroundColor: colors.surfaceElevated, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 4, overflow: 'hidden' },
  photoImage: { borderRadius: borderRadius.sm },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.md },
});
