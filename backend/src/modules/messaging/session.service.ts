import { query } from '../../config/database';
import { Message } from './message.model';
import { emitToUser } from '../../websocket';
import { logger } from '../../config/logger';

export class ChatSessionService {
  async createSessionChat(
    participantIds: string[],
    ttlHours: number = 24,
    requiresMutualConsent: boolean = true
  ) {
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    const result = await query(
      `INSERT INTO conversations (type, session_expires_at, session_ttl_hours, requires_mutual_consent, consent_granted_by)
       VALUES ('direct', $1, $2, $3, ARRAY[$4::uuid]) RETURNING id`,
      [expiresAt, ttlHours, requiresMutualConsent, participantIds[0]]
    );

    const convId = result.rows[0].id;
    for (const uid of participantIds) {
      await query(
        `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)`,
        [convId, uid]
      );
    }

    return { id: convId, expiresAt: expiresAt.toISOString(), ttlHours, requiresMutualConsent };
  }

  async grantConsent(conversationId: string, userId: string) {
    await query(
      `UPDATE conversations SET
         consent_granted_by = array_append(
           COALESCE(consent_granted_by, '{}'),
           $1::uuid
         )
       WHERE id = $2 AND NOT ($1::uuid = ANY(COALESCE(consent_granted_by, '{}')))`,
      [userId, conversationId]
    );

    const conv = await query(
      `SELECT consent_granted_by, requires_mutual_consent FROM conversations WHERE id = $1`,
      [conversationId]
    );

    if (conv.rows[0]) {
      const granted = conv.rows[0].consent_granted_by || [];
      const participants = await query(
        `SELECT COUNT(*) as cnt FROM conversation_participants WHERE conversation_id = $1`,
        [conversationId]
      );
      const allConsented = granted.length >= parseInt(participants.rows[0].cnt);
      return { allConsented, grantedCount: granted.length };
    }

    return { allConsented: false, grantedCount: 0 };
  }

  async panicWipe(userId: string) {
    const convos = await query(
      `SELECT c.id FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE cp.user_id = $1 AND c.panic_wiped_at IS NULL`,
      [userId]
    );

    let wiped = 0;
    for (const conv of convos.rows) {
      await Message.deleteMany({ conversationId: conv.id });

      await query(
        `UPDATE conversations SET panic_wiped_at = NOW(), last_message_at = NULL WHERE id = $1`,
        [conv.id]
      );

      const participants = await query(
        `SELECT user_id FROM conversation_participants WHERE conversation_id = $1 AND user_id != $2`,
        [conv.id, userId]
      );

      for (const p of participants.rows) {
        emitToUser(p.user_id, 'conversation_wiped', { conversationId: conv.id });
      }

      wiped++;
    }

    logger.info({ userId, conversationsWiped: wiped }, 'Panic wipe executed');

    await query(
      `INSERT INTO audit_logs (user_id, action, gdpr_category, metadata_json)
       VALUES ($1, 'safety.panic_wipe', 'safety', $2)`,
      [userId, JSON.stringify({ conversationsWiped: wiped })]
    );

    return { wiped };
  }

  async expireSessionChats() {
    const expired = await query(
      `SELECT id FROM conversations
       WHERE session_expires_at IS NOT NULL AND session_expires_at <= NOW()
         AND panic_wiped_at IS NULL`,
    );

    for (const conv of expired.rows) {
      await Message.deleteMany({ conversationId: conv.id });
      await query(`UPDATE conversations SET panic_wiped_at = NOW() WHERE id = $1`, [conv.id]);
    }

    return expired.rows.length;
  }
}
