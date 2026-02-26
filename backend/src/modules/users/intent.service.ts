import { query } from '../../config/database';

export type IntentFlag = 'open_tonight' | 'traveling' | 'hosting' | 'at_event' |
  'looking_for_friends' | 'looking_for_more' | 'just_browsing' |
  'new_in_town' | 'couples_only' | 'single_friendly';

export class IntentService {
  async setIntent(userId: string, flag: IntentFlag, expiresInHours: number = 8, personaId?: string) {
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    await query(
      `DELETE FROM intent_flags WHERE user_id = $1 AND flag = $2`,
      [userId, flag]
    );

    const result = await query(
      `INSERT INTO intent_flags (user_id, persona_id, flag, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING id, expires_at`,
      [userId, personaId || null, flag, expiresAt]
    );

    return result.rows[0];
  }

  async removeIntent(userId: string, flag: IntentFlag) {
    await query(`DELETE FROM intent_flags WHERE user_id = $1 AND flag = $2`, [userId, flag]);
  }

  async getMyIntents(userId: string) {
    const result = await query(
      `SELECT id, flag, expires_at FROM intent_flags WHERE user_id = $1 AND expires_at > NOW() ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getUserIntents(userId: string) {
    const result = await query(
      `SELECT flag, expires_at FROM intent_flags WHERE user_id = $1 AND expires_at > NOW()`,
      [userId]
    );
    return result.rows;
  }

  async cleanExpired() {
    const result = await query(`DELETE FROM intent_flags WHERE expires_at <= NOW() RETURNING id`);
    return result.rowCount || 0;
  }
}
