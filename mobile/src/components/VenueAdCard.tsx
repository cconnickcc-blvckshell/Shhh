import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../api/client';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

interface Props {
  ad: {
    id: string;
    venue_id: string;
    headline: string;
    body?: string;
    venue_name?: string;
    venue_lat?: number;
    venue_lng?: number;
    logo_url?: string;
    cta_text?: string;
  };
  onDismiss?: () => void;
}

export function VenueAdCard({ ad, onDismiss }: Props) {
  const handleTap = async () => {
    api(`/v1/ads/${ad.id}/tap`, { method: 'POST' }).catch(() => {});
    if (ad.venue_id) router.push(`/venue/${ad.venue_id}`);
  };

  const handleDismiss = async () => {
    api(`/v1/ads/${ad.id}/dismiss`, { method: 'POST' }).catch(() => {});
    onDismiss?.();
  };

  return (
    <TouchableOpacity style={s.card} onPress={handleTap} activeOpacity={0.85}>
      <View style={s.inner}>
        <View style={s.iconWrap}>
          <Ionicons name="sparkles" size={18} color={colors.primaryLight} />
        </View>
        <View style={s.content}>
          <View style={s.topRow}>
            <Text style={s.badge}>Promoted</Text>
            {ad.venue_name && <Text style={s.venueName}>{ad.venue_name}</Text>}
          </View>
          <Text style={s.headline}>{ad.headline}</Text>
          {ad.body && <Text style={s.body} numberOfLines={1}>{ad.body}</Text>}
        </View>
        <TouchableOpacity onPress={handleDismiss} style={s.dismissBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={14} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 1,
    marginBottom: 1.5,
    backgroundColor: 'rgba(147,51,234,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(147,51,234,0.2)',
    overflow: 'hidden',
  },
  inner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(147,51,234,0.15)', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  badge: { fontSize: 9, fontWeight: '800', color: 'rgba(147,51,234,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 },
  venueName: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  headline: { fontSize: 14, fontWeight: '700', color: '#fff' },
  body: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  dismissBtn: { padding: 4 },
});
