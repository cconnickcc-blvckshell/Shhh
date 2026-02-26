import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messagingApi } from '../../src/api/client';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';

interface Message { _id: string; senderId: string; content: string; contentType: string; createdAt: string; expiresAt?: string; }

export default function ChatScreen() {
  const { id: convId } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore(s => s.userId);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selfDestruct, setSelfDestruct] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => { if (convId) messagingApi.getMessages(convId).then(r => setMsgs(r.data)).catch(() => {}); }, [convId]);

  const send = async () => {
    if (!input.trim() || !convId) return;
    const res = await messagingApi.sendMessage(convId, input.trim(), 'text', selfDestruct ? 30 : undefined);
    setMsgs(p => [res.data, ...p]);
    setInput('');
  };

  const renderMsg = ({ item }: { item: Message }) => {
    const mine = item.senderId === userId;
    return (
      <View style={[s.row, mine && s.rowMine]}>
        <View style={[s.bubble, mine ? s.mine : s.theirs]}>
          {item.expiresAt && (
            <View style={s.sdLabel}><Ionicons name="timer" size={10} color={colors.host} /><Text style={s.sdText}>Self-destructing</Text></View>
          )}
          <Text style={s.msgText}>{item.content}</Text>
          <Text style={[s.time, !mine && { color: colors.textMuted }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList ref={listRef} data={msgs} keyExtractor={i => i._id} renderItem={renderMsg} inverted contentContainerStyle={{ paddingVertical: spacing.md }} />
      <View style={s.bar}>
        <TouchableOpacity onPress={() => setSelfDestruct(!selfDestruct)} style={[s.iconBtn, selfDestruct && s.iconActive]}>
          <Ionicons name="timer" size={20} color={selfDestruct ? colors.host : colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn}><Ionicons name="camera" size={20} color={colors.textMuted} /></TouchableOpacity>
        <View style={s.inputWrap}>
          <TextInput style={s.input} value={input} onChangeText={setInput} placeholder={selfDestruct ? 'Self-destructing...' : 'Message...'} placeholderTextColor={colors.textMuted} multiline onSubmitEditing={send} />
        </View>
        <TouchableOpacity style={[s.sendBtn, !input.trim() && s.sendDisabled]} onPress={send} disabled={!input.trim()}>
          <Ionicons name="arrow-up" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { marginBottom: spacing.xs, alignItems: 'flex-start', paddingHorizontal: spacing.md },
  rowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.surfaceElevated, borderBottomLeftRadius: 6, borderWidth: 0.5, borderColor: colors.border },
  sdLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  sdText: { color: colors.host, fontSize: fontSize.xxs, fontWeight: '600' },
  msgText: { color: colors.text, fontSize: fontSize.md, lineHeight: 21 },
  time: { color: 'rgba(255,255,255,0.5)', fontSize: fontSize.xxs, marginTop: 4, alignSelf: 'flex-end' },
  bar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 0.5, borderTopColor: colors.border, backgroundColor: colors.surface, gap: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconActive: { backgroundColor: 'rgba(251,191,36,0.12)' },
  inputWrap: { flex: 1 },
  input: { backgroundColor: colors.surfaceElevated, color: colors.text, paddingHorizontal: 16, paddingVertical: 10, borderRadius: borderRadius.xl, fontSize: fontSize.md, maxHeight: 100, borderWidth: 0.5, borderColor: colors.border },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.glow },
  sendDisabled: { backgroundColor: colors.surfaceLight, shadowOpacity: 0 },
});
