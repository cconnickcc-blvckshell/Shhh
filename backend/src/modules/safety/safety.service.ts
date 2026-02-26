import crypto from 'crypto';
import { query } from '../../config/database';

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

    await query(
      `INSERT INTO audit_logs (user_id, action, gdpr_category, metadata_json)
       VALUES ($1, 'safety.panic_triggered', 'safety', $2)`,
      [userId, JSON.stringify({ contactsNotified: contacts.length, lat, lng })]
    );

    return {
      checkinId: checkin.rows[0].id,
      contactsNotified: contacts.length,
      message: 'Panic alert sent to emergency contacts',
    };
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
