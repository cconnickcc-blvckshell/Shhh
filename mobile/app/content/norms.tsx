import { useEffect, useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { contentApi } from '../../src/api/client';
import { colors, spacing, fontSize } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';
import { SafeState } from '../../src/components/ui';

export default function NormsScreen() {
  const [data, setData] = useState<{ title: string | null; bodyMd: string | null; link: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi.getNorms().then((r) => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PremiumDarkBackground style={s.container}>
        <PageShell>
          <SubPageHeader title="Community Norms" />
          <SafeState variant="loading" message="Loading norms..." />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={s.container}>
      <PageShell>
        <SubPageHeader title={data?.title || 'Community Norms'} />
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {data?.bodyMd ? (
            <Text style={s.body}>{data.bodyMd}</Text>
          ) : (
            <Text style={s.empty}>No norms available yet.</Text>
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
