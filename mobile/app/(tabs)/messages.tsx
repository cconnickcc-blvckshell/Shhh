import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messagingApi } from '../../src/api/client';
import { colors, spacing, fontSize } from '../../src/constants/theme';

interface Conversation {
  id: string;
  type: string;
  last_message_at: string;
  unread_count: number;
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
    <TouchableOpacity style={styles.item} onPress={() => router.push(`/chat/${item.id}`)}>
      <View style={styles.avatar}>
        <Ionicons name={item.type === 'group' ? 'people' : 'person'} size={24} color={colors.textMuted} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>Conversation</Text>
        <Text style={styles.preview}>{item.last_message_at ? new Date(item.last_message_at).toLocaleString() : 'No messages yet'}</Text>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unread}>
          <Text style={styles.unreadText}>{item.unread_count}</Text>
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Like someone to start chatting</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  item: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  content: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  preview: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  unread: { backgroundColor: colors.primary, borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: fontSize.xs, fontWeight: 'bold' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: fontSize.lg, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
});
