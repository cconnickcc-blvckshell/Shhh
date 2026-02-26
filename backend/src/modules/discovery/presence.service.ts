import { query } from '../../config/database';
import { getRedis } from '../../config/redis';
import { emitToUser } from '../../websocket';

export type PresenceState = 'invisible' | 'nearby' | 'browsing' | 'at_venue' | 'at_event' | 'open_to_chat' | 'paused' | 'cooldown';

const DEFAULT_DECAY_MINUTES: Record<PresenceState, number> = {
  invisible: 0,
  nearby: 30,
  browsing: 15,
  at_venue: 120,
  at_event: 240,
  open_to_chat: 60,
  paused: 30,
  cooldown: 15,
};

export class PresenceService {
  async setPresence(userId: string, state: PresenceState, options?: {
    venueId?: string; eventId?: string; decayMinutes?: number;
  }) {
    const decay = options?.decayMinutes || DEFAULT_DECAY_MINUTES[state];
    const expiresAt = new Date(Date.now() + decay * 60 * 1000);

    await query(
      `INSERT INTO presence (user_id, state, venue_id, event_id, expires_at, decay_minutes, affirmed_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         state = $2, venue_id = $3, event_id = $4, expires_at = $5,
         decay_minutes = $6, affirmed_at = NOW(), updated_at = NOW()`,
      [userId, state, options?.venueId || null, options?.eventId || null, expiresAt, decay]
    );

    const redis = getRedis();
    await redis.set(`presence:${userId}`, JSON.stringify({ state, expiresAt: expiresAt.toISOString() }), 'EX', decay * 60);

    return { state, expiresAt: expiresAt.toISOString(), decayMinutes: decay };
  }

  async getPresence(userId: string) {
    const redis = getRedis();
    const cached = await redis.get(`presence:${userId}`);
    if (cached) {
      const data = JSON.parse(cached);
      if (new Date(data.expiresAt) > new Date()) return data;
    }

    const result = await query(
      `SELECT state, venue_id, event_id, expires_at, affirmed_at, decay_minutes
       FROM presence WHERE user_id = $1 AND expires_at > NOW()`,
      [userId]
    );

    if (result.rows.length === 0) return { state: 'invisible' as PresenceState };
    return result.rows[0];
  }

  async reaffirm(userId: string) {
    const current = await query(
      `SELECT state, decay_minutes FROM presence WHERE user_id = $1 AND expires_at > NOW()`,
      [userId]
    );

    if (current.rows.length === 0) return null;

    const { state, decay_minutes } = current.rows[0];
    return this.setPresence(userId, state, { decayMinutes: decay_minutes });
  }

  async goInvisible(userId: string) {
    await query(`DELETE FROM presence WHERE user_id = $1`, [userId]);
    const redis = getRedis();
    await redis.del(`presence:${userId}`);
  }

  async getActiveAtVenue(venueId: string) {
    const result = await query(
      `SELECT p.user_id, p.state, p.affirmed_at, up.display_name, per.display_name as persona_name
       FROM presence p
       JOIN user_profiles up ON p.user_id = up.user_id
       LEFT JOIN personas per ON per.user_id = p.user_id AND per.is_active = true
       WHERE p.venue_id = $1 AND p.expires_at > NOW() AND p.state != 'invisible'
       ORDER BY p.affirmed_at DESC`,
      [venueId]
    );
    return result.rows;
  }

  async decayExpired() {
    const expired = await query(
      `SELECT user_id FROM presence WHERE expires_at <= NOW()`,
    );

    for (const row of expired.rows) {
      emitToUser(row.user_id, 'presence_expired', { message: 'Your presence has expired. Reaffirm to stay visible.' });
    }

    const result = await query(`DELETE FROM presence WHERE expires_at <= NOW() RETURNING user_id`);
    return result.rowCount || 0;
  }
}
