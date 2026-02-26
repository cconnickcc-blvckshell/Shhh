import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messagingApi } from '../../src/api/client';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize } from '../../src/constants/theme';

interface Message {
  _id: string;
  senderId: string;
  content: string;
  contentType: string;
  createdAt: string;
  expiresAt?: string;
}

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selfDestruct, setSelfDestruct] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!conversationId) return;
    messagingApi.getMessages(conversationId).then((res) => setMessages(res.data)).catch(() => {});
  }, [conversationId]);

  const send = async () => {
    if (!input.trim() || !conversationId) return;
    const ttl = selfDestruct ? 30 : undefined;
    const res = await messagingApi.sendMessage(conversationId, input.trim(), 'text', ttl);
    setMessages((prev) => [res.data, ...prev]);
    setInput('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === userId;
    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={styles.msgText}>{item.content}</Text>
          <View style={styles.msgMeta}>
            {item.expiresAt && <Ionicons name="timer-outline" size={10} color={colors.warning} />}
            <Text style={styles.msgTime}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.list}
      />
      <View style={styles.inputBar}>
        <TouchableOpacity onPress={() => setSelfDestruct(!selfDestruct)} style={[styles.timerBtn, selfDestruct && styles.timerActive]}>
          <Ionicons name="timer-outline" size={20} color={selfDestruct ? colors.warning : colors.textMuted} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={selfDestruct ? 'Self-destructing message...' : 'Message...'}
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  msgRow: { marginBottom: spacing.sm, alignItems: 'flex-start' },
  msgRowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  msgText: { color: colors.text, fontSize: fontSize.md },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  msgTime: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.6)' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  timerBtn: { padding: spacing.sm, marginRight: 4 },
  timerActive: { backgroundColor: 'rgba(253,203,110,0.2)', borderRadius: 8 },
  input: { flex: 1, backgroundColor: colors.surfaceLight, color: colors.text, padding: 10, borderRadius: 20, fontSize: fontSize.md, maxHeight: 100 },
  sendBtn: { backgroundColor: colors.primary, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },
});
