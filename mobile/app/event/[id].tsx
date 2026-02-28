import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../src/api/client';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';

const VIBE_LABELS: Record<string, string> = {
  social_mix: 'Social mix',
  lifestyle: 'Lifestyle',
  kink: 'Kink',
  couples_only: 'Couples only',
  newbie_friendly: 'Newbie friendly',
  talk_first: 'Talk first',
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [attending, setAttending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    eventsApi
      .get(id)
      .then((r) => {
        setEvent(r.data);
        setAttending((r.data as any).user_going ?? false);
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  const handleRsvp = async () => {
    if (!id || rsvpLoading) return;
    Vibration.vibrate(10);
    setRsvpLoading(true);
    try {
      await eventsApi.rsvp(id, attending ? 'not_going' : 'going');
      setAttending(!attending);
      if (!attending) Vibration.vibrate([0, 40, 20, 40]);
    } catch {
      // keep state
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading || !event) {
    return (
      <View style={s.container}>
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={s.loadingText}>Loading event…</Text>
        </View>
      </View>
    );
  }

  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : null;
  const vibeLabel = event.vibe_tag ? VIBE_LABELS[event.vibe_tag] || event.vibe_tag : null;

  return (
    <ScrollView style={s.container} bounces={false}>
      {/* Hero */}
      <LinearGradient
        colors={[colors.primarySoft, 'transparent']}
        style={s.hero}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={s.heroContent}>
          <View style={s.dateBadge}>
            <Text style={s.dateDay}>{start.getDate()}</Text>
            <Text style={s.dateMonth}>{start.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
          </View>
          <Text style={s.title}>{event.title}</Text>
          <View style={s.heroMeta}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={s.heroMetaText}>
              {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              {end ? ` – ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
            </Text>
            </View>
          {vibeLabel && (
            <View style={s.vibeTag}>
              <Ionicons name="sparkles" size={12} color={colors.primaryLight} />
              <Text style={s.vibeText}>{vibeLabel}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={s.body}>
        {/* Venue row */}
        {event.venue_name && (
          <TouchableOpacity
            style={s.venueRow}
            onPress={() => event.venue_id && router.push(`/venue/${event.venue_id}`)}
            disabled={!event.venue_id}
            activeOpacity={0.8}
          >
            <View style={s.venueIconWrap}>
              <Ionicons name="location" size={20} color={colors.primaryLight} />
            </View>
            <View style={s.venueTextWrap}>
              <Text style={s.venueLabel}>VENUE</Text>
              <Text style={s.venueName} numberOfLines={1}>{event.venue_name}</Text>
            </View>
            {event.venue_id && (
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        )}

        {/* Attendees */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Ionicons name="people" size={18} color={colors.textSecondary} />
            <Text style={s.statText}>
              {event.attendee_count ?? 0}
              {event.capacity ? ` / ${event.capacity}` : ''} going
            </Text>
          </View>
        </View>

        {/* Description */}
        {event.description && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>ABOUT THIS EVENT</Text>
            <Text style={s.desc}>{event.description}</Text>
          </View>
        )}

        {/* RSVP CTA */}
        <TouchableOpacity
          style={[s.rsvpBtn, attending && s.rsvpBtnActive]}
          onPress={handleRsvp}
          disabled={rsvpLoading}
          activeOpacity={0.85}
        >
          {rsvpLoading ? (
            <ActivityIndicator color={attending ? '#fff' : colors.primaryLight} size="small" />
          ) : (
            <>
              <Ionicons name={attending ? 'heart' : 'heart-outline'} size={22} color={attending ? '#fff' : colors.primaryLight} />
              <Text style={[s.rsvpBtnText, attending && s.rsvpBtnTextActive]}>
                {attending ? "You're going" : 'I\'m going'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120 },
  loadingText: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.md },

  hero: {
    paddingTop: 56,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroContent: { marginTop: spacing.sm },
  dateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dateDay: { color: colors.primaryLight, fontSize: 24, fontWeight: '800', lineHeight: 26 },
  dateMonth: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 32 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  heroMetaText: { color: colors.textSecondary, fontSize: fontSize.md },
  vibeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  vibeText: { color: colors.primaryLight, fontSize: fontSize.xs, fontWeight: '700' },

  body: { padding: spacing.lg },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  venueIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  venueTextWrap: { flex: 1 },
  venueLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  venueName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },

  statsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },

  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  desc: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 24 },

  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderGlow,
    ...shadows.card,
  },
  rsvpBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.glow,
  },
  rsvpBtnText: { color: colors.primaryLight, fontSize: fontSize.lg, fontWeight: '700' },
  rsvpBtnTextActive: { color: colors.textOnPrimary },
});
