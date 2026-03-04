import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { groupsApi } from '../../src/api/client';
import { colors, spacing, fontSize } from '../../src/constants/theme';
import { mapApiError } from '../../src/utils/errorMapper';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';

export default function GroupsScreen() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = () => {
    setLoadError(null);
    groupsApi.list().then((r) => { setGroups(r.data || []); setLoadError(null); }).catch((e) => { setLoadError(mapApiError(e)); setGroups([]); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleJoin = async (id: string) => {
    try {
      await groupsApi.join(id);
      load();
    } catch (e: any) {
      Alert.alert('', mapApiError(e));
    }
  };

  if (loading && groups.length === 0) {
    return (
      <PremiumDarkBackground style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={s.title}>Groups</Text>
        </View>
        <ActivityIndicator color={colors.primaryLight} style={{ marginTop: 48 }} />
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Groups</Text>
      </View>
      {loadError && groups.length === 0 ? (
        <View style={s.errorWrap}>
          <Text style={s.errorText}>{loadError}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}><Text style={s.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(i) => i.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => router.push(`/groups/${item.id}`)} activeOpacity={0.8}>
              <View style={s.cardIcon}>
                <Ionicons name="people" size={24} color={colors.primaryLight} />
              </View>
              <View style={s.cardContent}>
                <Text style={s.cardTitle}>{item.name}</Text>
                {item.description && <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyText}>No groups yet</Text>
              <Text style={s.emptySub}>Join groups to see events and connect.</Text>
            </View>
          }
        />
      )}
    </PremiumDarkBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: 50, paddingBottom: spacing.md },
  backBtn: { marginRight: spacing.md },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  list: { padding: spacing.lg, paddingBottom: 48 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cardContent: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  cardDesc: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 4 },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: colors.text, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.lg, marginTop: 16 },
  emptySub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 8 },
});
