import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messagingApi } from '../../src/api/client';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

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
    const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[msgStyles.row, isMine && msgStyles.rowMine]}>
        <View style={[msgStyles.bubble, isMine ? msgStyles.bubbleMine : msgStyles.bubbleTheirs]}>
          {item.expiresAt && (
            <View style={msgStyles.selfDestructLabel}>
              <Ionicons name="timer" size={10} color={colors.warning} />
              <Text style={msgStyles.selfDestructText}>Self-destructing</Text>
            </View>
          )}
          <Text style={[msgStyles.text, !isMine && { color: colors.text }]}>{item.content}</Text>
          <Text style={[msgStyles.time, !isMine && { color: colors.textMuted }]}>{time}</Text>
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
        <TouchableOpacity
          onPress={() => setSelfDestruct(!selfDestruct)}
          style={[styles.iconBtn, selfDestruct && styles.iconBtnActive]}
        >
          <Ionicons name="timer" size={20} color={selfDestruct ? colors.warning : colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="camera" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={selfDestruct ? 'Self-destructing...' : 'Type a message'}
            placeholderTextColor={colors.textMuted}
            multiline
            onSubmitEditing={send}
          />
        </View>

        <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={send} disabled={!input.trim()}>
          <Ionicons name="arrow-up" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const msgStyles = StyleSheet.create({
  row: { marginBottom: spacing.xs, alignItems: 'flex-start', paddingHorizontal: spacing.md },
  rowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: colors.surfaceElevated, borderBottomLeftRadius: 6 },
  selfDestructLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  selfDestructText: { color: colors.warning, fontSize: fontSize.xxs, fontWeight: '600' },
  text: { color: colors.textOnPrimary, fontSize: fontSize.md, lineHeight: 20 },
  time: { color: 'rgba(255,255,255,0.55)', fontSize: fontSize.xxs, marginTop: 4, alignSelf: 'flex-end' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingVertical: spacing.md },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    borderTopWidth: 0.5, borderTopColor: colors.border,
    backgroundColor: colors.surface, gap: 6,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { backgroundColor: 'rgba(255,165,2,0.15)' },
  inputWrapper: { flex: 1 },
  input: {
    backgroundColor: colors.surfaceElevated, color: colors.text,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: borderRadius.xl, fontSize: fontSize.md, maxHeight: 100,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceLight },
});
