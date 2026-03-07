import { useEffect, useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { contentApi } from '../../src/api/client';
import { colors, spacing, fontSize } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';
import { SafeState } from '../../src/components/ui';

export default function GuidesScreen() {
  const [data, setData] = useState<{ title: string | null; bodyMd: string | null; link: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi.getGuides().then((r) => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PremiumDarkBackground style={s.container}>
        <PageShell>
          <SubPageHeader title="Guides" />
          <SafeState variant="loading" message="Loading guides..." />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={s.container}>
      <PageShell>
        <SubPageHeader title={data?.title || 'Guides'} />
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {data?.bodyMd ? (
            <Text style={s.body}>{data.bodyMd}</Text>
          ) : (
            <Text style={s.empty}>No guides available yet.</Text>
          )}
        </ScrollView>
      </PageShell>
    </PremiumDarkBackground>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 48 },
  body: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 24 },
  empty: { color: colors.textMuted, fontSize: fontSize.md },
});
