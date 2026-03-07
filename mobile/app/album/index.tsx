import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { albumsApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { useBreakpoint } from '../../src/hooks/useBreakpoint';
import { mapApiError } from '../../src/utils/errorMapper';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';
import { SafeState } from '../../src/components/ui';

export default function AlbumsScreen() {
  const [myAlbums, setMyAlbums] = useState<any[]>([]);
  const [sharedAlbums, setSharedAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<'mine' | 'shared'>('mine');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const { isDesktop } = useBreakpoint();
  const numColumns = isDesktop ? 4 : 2;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [mine, shared] = await Promise.all([albumsApi.getMyAlbums(), albumsApi.getShared()]);
      setMyAlbums(mine.data);
      setSharedAlbums(shared.data);
    } catch (err: any) {
      setLoadError(mapApiError(err));
      setMyAlbums([]);
      setSharedAlbums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createAlbum = async () => {
    if (!newName.trim()) return;
    await albumsApi.create(newName.trim(), undefined, true);
    setNewName('');
    setShowCreate(false);
    load();
  };

  const albums = tab === 'mine' ? myAlbums : sharedAlbums;

  const renderAlbum = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.albumCard} onPress={() => router.push(`/album/${item.id}`)} activeOpacity={0.8}>
      <View style={styles.albumCover}>
        <Ionicons name="images" size={28} color={colors.textMuted} />
        {item.is_private && (
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={10} color={colors.warning} />
          </View>
        )}
      </View>
      <Text style={styles.albumName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.albumCount}>{item.media_count || 0} photos</Text>
      {tab === 'shared' && <Text style={styles.albumOwner}>by {item.owner_name}</Text>}
    </TouchableOpacity>
  );

  if (loading && myAlbums.length === 0 && sharedAlbums.length === 0) {
    return (
      <PremiumDarkBackground style={styles.wrapper}>
        <PageShell>
          <SafeState variant="loading" message="Loading albums..." />
        </PageShell>
      </PremiumDarkBackground>
    );
  }
  if (loadError && myAlbums.length === 0 && sharedAlbums.length === 0) {
    return (
      <PremiumDarkBackground style={styles.wrapper}>
        <PageShell>
          <SubPageHeader title="Albums" />
          <SafeState variant="error" message={loadError} onRetry={() => { setLoading(true); load(); }} />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={styles.wrapper}>
      <PageShell>
        <SubPageHeader
          title="Albums"
          rightAction={
            <TouchableOpacity onPress={() => setShowCreate(true)}>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          }
        />

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'mine' && styles.tabActive]} onPress={() => setTab('mine')}>
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>My Albums</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'shared' && styles.tabActive]} onPress={() => setTab('shared')}>
          <Text style={[styles.tabText, tab === 'shared' && styles.tabTextActive]}>Shared with Me</Text>
        </TouchableOpacity>
      </View>

      {showCreate && (
        <View style={styles.createRow}>
          <TextInput style={styles.createInput} value={newName} onChangeText={setNewName} placeholder="Album name..." placeholderTextColor={colors.textMuted} autoFocus />
          <TouchableOpacity style={styles.createBtn} onPress={createAlbum}>
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCreate(false)}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={albums}
        keyExtractor={(item) => item.id}
        renderItem={renderAlbum}
        numColumns={numColumns}
        key={numColumns}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>{tab === 'mine' ? 'No albums yet' : 'No shared albums'}</Text>
          </View>
        }
      />
      </PageShell>
    </PremiumDarkBackground>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, backgroundColor: colors.surfaceElevated, borderRadius: borderRadius.md, padding: 3, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: borderRadius.sm },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  createInput: { flex: 1, backgroundColor: colors.surfaceElevated, color: colors.text, padding: 12, borderRadius: borderRadius.md, fontSize: fontSize.md },
  createBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: borderRadius.md },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  grid: { padding: spacing.md },
  gridRow: { gap: spacing.sm },
  albumCard: { flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.sm },
  albumCover: { height: 120, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  lockBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 4 },
  albumName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  albumCount: { color: colors.textMuted, fontSize: fontSize.xxs, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  albumOwner: { color: colors.info, fontSize: fontSize.xxs, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  centerLoad: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loadText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.md },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 80 },
  errorText: { color: colors.text, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.md },
  retryBtn: { marginTop: spacing.lg, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: borderRadius.lg },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: fontSize.sm },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.md },
});
