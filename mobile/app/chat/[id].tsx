import { useEffect, useState, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messagingApi, usersApi } from '../../src/api/client';
import { useAuthStore } from '../../src/stores/auth';
import { useSocket } from '../../src/hooks/useSocket';
import { useScreenshotDetection } from '../../src/hooks/useScreenshotDetection';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';

interface Message { _id: string; senderId: string; content: string; contentType: string; createdAt: string; expiresAt?: string; }

export default function ChatScreen() {
  const { id: convId } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const userId = useAuthStore(s => s.userId);
  const socket = useSocket();
  useScreenshotDetection(convId as string | undefined);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [selfDestruct, setSelfDestruct] = useState(false);
  const listRef = useRef<FlatList>(null);

  const otherUserId = useMemo(() => msgs.find(m => m.senderId !== userId)?.senderId ?? null, [msgs, userId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={openSafetyMenu} style={{ padding: 12 }} hitSlop={12}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUserId]);

  function openSafetyMenu() {
    const options = otherUserId
      ? [
          { text: 'Block', style: 'destructive' as const, onPress: () => handleBlock() },
          { text: 'Report', onPress: () => handleReport() },
          { text: 'Safety info', onPress: () => showSafetyInfo() },
          { text: 'Cancel', style: 'cancel' as const },
        ]
      : [
          { text: 'Safety info', onPress: () => showSafetyInfo() },
          { text: 'Cancel', style: 'cancel' as const },
        ];
    Alert.alert('Conversation', undefined, options);
  }

  function handleBlock() {
    if (!otherUserId) return;
    Alert.alert('Block', 'Block this user? You will no longer see each other or receive messages.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => { usersApi.block(otherUserId); router.back(); } },
    ]);
  }

  function handleReport() {
    if (!otherUserId) return;
    usersApi.report(otherUserId, 'inappropriate').then(() => {
      Alert.alert('Reported', 'Thank you. We take reports seriously and will review.');
      router.back();
    }).catch((e: Error) => Alert.alert('', e.message || 'Could not submit report.'));
  }

  function showSafetyInfo() {
    Alert.alert(
      'Safety',
      'Block and Report are in this menu. For emergency help, go to Me → Panic Alert to notify your emergency contacts. You can also leave this conversation by going back.'
    );
  }

  const load = useCallback(() => {
    if (!convId) return;
    setLoading(true);
    setLoadError(null);
    messagingApi
      .getMessages(convId)
      .then((r) => { setMsgs(Array.isArray(r.data) ? r.data : []); setLoadError(null); })
      .catch((err: any) => { setLoadError(err?.message || 'Could not load messages.'); setMsgs([]); })
      .finally(() => setLoading(false));
  }, [convId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!convId) return;
    socket.joinConversation(convId);
    const unsub = socket.onNewMessage((data: any) => {
      const msg = data?.message ?? data;
      if (msg && msg._id) setMsgs(prev => [msg, ...prev]);
    });
    return () => {
      socket.leaveConversation(convId);
      unsub?.();
    };
  }, [convId]);

  const send = async () => {
    if (!input.trim() || !convId) return;
    const res = await messagingApi.sendMessage(convId, input.trim(), 'text', selfDestruct ? 30 : undefined);
    setMsgs(p => [res.data, ...p]);
    setInput('');
  };

  const renderMsg = ({ item }: { item: Message }) => {
    const mine = item.senderId === userId;
    const createdAt = (item as any).createdAt ?? (item as any).created_at;
    return (
      <View style={[s.row, mine && s.rowMine]}>
        <View style={[s.bubble, mine ? s.mine : s.theirs]}>
          {item.expiresAt && (
            <View style={s.sdLabel}><Ionicons name="timer" size={10} color={colors.host} /><Text style={s.sdText}>Self-destructing</Text></View>
          )}
          <Text style={s.msgText}>{item.content}</Text>
          <Text style={[s.time, !mine && { color: colors.textMuted }]}>
            {createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

  const listEmpty = (
    <View style={s.emptyWrap}>
      <Ionicons name="chatbubble-outline" size={36} color={colors.textMuted} />
      <Text style={s.emptyTitle}>No messages yet</Text>
      <Text style={s.emptySub}>Send a message to start the conversation.</Text>
    </View>
  );

  if (loading && msgs.length === 0 && !loadError) {
    return (
      <View style={s.container}>
        <View style={s.loadWrap}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={s.loadText}>Loading conversation…</Text>
        </View>
      </View>
    );
  }
  if (loadError && msgs.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.errorWrap}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={s.errorText}>{loadError}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}><Text style={s.retryBtnText}>Try again</Text></TouchableOpacity>
          <TouchableOpacity style={s.backLink} onPress={() => router.back()}><Text style={s.backLinkText}>Go back</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={i => i._id}
        renderItem={renderMsg}
        inverted
        contentContainerStyle={msgs.length === 0 ? s.emptyList : { paddingVertical: spacing.md }}
        ListEmptyComponent={listEmpty}
      />
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
  loadWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  loadText: { color: colors.textMuted, fontSize: 14, marginTop: spacing.md },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 80 },
  errorText: { color: colors.text, fontSize: 14, textAlign: 'center', marginTop: spacing.md },
  retryBtn: { marginTop: spacing.lg, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: borderRadius.lg },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  backLink: { marginTop: spacing.md, paddingVertical: 8 }, backLinkText: { color: colors.textMuted, fontSize: 14 },
  emptyList: { flexGrow: 1, paddingVertical: spacing.xxl },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '600', marginTop: spacing.md },
  emptySub: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
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
