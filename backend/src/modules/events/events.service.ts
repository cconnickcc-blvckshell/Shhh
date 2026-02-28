import { query } from '../../config/database';
import { hashGeneric } from '../../utils/hash';

export type VibeTag = 'social_mix' | 'lifestyle' | 'kink' | 'couples_only' | 'newbie_friendly';

export class EventsService {
  async createEvent(hostUserId: string, data: {
    title: string;
    description?: string;
    venueId?: string;
    startsAt: string;
    endsAt: string;
    type?: string;
    capacity?: number;
    isPrivate?: boolean;
    vibeTag?: VibeTag;
  }) {
    const hasVibe = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'vibe_tag'`
    );
    const cols = hasVibe.rows.length > 0
      ? 'host_user_id, venue_id, title, description, starts_at, ends_at, type, capacity, is_private, vibe_tag'
      : 'host_user_id, venue_id, title, description, starts_at, ends_at, type, capacity, is_private';
    const vals = hasVibe.rows.length > 0
      ? [hostUserId, data.venueId || null, data.title, data.description || null, data.startsAt, data.endsAt, data.type || 'party', data.capacity || null, data.isPrivate || false, data.vibeTag || null]
      : [hostUserId, data.venueId || null, data.title, data.description || null, data.startsAt, data.endsAt, data.type || 'party', data.capacity || null, data.isPrivate || false];
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const result = await query(
      `INSERT INTO events (${cols}) VALUES (${placeholders}) RETURNING *`,
      vals
    );

    await query(
      `INSERT INTO event_rsvps (event_id, user_id, status) VALUES ($1, $2, 'going')`,
      [result.rows[0].id, hostUserId]
    );

    return result.rows[0];
  }

  async getNearbyEvents(lat: number, lng: number, radiusKm: number = 50, options?: { vibeTag?: VibeTag | null; date?: string }) {
    const vibe = options?.vibeTag ?? null;
    const dateOnly = options?.date ?? null; // YYYY-MM-DD for "tonight" filter
    const hasVibe = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'vibe_tag'`
    );
    const useVibeFilter = hasVibe.rows.length > 0 && vibe;
    const params: (number | string)[] = [lat, lng, radiusKm * 1000];
    let idx = 4;
    const vibeFilter = useVibeFilter ? ` AND e.vibe_tag = $${idx++}` : '';
    if (useVibeFilter) params.push(vibe!);
    const dateFilter = dateOnly ? ` AND (e.starts_at AT TIME ZONE 'UTC')::date = $${idx}::date` : '';
    if (dateOnly) params.push(dateOnly);
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
    return result.rows;
  }

  async getEvent(eventId: string) {
    const result = await query(
      `SELECT e.*, v.name as venue_name,
              COUNT(er.user_id) FILTER (WHERE er.status = 'going') as attendee_count
       FROM events e
       LEFT JOIN venues v ON e.venue_id = v.id
       LEFT JOIN event_rsvps er ON e.id = er.event_id
       WHERE e.id = $1
       GROUP BY e.id, v.name`,
      [eventId]
    );
    return result.rows[0] || null;
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
