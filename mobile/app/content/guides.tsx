import { useEffect, useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';
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
            <Markdown style={mdStyles}>{data.bodyMd}</Markdown>
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
  empty: { color: colors.textMuted, fontSize: fontSize.md },
});

const mdStyles = {
  body: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 24 },
  heading1: { color: colors.text, fontSize: 22, fontWeight: '800' as const, marginTop: 24, marginBottom: 8 },
  heading2: { color: colors.text, fontSize: 18, fontWeight: '700' as const, marginTop: 20, marginBottom: 6 },
  paragraph: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 24, marginBottom: 12 },
  link: { color: colors.primaryLight },
  strong: { color: colors.text, fontWeight: '700' as const },
};
