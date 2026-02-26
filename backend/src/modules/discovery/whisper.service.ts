import { query } from '../../config/database';
import { emitToUser } from '../../websocket';

const WHISPER_TTL_HOURS = 4;
const MAX_PENDING_WHISPERS = 3;

export class WhisperService {
  async sendWhisper(fromUserId: string, toUserId: string, message: string) {
    if (fromUserId === toUserId) {
      throw Object.assign(new Error('Cannot whisper to yourself'), { statusCode: 400 });
    }

    const blocked = await query(
      `SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [fromUserId, toUserId]
    );
    if (blocked.rows.length > 0) {
      throw Object.assign(new Error('Cannot send whisper'), { statusCode: 403 });
    }

    const pending = await query(
      `SELECT COUNT(*) as cnt FROM whispers WHERE from_user_id = $1 AND status = 'pending' AND expires_at > NOW()`,
      [fromUserId]
    );
    if (parseInt(pending.rows[0].cnt) >= MAX_PENDING_WHISPERS) {
      throw Object.assign(new Error('Too many pending whispers. Wait for responses or expiry.'), { statusCode: 429 });
    }

    const duplicate = await query(
      `SELECT 1 FROM whispers WHERE from_user_id = $1 AND to_user_id = $2 AND status = 'pending' AND expires_at > NOW()`,
      [fromUserId, toUserId]
    );
    if (duplicate.rows.length > 0) {
      throw Object.assign(new Error('Already whispered to this person'), { statusCode: 409 });
    }

    const expiresAt = new Date(Date.now() + WHISPER_TTL_HOURS * 3600 * 1000);

    const senderLocation = await query(
      `SELECT ST_Distance(l1.geom_point::geography, l2.geom_point::geography) as distance
       FROM locations l1, locations l2 WHERE l1.user_id = $1 AND l2.user_id = $2`,
      [fromUserId, toUserId]
    );
    const distance = senderLocation.rows[0]?.distance ? Math.round(senderLocation.rows[0].distance) : null;

    const result = await query(
      `INSERT INTO whispers (from_user_id, to_user_id, message, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
      [fromUserId, toUserId, message, expiresAt]
    );

    emitToUser(toUserId, 'whisper_received', {
      whisperId: result.rows[0].id,
      message,
      distance: distance ? `${distance}m away` : 'nearby',
      expiresAt: expiresAt.toISOString(),
    });

    return { whisperId: result.rows[0].id, expiresAt: expiresAt.toISOString() };
  }

  async getMyWhispers(userId: string) {
    const result = await query(
      `SELECT w.id, w.message, w.status, w.created_at, w.expires_at, w.response, w.revealed,
              CASE WHEN w.revealed THEN p.display_name ELSE NULL END as from_name,
              CASE WHEN w.revealed THEN w.from_user_id ELSE NULL END as from_user_id,
              ST_Distance(l1.geom_point::geography, l2.geom_point::geography) as distance
       FROM whispers w
       LEFT JOIN user_profiles p ON w.from_user_id = p.user_id
       LEFT JOIN locations l1 ON w.from_user_id = l1.user_id
       LEFT JOIN locations l2 ON w.to_user_id = l2.user_id
       WHERE w.to_user_id = $1 AND w.expires_at > NOW() AND w.status IN ('pending', 'seen', 'responded')
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return result.rows.map(r => ({
      ...r,
      distance: r.distance ? `${Math.round(r.distance)}m away` : 'nearby',
    }));
  }

  async getSentWhispers(userId: string) {
    const result = await query(
      `SELECT w.id, w.message, w.status, w.created_at, w.expires_at, w.response,
              p.display_name as to_name
       FROM whispers w
       JOIN user_profiles p ON w.to_user_id = p.user_id
       WHERE w.from_user_id = $1 AND w.expires_at > NOW()
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async respondToWhisper(whisperId: string, userId: string, response: string, reveal: boolean = false) {
    const whisper = await query(
      `SELECT from_user_id FROM whispers WHERE id = $1 AND to_user_id = $2 AND status IN ('pending', 'seen')`,
      [whisperId, userId]
    );
    if (whisper.rows.length === 0) {
      throw Object.assign(new Error('Whisper not found'), { statusCode: 404 });
    }

    await query(
      `UPDATE whispers SET status = 'responded', response = $1, revealed = $2, responded_at = NOW()
       WHERE id = $3`,
      [response, reveal, whisperId]
    );

    const fromUserId = whisper.rows[0].from_user_id;

    if (reveal) {
      const profile = await query(`SELECT display_name FROM user_profiles WHERE user_id = $1`, [userId]);
      emitToUser(fromUserId, 'whisper_revealed', {
        whisperId,
        response,
        revealedName: profile.rows[0]?.display_name,
        revealedUserId: userId,
      });
    } else {
      emitToUser(fromUserId, 'whisper_response', { whisperId, response });
    }

    return { responded: true, revealed: reveal };
  }

  async markSeen(whisperId: string, userId: string) {
    await query(
      `UPDATE whispers SET status = 'seen' WHERE id = $1 AND to_user_id = $2 AND status = 'pending'`,
      [whisperId, userId]
    );
  }

  async ignoreWhisper(whisperId: string, userId: string) {
    await query(
      `UPDATE whispers SET status = 'ignored' WHERE id = $1 AND to_user_id = $2`,
      [whisperId, userId]
    );
  }

  async cleanExpired() {
    const result = await query(
      `UPDATE whispers SET status = 'expired' WHERE expires_at <= NOW() AND status IN ('pending', 'seen') RETURNING id`
    );
    return result.rowCount || 0;
  }
}
