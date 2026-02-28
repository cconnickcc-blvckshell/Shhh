import crypto from 'crypto';
import { query } from '../../config/database';
import { emitToUser } from '../../websocket';

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export class SafetyService {
  async addEmergencyContact(userId: string, name: string, phone: string, relationship?: string) {
    const count = await query('SELECT COUNT(*) as cnt FROM emergency_contacts WHERE user_id = $1', [userId]);
    if (parseInt(count.rows[0].cnt) >= 5) {
      throw Object.assign(new Error('Maximum 5 emergency contacts'), { statusCode: 400 });
    }

    const result = await query(
      `INSERT INTO emergency_contacts (user_id, name, phone_hash, relationship)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, name, hashValue(phone), relationship || null]
    );
    return result.rows[0];
  }

  async getEmergencyContacts(userId: string) {
    const result = await query(
      `SELECT id, name, relationship, created_at FROM emergency_contacts WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  }

  async removeEmergencyContact(userId: string, contactId: string) {
    await query('DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2', [contactId, userId]);
  }

  async checkIn(userId: string, type: 'arrived' | 'periodic' | 'departed', eventId?: string, lat?: number, lng?: number, nextCheckInMinutes?: number) {
    const location = lat && lng ? `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)` : 'NULL';
    const expectedNext = nextCheckInMinutes
      ? new Date(Date.now() + nextCheckInMinutes * 60 * 1000)
      : null;

    const result = await query(
      `INSERT INTO safety_checkins (user_id, event_id, type, location, expected_next_at, responded_at)
       VALUES ($1, $2, $3, ${location}, $4, NOW()) RETURNING id, created_at`,
      [userId, eventId || null, type, expectedNext]
    );

    return result.rows[0];
  }

  async panic(userId: string, lat?: number, lng?: number) {
    const location = lat && lng ? `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)` : 'NULL';

    const checkin = await query(
      `INSERT INTO safety_checkins (user_id, type, location, responded_at, alert_sent)
       VALUES ($1, 'panic', ${location}, NOW(), true) RETURNING id`,
      [userId]
    );

    const contacts = await this.getEmergencyContacts(userId);
    // Note: SMS/push notification to emergency contacts is not yet implemented. When implemented,
    // send alert (and optionally lat/lng) to each contact's phone or push token; then set contactsNotified.
    await query(
      `INSERT INTO audit_logs (user_id, action, gdpr_category, metadata_json)
       VALUES ($1, 'safety.panic_triggered', 'safety', $2)`,
      [userId, JSON.stringify({ emergencyContactsOnFile: contacts.length, lat, lng, notificationsSent: false })]
    );

    return {
      checkinId: checkin.rows[0].id,
      contactsNotified: 0,
      emergencyContactsOnFile: contacts.length,
      message: 'Panic recorded. Notifications to emergency contacts are not yet sent (feature deferred).',
    };
  }

  /** Record a screenshot report (e.g. from mobile client). Optionally link to target user/conversation for moderation. */
  async recordScreenshotReport(reporterId: string, options?: { targetUserId?: string; conversationId?: string }) {
    const result = await query(
      `INSERT INTO screenshot_events (reporter_id, target_user_id, conversation_id)
       VALUES ($1, $2, $3) RETURNING id, detected_at`,
      [reporterId, options?.targetUserId || null, options?.conversationId || null]
    );
    return result.rows[0];
  }

  /** Optional: signal distress to venue security when user is at venue and opts in. Notifies active venue staff via WebSocket. */
  async recordVenueDistress(userId: string, venueId: string): Promise<{ recorded: true; staffNotified: number }> {
    const checkedIn = await query(
      `SELECT 1 FROM venue_checkins WHERE venue_id = $1 AND user_id = $2 AND checked_out_at IS NULL`,
      [venueId, userId]
    );
    if (checkedIn.rows.length === 0) {
      throw Object.assign(new Error('You must be checked in at this venue to signal distress'), { statusCode: 403 });
    }

    const staff = await query(
      `SELECT user_id FROM venue_staff WHERE venue_id = $1 AND is_active = true`,
      [venueId]
    );
    const staffIds = (staff.rows as { user_id: string }[]).map((r) => r.user_id);

    await query(
      `INSERT INTO audit_logs (user_id, action, gdpr_category, metadata_json)
       VALUES ($1, 'safety.venue_distress', 'safety', $2)`,
      [userId, JSON.stringify({ venueId, staffNotified: staffIds.length })]
    );

    for (const staffId of staffIds) {
      emitToUser(staffId, 'venue_distress', { userId, venueId });
    }

    return { recorded: true, staffNotified: staffIds.length };
  }

  async getMissedCheckins() {
    const result = await query(
      `SELECT sc.*, u.id as user_id, p.display_name
       FROM safety_checkins sc
       JOIN users u ON sc.user_id = u.id
       JOIN user_profiles p ON u.id = p.user_id
       WHERE sc.expected_next_at < NOW()
         AND sc.alert_sent = false
         AND NOT EXISTS (
           SELECT 1 FROM safety_checkins sc2
           WHERE sc2.user_id = sc.user_id AND sc2.created_at > sc.created_at
         )
       ORDER BY sc.expected_next_at ASC`
    );
    return result.rows;
  }
}
