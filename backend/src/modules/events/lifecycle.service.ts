import { query } from '../../config/database';
import { PushService } from '../auth/push.service';
import { logger } from '../../config/logger';

const pushSvc = new PushService();

export class EventLifecycleService {
  async transitionEvents() {
    let transitioned = 0;

    // Discovery phase: events starting within 24h
    const discoveryEvents = await query(
      `UPDATE events SET phase = 'discovery', updated_at = NOW()
       WHERE phase = 'upcoming' AND starts_at <= NOW() + INTERVAL '24 hours' AND starts_at > NOW()
       RETURNING id, title, discovery_radius_km`
    );
    for (const evt of discoveryEvents.rows) {
      const nearbyUsers = await query(
        `SELECT DISTINCT l.user_id FROM locations l
         JOIN users u ON l.user_id = u.id
         WHERE u.is_active = true AND u.deleted_at IS NULL
           AND ST_DWithin(l.geom_point::geography, (
             SELECT ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography
             FROM events e LEFT JOIN venues v ON e.venue_id = v.id WHERE e.id = $1
           ), $2)`,
        [evt.id, (evt.discovery_radius_km || 50) * 1000]
      );

      for (const u of nearbyUsers.rows) {
        await pushSvc.sendPush(u.user_id, 'Event Nearby', `"${evt.title}" is happening soon near you`, { eventId: evt.id });
      }
      transitioned++;
    }

    // Live phase: events that have started
    const liveEvents = await query(
      `UPDATE events SET phase = 'live', status = 'active', updated_at = NOW()
       WHERE phase IN ('discovery', 'upcoming') AND starts_at <= NOW() AND ends_at > NOW()
       RETURNING id, title, venue_id`
    );
    transitioned += liveEvents.rowCount || 0;

    // Winding down: events ending within 1 hour
    await query(
      `UPDATE events SET phase = 'winding_down', updated_at = NOW()
       WHERE phase = 'live' AND ends_at <= NOW() + INTERVAL '1 hour' AND ends_at > NOW()`
    );

    // Post phase: events that have ended
    const endedEvents = await query(
      `UPDATE events SET phase = 'post', status = 'completed', updated_at = NOW()
       WHERE phase IN ('live', 'winding_down') AND ends_at <= NOW()
       RETURNING id, title`
    );

    // Send reference prompts for ended events
    for (const evt of endedEvents.rows) {
      const attendees = await query(
        `SELECT user_id FROM event_rsvps WHERE event_id = $1 AND status = 'checked_in'`,
        [evt.id]
      );
      for (const a of attendees.rows) {
        await pushSvc.sendPush(a.user_id, 'How was the event?', `Leave a reference for people you met at "${evt.title}"`, { eventId: evt.id, action: 'reference_prompt' });
      }

      await query(`UPDATE events SET reference_prompts_sent = true WHERE id = $1`, [evt.id]);
    }

    // Archive: events ended >48h ago
    await query(
      `UPDATE events SET phase = 'archived', updated_at = NOW()
       WHERE phase = 'post' AND ends_at <= NOW() - INTERVAL '48 hours'`
    );

    if (transitioned > 0) {
      logger.info({ transitioned }, 'Event lifecycle transitions');
    }

    return transitioned;
  }
}
