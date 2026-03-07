import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { complianceApi } from '../../src/api/client';
import { useAuthStore } from '../../src/stores/auth';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell, Card, SectionLabel } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';

export default function PrivacyDataScreen() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const clearSession = useAuthStore((s) => s.clearSession);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await complianceApi.dataExport();
      const msg = (res as any).data?.message ?? 'Your data export has been requested. You will receive a link when it is ready.';
      Alert.alert('Data export', msg);
    } catch (e: any) {
      Alert.alert('', e.message || 'Request failed. Try again later.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeletion = () => {
    Alert.alert(
      'Delete account',
      'This will request permanent deletion of your account and data. You may need to confirm via email or in-app. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request deletion',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await complianceApi.requestDeletion();
              Alert.alert('Request received', 'Account deletion has been requested. You will be signed out.', [
                { text: 'OK', onPress: () => clearSession() },
              ]);
            } catch (e: any) {
              Alert.alert('', e.message || 'Request failed. Try again later.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <PremiumDarkBackground style={s.wrapper}>
      <PageShell>
        <SubPageHeader title="Privacy & Data" subtitle="Control your data and account." />
        <ScrollView style={s.container} contentContainerStyle={s.scrollContent} bounces={false}>
          <Card style={s.card}>
            <SectionLabel>YOUR DATA</SectionLabel>
            <TouchableOpacity style={s.row} onPress={handleExport} disabled={exporting} activeOpacity={0.8}>
          <View style={s.iconWrap}>
            <Ionicons name="download-outline" size={22} color={colors.primaryLight} />
          </View>
          <View style={s.rowText}>
            <Text style={s.rowTitle}>Export my data</Text>
            <Text style={s.rowSub}>Download a copy of your data</Text>
          </View>
          {exporting ? <ActivityIndicator color={colors.primaryLight} size="small" /> : <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
        </TouchableOpacity>
          </Card>

          <Card style={s.card}>
            <SectionLabel>ACCOUNT</SectionLabel>
            <TouchableOpacity style={[s.row, s.rowDanger]} onPress={handleDeletion} disabled={deleting} activeOpacity={0.8}>
          <View style={[s.iconWrap, s.iconWrapDanger]}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </View>
          <View style={s.rowText}>
            <Text style={[s.rowTitle, { color: colors.danger }]}>Delete account</Text>
            <Text style={s.rowSub}>Permanently delete your account and data</Text>
          </View>
          {deleting ? <ActivityIndicator color={colors.danger} size="small" /> : <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
        </TouchableOpacity>
          </Card>

          <View style={s.footer}>
            <Text style={s.footerText}>Data is processed in line with our privacy policy. Contact support for questions.</Text>
          </View>
        </ScrollView>
      </PageShell>
    </PremiumDarkBackground>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
  rowDanger: { borderColor: 'rgba(239,68,68,0.2)' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  iconWrapDanger: { backgroundColor: 'rgba(239,68,68,0.12)' },
  rowText: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  rowSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  footer: { paddingTop: spacing.lg },
  footerText: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 18 },
});
