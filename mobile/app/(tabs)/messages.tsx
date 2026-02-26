import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messagingApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

interface Conversation {
  id: string;
  type: string;
  last_message_at: string;
  unread_count: number;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await messagingApi.getConversations();
      setConversations(res.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.item} onPress={() => router.push(`/chat/${item.id}`)} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Ionicons name={item.type === 'group' ? 'people' : 'person'} size={22} color={colors.textMuted} />
        <View style={styles.avatarOnline} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name}>Conversation</Text>
          {item.last_message_at && (
            <Text style={styles.time}>{timeAgo(item.last_message_at)}</Text>
          )}
        </View>
        <Text style={styles.preview} numberOfLines={1}>Tap to view messages</Text>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unread}>
          <Text style={styles.unreadText}>{item.unread_count > 99 ? '99+' : item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No conversations</Text>
            <Text style={styles.emptySub}>Match with someone to start chatting</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
    position: 'relative',
  },
  avatarOnline: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.online,
    borderWidth: 2, borderColor: colors.background,
  },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  time: { color: colors.textMuted, fontSize: fontSize.xs },
  preview: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  unread: {
    backgroundColor: colors.primary, borderRadius: borderRadius.full,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, marginLeft: spacing.sm,
  },
  unreadText: { color: '#fff', fontSize: fontSize.xxs, fontWeight: '800' },
  separator: { height: 0.5, backgroundColor: colors.border, marginLeft: 84 },
  empty: { alignItems: 'center', paddingTop: 120 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  emptySub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
});
