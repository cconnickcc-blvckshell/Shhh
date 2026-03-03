import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messagingApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { PageShell, ContentColumn } from '../../src/components/layout';
import { SafeState } from '../../src/components/ui';
import { mapApiError } from '../../src/utils/errorMapper';
import { useScreenView } from '../../src/hooks/useScreenView';

interface Conversation {
  id: string;
  type: string;
  lastMessageAt?: string | null;
  last_message_at?: string | null;
  unreadCount?: number;
  unread_count?: number;
  participantNames?: string[];
  lastMessageSnippet?: string | null;
}

function timeAgo(d: string | null | undefined): string {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return days < 7 ? `${days}d` : new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MessagesScreen() {
  useScreenView('messages');
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const r = await messagingApi.getConversations();
      setConvos(r.data);
    } catch (err: any) {
      setLoadError(mapApiError(err));
      setConvos([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); setLoadError(null); await load(); setRefreshing(false); };

  if (loading && convos.length === 0) {
    return (
      <PageShell>
        <SafeState variant="loading" message="Loading conversations..." />
      </PageShell>
    );
  }
  if (loadError && convos.length === 0) {
    return (
      <PageShell>
        <SafeState variant="error" message={loadError} onRetry={() => { setLoading(true); load(); }} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ContentColumn style={styles.column}>
      <FlatList
        data={convos}
        keyExtractor={i => i.id}
        renderItem={({ item }) => {
          const lastAt = item.lastMessageAt ?? item.last_message_at;
          const unread = item.unreadCount ?? item.unread_count ?? 0;
          const label = item.participantNames?.length
            ? (item.type === 'group' ? item.participantNames.join(', ') : item.participantNames[0])
            : (item.type === 'group' ? 'Group chat' : 'Direct chat');
          const preview = item.lastMessageSnippet ?? (lastAt ? 'Tap to open' : 'No messages yet');
          return (
            <TouchableOpacity style={styles.row} onPress={() => router.push(`/chat/${item.id}`)} activeOpacity={0.7} accessibilityLabel={`${label}, ${preview}`} accessibilityRole="button" accessibilityHint="Opens conversation">
              <View style={styles.avatar}>
                <Ionicons name={item.type === 'group' ? 'people' : 'person'} size={22} color={colors.primaryLight} />
                {unread > 0 && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.mid}>
                <View style={styles.topLine}>
                  <Text style={styles.name}>{label}</Text>
                  {lastAt ? <Text style={styles.time}>{timeAgo(lastAt)}</Text> : null}
                </View>
                <Text style={styles.preview} numberOfLines={1}>
                  {preview}
                </Text>
              </View>
              {unread > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text></View>
              )}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <SafeState variant="empty" title="No conversations" message="Match with someone to start chatting" icon="chatbubble-ellipses-outline" />
          </View>
        }
      />
      </ContentColumn>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1 },
  emptyWrap: { flex: 1, paddingVertical: 80 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 14 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.online, borderWidth: 2, borderColor: colors.background },
  mid: { flex: 1, minWidth: 0 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  time: { color: colors.textMuted, fontSize: fontSize.xs },
  preview: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  badge: { backgroundColor: colors.primary, borderRadius: borderRadius.full, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginLeft: spacing.sm },
  badgeText: { color: '#fff', fontSize: fontSize.xxs, fontWeight: '800' },
  sep: { height: 0.5, backgroundColor: colors.border, marginLeft: 82 },
});
