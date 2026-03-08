import { query } from '../../config/database';

/** Product analytics events for density/trigger metrics. No PII in payload. */
export class AnalyticsService {
  async track(
    eventType: string,
    userId: string | null,
    payload?: Record<string, unknown>
  ) {
    await query(
      `INSERT INTO analytics_events (event_type, user_id, payload_json)
       VALUES ($1, $2, $3)`,
      [eventType, userId, payload ? JSON.stringify(payload) : null]
    );
  }
}
