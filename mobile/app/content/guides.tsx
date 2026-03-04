import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { contentApi } from '../../src/api/client';
import { colors, spacing, fontSize } from '../../src/constants/theme';

export default function GuidesScreen() {
  const [data, setData] = useState<{ title: string | null; bodyMd: string | null; link: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi.getGuides().then((r) => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={s.container}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>{data?.title || 'Guides'}</Text>
      </View>
      {data?.bodyMd ? (
        <Text style={s.body}>{data.bodyMd}</Text>
      ) : (
        <Text style={s.empty}>No guides available yet.</Text>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  backBtn: { marginRight: spacing.md },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  body: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 24 },
  empty: { color: colors.textMuted, fontSize: fontSize.md },
});
