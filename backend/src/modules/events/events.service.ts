import { query } from '../../config/database';
import { hashGeneric } from '../../utils/hash';

export type VibeTag = 'social_mix' | 'lifestyle' | 'kink' | 'couples_only' | 'newbie_friendly' | 'talk_first';

export class EventsService {
  async createEvent(hostUserId: string, data: {
    title: string;
    description?: string;
    venueId?: string;
    seriesId?: string;
    startsAt: string;
    endsAt: string;
    type?: string;
    capacity?: number;
    isPrivate?: boolean;
    vibeTag?: VibeTag;
    locationRevealedAfterRsvp?: boolean;
    visibilityRule?: 'open' | 'tier_min' | 'invite_only' | 'attended_2_plus';
    visibilityTierMin?: number;
    visibilityRadiusKm?: number;
  }) {
    const [hasVibe, hasLocationRevealed, hasVisibility, hasSeriesId] = await Promise.all([
      query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'vibe_tag'`),
      query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location_revealed_after_rsvp'`),
      query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'visibility_rule'`),
      query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'series_id'`),
    ]);
    const cols: string[] = ['host_user_id', 'venue_id', 'title', 'description', 'starts_at', 'ends_at', 'type', 'capacity', 'is_private'];
    const vals: unknown[] = [hostUserId, data.venueId || null, data.title, data.description || null, data.startsAt, data.endsAt, data.type || 'party', data.capacity || null, data.isPrivate || false];
    if (hasVibe.rows.length > 0) { cols.push('vibe_tag'); vals.push(data.vibeTag ?? null); }
    if (hasLocationRevealed.rows.length > 0) { cols.push('location_revealed_after_rsvp'); vals.push(data.locationRevealedAfterRsvp ?? false); }
    if (hasVisibility.rows.length > 0) {
      cols.push('visibility_rule', 'visibility_tier_min', 'visibility_radius_km');
      vals.push(data.visibilityRule ?? 'open', data.visibilityTierMin ?? null, data.visibilityRadiusKm ?? null);
    }
    if (hasSeriesId.rows.length > 0 && data.seriesId) { cols.push('series_id'); vals.push(data.seriesId); }
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const result = await query(
      `INSERT INTO events (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals
    );

    await query(
      `INSERT INTO event_rsvps (event_id, user_id, status) VALUES ($1, $2, 'going')`,
      [result.rows[0].id, hostUserId]
    );

    return result.rows[0];
  }

  async getNearbyEvents(lat: number, lng: number, radiusKm: number = 50, options?: {
    vibeTag?: VibeTag | null;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    viewerUserId?: string;
  }) {
    const vibe = options?.vibeTag ?? null;
    const dateOnly = options?.date ?? null;
    const dateFrom = options?.dateFrom ?? null;
    const dateTo = options?.dateTo ?? null;
    const viewerUserId = options?.viewerUserId ?? null;
    const hasVibe = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'vibe_tag'`
    );
    const useVibeFilter = hasVibe.rows.length > 0 && vibe;
    const params: (number | string)[] = [lat, lng, radiusKm * 1000];
    let idx = 4;
    const vibeFilter = useVibeFilter ? ` AND e.vibe_tag = $${idx++}` : '';
    if (useVibeFilter) params.push(vibe!);
    let dateFilter = '';
    if (dateOnly) {
      dateFilter = ` AND (e.starts_at AT TIME ZONE 'UTC')::date = $${idx}::date`;
      params.push(dateOnly);
      idx++;
    } else if (dateFrom && dateTo) {
      dateFilter = ` AND e.starts_at >= $${idx}::timestamptz AND e.starts_at <= $${idx + 1}::timestamptz`;
      params.push(dateFrom, dateTo);
      idx += 2;
    }
    const result = await query(
      `SELECT e.*, v.name as venue_name, v.lat as venue_lat, v.lng as venue_lng,
              COUNT(er.user_id) FILTER (WHERE er.status = 'going') as attendee_count
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       LEFT JOIN event_rsvps er ON e.id = er.event_id
       WHERE e.status IN ('upcoming', 'active')
         AND e.starts_at > NOW()
         AND (v.id IS NULL OR (
           ST_DWithin(
             ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography,
             ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
             $3
           )
         ))${vibeFilter}${dateFilter}
       GROUP BY e.id, v.name, v.lat, v.lng
       ORDER BY e.starts_at ASC
       LIMIT 50`,
      params
    );
    let rows = result.rows;
    if (viewerUserId) {
      const viewer = await this.getViewerContext(viewerUserId);
      rows = rows.filter((e: Record<string, unknown>) => this.canUserSeeEvent(e, viewer, lat, lng));
      const hasLocationRevealed = await query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location_revealed_after_rsvp'`
      );
      if (hasLocationRevealed.rows.length > 0) {
        const rsvps = await query(
          `SELECT event_id FROM event_rsvps WHERE user_id = $1 AND status IN ('going', 'checked_in')`,
          [viewerUserId]
        );
        const goingSet = new Set(rsvps.rows.map((r: { event_id: string }) => r.event_id));
        rows = rows.map((e: Record<string, unknown>) => {
          if (e.location_revealed_after_rsvp && !goingSet.has(e.id as string))
            return { ...e, venue_name: 'Location revealed after RSVP', venue_lat: null, venue_lng: null };
          return e;
        });
      }
    }
    return rows;
  }

  /** Events the current user is hosting (for host dashboard). */
  async getMyHostedEvents(userId: string) {
    const result = await query(
      `SELECT e.*, v.name as venue_name,
              COUNT(er.user_id) FILTER (WHERE er.status IN ('going', 'checked_in')) as attendee_count
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       LEFT JOIN event_rsvps er ON e.id = er.event_id
       WHERE e.host_user_id = $1
       GROUP BY e.id, v.name
       ORDER BY e.starts_at ASC
       LIMIT 100`,
      [userId]
    );
    return result.rows;
  }

  async getEvent(eventId: string, options?: { userId?: string }) {
    const hasLocationRevealed = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location_revealed_after_rsvp'`
    );
    const selectVenueCoords = hasLocationRevealed.rows.length > 0
      ? ', v.lat as venue_lat, v.lng as venue_lng'
      : '';
    const groupByVenue = hasLocationRevealed.rows.length > 0 ? ', v.lat, v.lng' : '';
    const result = await query(
      `SELECT e.*, v.name as venue_name${selectVenueCoords},
              COUNT(er.user_id) FILTER (WHERE er.status = 'going') as attendee_count
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       LEFT JOIN event_rsvps er ON e.id = er.event_id
       WHERE e.id = $1
       GROUP BY e.id, v.name${groupByVenue}`,
      [eventId]
    );
    let event = result.rows[0] || null;
    if (!event) return null;
    if (!options?.userId) return event;

    const viewerContext = await this.getViewerContext(options.userId);
    if (!this.canUserSeeEvent(event, viewerContext, undefined, undefined)) {
      throw Object.assign(new Error('You do not have access to this event'), { statusCode: 403 });
    }

    if (event.location_revealed_after_rsvp) {
      const rsvp = await query(
        `SELECT status FROM event_rsvps WHERE event_id = $1 AND user_id = $2`,
        [eventId, options.userId]
      );
      const goingOrCheckedIn = rsvp.rows[0] && ['going', 'checked_in'].includes(rsvp.rows[0].status);
      if (!goingOrCheckedIn) {
        event = { ...event, venue_name: 'Location revealed after RSVP', venue_lat: null, venue_lng: null };
      }
    }
    return event;
  }

  /** Viewer's tier and attended-event count for visibility rules. */
  async getViewerContext(userId: string): Promise<{ tier: number; attendedCount: number }> {
    const [userRow, countRow] = await Promise.all([
      query(`SELECT verification_tier FROM users WHERE id = $1`, [userId]),
      query(
        `SELECT COUNT(DISTINCT event_id)::int as cnt FROM event_rsvps WHERE user_id = $1 AND status IN ('going', 'checked_in')`,
        [userId]
      ),
    ]);
    return {
      tier: userRow.rows[0]?.verification_tier ?? 0,
      attendedCount: countRow.rows[0]?.cnt ?? 0,
    };
  }

  /** Whether the viewer can see this event (visibility_rule, tier, radius, attended_2_plus). */
  canUserSeeEvent(
    event: Record<string, unknown>,
    viewer: { tier: number; attendedCount: number },
    viewerLat?: number,
    viewerLng?: number
  ): boolean {
    const rule = (event.visibility_rule as string) || 'open';
    if (rule === 'invite_only') return false;
    if (rule === 'tier_min') {
      const min = event.visibility_tier_min as number | undefined;
      if (min != null && viewer.tier < min) return false;
    }
    if (rule === 'attended_2_plus' && viewer.attendedCount < 2) return false;
    const radiusKm = event.visibility_radius_km as number | undefined;
    if (radiusKm != null && viewerLat != null && viewerLng != null && event.venue_lat != null && event.venue_lng != null) {
      const R = 6371;
      const dLat = (event.venue_lat as number - viewerLat) * Math.PI / 180;
      const dLon = (event.venue_lng as number - viewerLng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(viewerLat * Math.PI/180) * Math.cos((event.venue_lat as number) * Math.PI/180) * Math.sin(dLon/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      if (R * c > radiusKm) return false;
    }
    return true;
  }

  async rsvp(eventId: string, userId: string, status: string) {
    await query(
      `INSERT INTO event_rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3`,
      [eventId, userId, status]
    );
    return this.getEvent(eventId);
  }

  async checkIn(eventId: string, userId: string) {
    await query(
      `UPDATE event_rsvps SET status = 'checked_in', arrived_at = NOW()
       WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
  }

  /** Privacy-safe list: persona + badges, no user ids. */
  async getEventAttendees(eventId: string): Promise<Array<{ personaType: string; personaDisplayName: string | null; badges: string[] }>> {
    const result = await query(
      `SELECT per.type as persona_type, per.display_name as persona_name, u.verification_tier
       FROM event_rsvps er
       LEFT JOIN personas per ON per.user_id = er.user_id AND per.is_active = true
       LEFT JOIN users u ON er.user_id = u.id
       WHERE er.event_id = $1 AND er.status IN ('going', 'checked_in')
       ORDER BY er.arrived_at ASC NULLS LAST, er.created_at ASC`,
      [eventId]
    );
    const tierToBadges = (tier: number | null): string[] => {
      if (tier == null || tier < 1) return [];
      if (tier >= 3) return ['trusted'];
      if (tier >= 2) return ['id_verified'];
      return ['verified'];
    };
    return result.rows.map((r: { persona_type: string | null; persona_name: string | null; verification_tier: number | null }) => ({
      personaType: r.persona_type || 'solo',
      personaDisplayName: r.persona_name || null,
      badges: tierToBadges(r.verification_tier),
    }));
  }

  /** Chat rooms linked to this event (venue_chat_rooms where event_id = eventId). */
  async getEventChatRooms(eventId: string) {
    const result = await query(
      `SELECT id, venue_id, event_id, name, is_active, auto_close_at, created_at
       FROM venue_chat_rooms
       WHERE event_id = $1 AND is_active = true
         AND (auto_close_at IS NULL OR auto_close_at > NOW())
       ORDER BY created_at DESC`,
      [eventId]
    );
    return result.rows;
  }

  /** Set door code for at-door validation (host or venue staff only). Code stored as hash. */
  async setDoorCode(eventId: string, userId: string, code: string, expiresAt?: string) {
    const event = await query(
      `SELECT e.id, e.host_user_id, e.venue_id FROM events e WHERE e.id = $1`,
      [eventId]
    );
    if (event.rows.length === 0) throw Object.assign(new Error('Event not found'), { statusCode: 404 });
    const e = event.rows[0];
    if (e.host_user_id !== userId) {
      if (!e.venue_id) throw Object.assign(new Error('Only event host can set door code'), { statusCode: 403 });
      const staff = await query(
        `SELECT 1 FROM venue_staff WHERE venue_id = $1 AND user_id = $2 AND is_active = true`,
        [e.venue_id, userId]
      );
      if (staff.rows.length === 0) throw Object.assign(new Error('Only event host or venue staff can set door code'), { statusCode: 403 });
    }
    const hasCol = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'door_code_hash'`
    );
    if (hasCol.rows.length === 0) throw Object.assign(new Error('Door code feature not available'), { statusCode: 501 });
    const normalized = code.trim().toUpperCase();
    if (normalized.length < 4) throw Object.assign(new Error('Code must be at least 4 characters'), { statusCode: 400 });
    const hash = hashGeneric(normalized);
    await query(
      `UPDATE events SET door_code_hash = $2, door_code_expires_at = $3, updated_at = NOW() WHERE id = $1`,
      [eventId, hash, expiresAt || null]
    );
    return this.getEvent(eventId);
  }

  /** Validate door code and grant in-app access (RSVP + check-in). Rate-limit caller. */
  async validateDoorCode(eventId: string, code: string, userId: string) {
    const hasCol = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'door_code_hash'`
    );
    if (hasCol.rows.length === 0) throw Object.assign(new Error('Door code feature not available'), { statusCode: 501 });
    const event = await query(
      `SELECT id, door_code_hash, door_code_expires_at, status FROM events WHERE id = $1`,
      [eventId]
    );
    if (event.rows.length === 0) throw Object.assign(new Error('Event not found'), { statusCode: 404 });
    const e = event.rows[0] as { door_code_hash: string | null; door_code_expires_at: string | null; status: string };
    if (!e.door_code_hash) throw Object.assign(new Error('No door code set for this event'), { statusCode: 400 });
    if (e.door_code_expires_at && new Date(e.door_code_expires_at) < new Date()) throw Object.assign(new Error('Door code has expired'), { statusCode: 400 });
    const hash = hashGeneric(code.trim().toUpperCase());
    if (hash !== e.door_code_hash) throw Object.assign(new Error('Invalid door code'), { statusCode: 403 });
    await query(
      `INSERT INTO event_rsvps (event_id, user_id, status, arrived_at)
       VALUES ($1, $2, 'checked_in', NOW())
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'checked_in', arrived_at = NOW()`,
      [eventId, userId]
    );
    return this.getEvent(eventId);
  }
}
