import crypto from 'crypto';
import { query } from '../../config/database';

function hashValue(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex');
}

export class VenueIdentityService {
  async claimVenue(venueId: string, email: string, contactName: string, phone: string) {
    const existing = await query(
      `SELECT venue_id FROM venue_accounts WHERE venue_id = $1 AND is_claimed = true`,
      [venueId]
    );
    if (existing.rows.length > 0) {
      throw Object.assign(new Error('Venue already claimed'), { statusCode: 409 });
    }

    await query(
      `INSERT INTO venue_accounts (venue_id, email_hash, contact_name, contact_phone_hash, is_claimed, claimed_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       ON CONFLICT (venue_id) DO UPDATE SET
         email_hash = $2, contact_name = $3, contact_phone_hash = $4,
         is_claimed = true, claimed_at = NOW()`,
      [venueId, hashValue(email), contactName, hashValue(phone)]
    );
  }

  async createAnnouncement(venueId: string, data: {
    title: string; body?: string; type?: string;
    expiresInHours: number; targetRadiusKm?: number;
  }) {
    const expiresAt = new Date(Date.now() + data.expiresInHours * 3600 * 1000);

    const result = await query(
      `INSERT INTO venue_announcements (venue_id, title, body, type, expires_at, target_radius_km)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [venueId, data.title, data.body || null, data.type || 'announcement', expiresAt, data.targetRadiusKm || 50]
    );
    return result.rows[0];
  }

  async getActiveAnnouncements(lat: number, lng: number, radiusKm: number = 50) {
    const result = await query(
      `SELECT va.*, v.name as venue_name, v.lat, v.lng,
              ST_Distance(
                ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography,
                ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
              ) / 1000 as distance_km
       FROM venue_announcements va
       JOIN venues v ON va.venue_id = v.id
       WHERE va.is_active = true AND va.expires_at > NOW()
         AND ST_DWithin(
           ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
           $3
         )
       ORDER BY distance_km ASC, va.created_at DESC
       LIMIT 20`,
      [lat, lng, radiusKm * 1000]
    );
    return result.rows;
  }

  async checkIn(venueId: string, userId: string, options?: { anonymousMode?: boolean }) {
    const active = await query(
      `SELECT id FROM venue_checkins WHERE venue_id = $1 AND user_id = $2 AND checked_out_at IS NULL`,
      [venueId, userId]
    );
    if (active.rows.length > 0) {
      return { alreadyCheckedIn: true, checkinId: active.rows[0].id };
    }

    const hasAnonymousCol = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'venue_checkins' AND column_name = 'anonymous_mode'`
    );
    const anonymousMode = options?.anonymousMode !== false;
    const result = hasAnonymousCol.rows.length > 0
      ? await query(
          `INSERT INTO venue_checkins (venue_id, user_id, anonymous_mode) VALUES ($1, $2, $3) RETURNING id, checked_in_at`,
          [venueId, userId, anonymousMode]
        )
      : await query(
          `INSERT INTO venue_checkins (venue_id, user_id) VALUES ($1, $2) RETURNING id, checked_in_at`,
          [venueId, userId]
        );
    return { alreadyCheckedIn: false, ...result.rows[0] };
  }

  async checkOut(venueId: string, userId: string) {
    await query(
      `UPDATE venue_checkins SET checked_out_at = NOW()
       WHERE venue_id = $1 AND user_id = $2 AND checked_out_at IS NULL`,
      [venueId, userId]
    );
  }

  async getVenueAttendees(venueId: string) {
    const result = await query(
      `SELECT vc.user_id, vc.checked_in_at, up.display_name,
              per.display_name as persona_name, per.type as persona_type
       FROM venue_checkins vc
       JOIN user_profiles up ON vc.user_id = up.user_id
       LEFT JOIN personas per ON per.user_id = vc.user_id AND per.is_active = true
       WHERE vc.venue_id = $1 AND vc.checked_out_at IS NULL AND vc.is_visible = true
       ORDER BY vc.checked_in_at DESC`,
      [venueId]
    );
    return result.rows;
  }

  /** Privacy-safe grid: tiles with persona/badges or anonymous. No user ids exposed. */
  async getVenueGrid(venueId: string): Promise<Array<{ anonymous: true; distanceBucket: string } | { personaType: string; personaDisplayName: string | null; badges: string[]; distanceBucket: string }>> {
    const hasAnonymousCol = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'venue_checkins' AND column_name = 'anonymous_mode'`
    );
    const selectAnonymous = hasAnonymousCol.rows.length > 0 ? 'vc.anonymous_mode' : 'true AS anonymous_mode';

    const result = await query(
      `SELECT ${selectAnonymous}, per.type as persona_type, per.display_name as persona_name, u.verification_tier
       FROM venue_checkins vc
       LEFT JOIN personas per ON per.user_id = vc.user_id AND per.is_active = true
       LEFT JOIN users u ON vc.user_id = u.id
       WHERE vc.venue_id = $1 AND vc.checked_out_at IS NULL AND vc.is_visible = true
       ORDER BY vc.checked_in_at DESC`,
      [venueId]
    );

    const tierToBadges = (tier: number | null): string[] => {
      if (tier == null || tier < 1) return [];
      if (tier >= 3) return ['trusted'];
      if (tier >= 2) return ['id_verified'];
      return ['verified'];
    };

    return result.rows.map((r: { anonymous_mode?: boolean; persona_type: string | null; persona_name: string | null; verification_tier: number | null }) => {
      const anonymous = r.anonymous_mode !== false;
      const distanceBucket = 'here';
      if (anonymous) {
        return { anonymous: true as const, distanceBucket };
      }
      return {
        personaType: r.persona_type || 'solo',
        personaDisplayName: r.persona_name || null,
        badges: tierToBadges(r.verification_tier),
        distanceBucket,
      };
    });
  }

  async getVenueStats(venueId: string) {
    const [current, total, events] = await Promise.all([
      query(`SELECT COUNT(*) as cnt FROM venue_checkins WHERE venue_id = $1 AND checked_out_at IS NULL`, [venueId]),
      query(`SELECT COUNT(DISTINCT user_id) as cnt FROM venue_checkins WHERE venue_id = $1`, [venueId]),
      query(`SELECT COUNT(*) as cnt FROM events WHERE venue_id = $1 AND status IN ('upcoming', 'active')`, [venueId]),
    ]);

    return {
      currentAttendees: parseInt(current.rows[0].cnt),
      totalVisitors: parseInt(total.rows[0].cnt),
      upcomingEvents: parseInt(events.rows[0].cnt),
    };
  }

  async createChatRoom(venueId: string, name: string, eventId?: string, autoCloseHours?: number) {
    const autoClose = autoCloseHours ? new Date(Date.now() + autoCloseHours * 3600 * 1000) : null;

    const result = await query(
      `INSERT INTO venue_chat_rooms (venue_id, event_id, name, auto_close_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [venueId, eventId || null, name, autoClose]
    );
    return result.rows[0];
  }

  async getActiveChatRooms(venueId: string) {
    const result = await query(
      `SELECT * FROM venue_chat_rooms
       WHERE venue_id = $1 AND is_active = true
         AND (auto_close_at IS NULL OR auto_close_at > NOW())
       ORDER BY created_at DESC`,
      [venueId]
    );
    return result.rows;
  }

  async trackAnnouncementView(announcementId: string) {
    await query(`UPDATE venue_announcements SET views = views + 1 WHERE id = $1`, [announcementId]);
  }

  async trackAnnouncementTap(announcementId: string) {
    await query(`UPDATE venue_announcements SET taps = taps + 1 WHERE id = $1`, [announcementId]);
  }
}
