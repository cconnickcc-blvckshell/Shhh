import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';

export default function WhisperInboxScreen() {
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [whispers, setWhispers] = useState<any[]>([]);
  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const endpoint = tab === 'inbox' ? '/v1/whispers/inbox' : '/v1/whispers/sent';
      const res = await api<{ data: any[] }>(endpoint);
      setWhispers(res.data);
    } catch {}
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const respond = async (whisperId: string, reveal: boolean) => {
    if (!responseText.trim()) return;
    try {
      await api(`/v1/whispers/${whisperId}/respond`, { method: 'POST', body: JSON.stringify({ response: responseText.trim(), reveal }) });
      setResponseText('');
      setRespondingTo(null);
      load();
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const ignore = async (whisperId: string) => {
    await api(`/v1/whispers/${whisperId}/ignore`, { method: 'POST' });
    load();
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color="#fff" /></TouchableOpacity>
        <Text style={s.title}>Whispers</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'inbox' && s.tabActive]} onPress={() => setTab('inbox')}>
          <Text style={[s.tabText, tab === 'inbox' && s.tabTextActive]}>Inbox</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'sent' && s.tabActive]} onPress={() => setTab('sent')}>
          <Text style={[s.tabText, tab === 'sent' && s.tabTextActive]}>Sent</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={whispers}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={s.whisperCard}>
            <View style={s.whisperHeader}>
              <View style={s.anonIcon}><Ionicons name="ear" size={16} color={colors.primaryLight} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.whisperFrom}>
                  {tab === 'inbox' ? (item.revealed ? item.from_name : 'Anonymous') : item.to_name}
                </Text>
                <Text style={s.whisperDist}>{item.distance || 'nearby'}</Text>
              </View>
              <Text style={s.whisperTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>

            <Text style={s.whisperMsg}>"{item.message}"</Text>

            {item.response && (
              <View style={s.responseBox}>
                <Text style={s.responseLabel}>Response:</Text>
                <Text style={s.responseText}>"{item.response}"</Text>
              </View>
            )}

            {tab === 'inbox' && item.status === 'pending' && (
              <View>
                {respondingTo === item.id ? (
                  <View style={s.replyBox}>
                    <TextInput style={s.replyInput} value={responseText} onChangeText={setResponseText} placeholder="Your response..." placeholderTextColor="rgba(255,255,255,0.25)" maxLength={100} />
                    <View style={s.replyActions}>
                      <TouchableOpacity style={s.replyBtn} onPress={() => respond(item.id, false)}>
                        <Text style={s.replyBtnText}>Reply Anon</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.replyBtn, s.revealBtn]} onPress={() => respond(item.id, true)}>
                        <Ionicons name="eye" size={14} color="#fff" />
                        <Text style={s.replyBtnText}>Reply & Reveal</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={s.whisperActions}>
                    <TouchableOpacity style={s.whisperActionBtn} onPress={() => setRespondingTo(item.id)}>
                      <Text style={s.whisperActionText}>Reply</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => ignore(item.id)}>
                      <Text style={s.ignoreText}>Ignore</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {item.revealed && tab === 'inbox' && (
              <TouchableOpacity style={s.viewProfileBtn} onPress={() => router.push(`/user/${item.from_user_id}`)}>
                <Text style={s.viewProfileText}>View Profile</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primaryLight} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}><Ionicons name="ear-outline" size={36} color={colors.primaryLight} /></View>
            <Text style={s.emptyTitle}>{tab === 'inbox' ? 'No whispers yet' : 'No sent whispers'}</Text>
            <Text style={s.emptySub}>{tab === 'inbox' ? 'Someone nearby might whisper to you' : 'Tap the ear icon on a profile to whisper'}</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  whisperCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' },
  whisperHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  anonIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(147,51,234,0.15)', alignItems: 'center', justifyContent: 'center' },
  whisperFrom: { color: '#fff', fontSize: 14, fontWeight: '600' },
  whisperDist: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  whisperTime: { color: 'rgba(255,255,255,0.25)', fontSize: 11 },
  whisperMsg: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontStyle: 'italic', lineHeight: 24 },
  responseBox: { backgroundColor: 'rgba(147,51,234,0.08)', padding: 10, borderRadius: 10, marginTop: 10 },
  responseLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  responseText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontStyle: 'italic' },
  replyBox: { marginTop: 12 },
  replyInput: { backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', padding: 12, borderRadius: 12, fontSize: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 8 },
  replyActions: { flexDirection: 'row', gap: 8 },
  replyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 10, borderRadius: 10 },
  revealBtn: { backgroundColor: colors.primary },
  replyBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  whisperActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  whisperActionBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 16 },
  whisperActionText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  ignoreText: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  viewProfileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 8 },
  viewProfileText: { color: colors.primaryLight, fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(147,51,234,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySub: { color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4, textAlign: 'center', maxWidth: 240 },
});
