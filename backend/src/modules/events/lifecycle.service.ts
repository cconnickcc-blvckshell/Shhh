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

    // Wave 4: Event reminders — 1h before for RSVP'd users
    const hasRemindersTable = await query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_reminders'`
    );
    if (hasRemindersTable.rows.length > 0) {
      const reminderEvents = await query(
        `SELECT e.id, e.title FROM events e
         WHERE e.status IN ('upcoming', 'active') AND e.phase IN ('upcoming', 'discovery')
           AND e.starts_at > NOW() AND e.starts_at <= NOW() + INTERVAL '1 hour 5 minutes'
           AND e.starts_at > NOW() + INTERVAL '55 minutes'`
      );
      for (const evt of reminderEvents.rows) {
        const rsvps = await query(
          `SELECT user_id FROM event_rsvps WHERE event_id = $1 AND status IN ('going', 'checked_in')`,
          [evt.id]
        );
        for (const r of rsvps.rows) {
          const userId = r.user_id as string;
          const sent = await query(
            `SELECT 1 FROM event_reminders WHERE event_id = $1 AND user_id = $2 AND reminder_type = '1h_before'`,
            [evt.id, userId]
          );
          if (sent.rows.length === 0) {
            await pushSvc.sendPush(userId, 'Event starts in 1 hour', `"${evt.title}" is about to begin`, { eventId: evt.id, action: 'event_reminder' });
            await query(
              `INSERT INTO event_reminders (event_id, user_id, reminder_type) VALUES ($1, $2, '1h_before')
               ON CONFLICT (event_id, user_id, reminder_type) DO NOTHING`,
              [evt.id, userId]
            );
          }
        }
      }
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

    // Post-event prompts (one per type per user; event_post_prompts avoids spam)
    const hasPromptTable = await query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_post_prompts'`
    );
    for (const evt of endedEvents.rows) {
      const attendees = await query(
        `SELECT user_id FROM event_rsvps WHERE event_id = $1 AND status IN ('going', 'checked_in')`,
        [evt.id]
      );
      for (const a of attendees.rows) {
        const userId = a.user_id as string;
        if (hasPromptTable.rows.length > 0) {
          const sent = await query(
            `SELECT prompt_type FROM event_post_prompts WHERE event_id = $1 AND user_id = $2`,
            [evt.id, userId]
          );
          const sentTypes = new Set((sent.rows as { prompt_type: string }[]).map(r => r.prompt_type));
          if (!sentTypes.has('reference')) {
            await pushSvc.sendPush(userId, 'How was the event?', `Leave a reference for people you met at "${evt.title}"`, { eventId: evt.id, action: 'reference_prompt' });
            await query(
              `INSERT INTO event_post_prompts (event_id, user_id, prompt_type) VALUES ($1, $2, 'reference') ON CONFLICT DO NOTHING`,
              [evt.id, userId]
            );
          }
          if (!sentTypes.has('keep_chatting')) {
            await pushSvc.sendPush(userId, 'Event ended', 'Keep the conversation going with people you met?', { eventId: evt.id, action: 'keep_chatting' });
            await query(
              `INSERT INTO event_post_prompts (event_id, user_id, prompt_type) VALUES ($1, $2, 'keep_chatting') ON CONFLICT DO NOTHING`,
              [evt.id, userId]
            );
          }
          if (!sentTypes.has('invite_friend')) {
            await pushSvc.sendPush(userId, 'Invite someone who\'d love this', `Share Shhh with friends who\'d enjoy "${evt.title}"`, { eventId: evt.id, action: 'invite_friend' });
            await query(
              `INSERT INTO event_post_prompts (event_id, user_id, prompt_type) VALUES ($1, $2, 'invite_friend') ON CONFLICT DO NOTHING`,
              [evt.id, userId]
            );
          }
        } else {
          await pushSvc.sendPush(userId, 'How was the event?', `Leave a reference for people you met at "${evt.title}"`, { eventId: evt.id, action: 'reference_prompt' });
        }
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
