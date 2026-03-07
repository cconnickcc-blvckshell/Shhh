import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safetyApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius } from '../../src/constants/theme';
import { PremiumDarkBackground } from '../../src/components/Backgrounds';
import { PageShell, ContentColumn } from '../../src/components/layout';
import { SubPageHeader } from '../../src/components/SubPageHeader';
import { SafeState } from '../../src/components/ui';

interface Contact {
  id: string;
  name: string;
  relationship?: string;
  created_at: string;
}

export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    safetyApi.getContacts().then((r) => setContacts(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim() || phone.replace(/\D/g, '').length < 10) {
      Alert.alert('', 'Please enter a name and valid phone number (at least 10 digits).');
      return;
    }
    setSubmitting(true);
    try {
      await safetyApi.addContact(name.trim(), phone.trim(), relationship.trim() || undefined);
      setName('');
      setPhone('');
      setRelationship('');
      setShowAdd(false);
      load();
    } catch (e: any) {
      Alert.alert('', e.message || 'Could not add contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = (c: Contact) => {
    Alert.alert('Remove contact', `Remove ${c.name} from emergency contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => safetyApi.removeContact(c.id).then(load).catch(() => Alert.alert('', 'Could not remove contact.')),
      },
    ]);
  };

  if (loading) {
    return (
      <PremiumDarkBackground style={s.wrapper}>
        <PageShell>
          <SafeState variant="loading" message="Loading contacts..." />
        </PageShell>
      </PremiumDarkBackground>
    );
  }

  return (
    <PremiumDarkBackground style={s.wrapper}>
      <PageShell>
        <ContentColumn>
          <SubPageHeader title="Emergency Contacts" subtitle="These contacts will be notified when you use Panic Alert." />
          <ScrollView style={s.container} contentContainerStyle={s.scrollContent} bounces={false}>
          {contacts.length >= 5 && (
            <View style={s.capNote}>
              <Ionicons name="information-circle" size={18} color={colors.textMuted} />
              <Text style={s.capText}>Maximum 5 contacts. Remove one to add another.</Text>
            </View>
          )}

          {contacts.map((c) => (
            <View key={c.id} style={s.card}>
              <View style={s.cardBody}>
                <View style={s.avatar}>
                  <Ionicons name="person" size={20} color={colors.primaryLight} />
                </View>
                <View style={s.cardText}>
                  <Text style={s.contactName}>{c.name}</Text>
                  {c.relationship && <Text style={s.contactRel}>{c.relationship}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleRemove(c)} style={s.removeBtn} hitSlop={12}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {!showAdd && contacts.length < 5 && (
            <TouchableOpacity style={s.addCard} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
              <Ionicons name="add-circle-outline" size={28} color={colors.primaryLight} />
              <Text style={s.addCardText}>Add contact</Text>
            </TouchableOpacity>
          )}

          {showAdd && (
            <View style={s.form}>
              <Text style={s.formLabel}>NAME</Text>
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.textMuted} />
              <Text style={s.formLabel}>PHONE</Text>
              <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholder="+1 (555) 000-0000" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
              <Text style={s.formLabel}>RELATIONSHIP (optional)</Text>
              <TextInput style={s.input} value={relationship} onChangeText={setRelationship} placeholder="e.g. Partner, Friend" placeholderTextColor={colors.textMuted} />
              <View style={s.formRow}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowAdd(false); setName(''); setPhone(''); setRelationship(''); }}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleAdd} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveText}>Add</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {contacts.length === 0 && !showAdd && (
            <View style={s.empty}>
              <Ionicons name="call-outline" size={40} color={colors.textMuted} />
              <Text style={s.emptyText}>No emergency contacts yet.</Text>
              <Text style={s.emptySub}>Add at least one for when emergency notification is available.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => setShowAdd(true)}>
                <Text style={s.emptyBtnText}>Add your first contact</Text>
              </TouchableOpacity>
            </View>
          )}
          </ScrollView>
        </ContentColumn>
      </PageShell>
    </PremiumDarkBackground>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  capNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: borderRadius.sm },
  capText: { color: colors.textMuted, fontSize: fontSize.xs },
  card: { backgroundColor: colors.surface, marginBottom: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
  cardBody: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cardText: { flex: 1 },
  contactName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  contactRel: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  removeBtn: { padding: spacing.xs },
  addCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.sm, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 2, borderColor: colors.borderGlow, borderStyle: 'dashed' },
  addCardText: { color: colors.primaryLight, fontSize: fontSize.md, fontWeight: '600' },
  form: { marginTop: spacing.lg, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
  formLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  input: { backgroundColor: colors.background, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: 12, borderRadius: borderRadius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  formRow: { flexDirection: 'row', gap: 12, marginTop: spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: colors.primary },
  saveText: { color: '#fff', fontWeight: '700' },
  empty: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 48 },
  emptyText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600', marginTop: spacing.md },
  emptySub: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 6, textAlign: 'center' },
  emptyBtn: { marginTop: spacing.xl, paddingVertical: 14, paddingHorizontal: spacing.xl, backgroundColor: colors.primary, borderRadius: borderRadius.lg },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
