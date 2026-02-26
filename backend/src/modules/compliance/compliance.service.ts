import { query } from '../../config/database';
import { Message } from '../messaging/message.model';

export class ComplianceService {
  async requestDataExport(userId: string) {
    const [user, profile, interactions, conversations, auditLogs, consents] = await Promise.all([
      query('SELECT id, created_at, is_active FROM users WHERE id = $1', [userId]),
      query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]),
      query('SELECT * FROM user_interactions WHERE from_user_id = $1', [userId]),
      query(
        `SELECT c.* FROM conversations c
         JOIN conversation_participants cp ON c.id = cp.conversation_id
         WHERE cp.user_id = $1`,
        [userId]
      ),
      query('SELECT action, created_at, gdpr_category FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query('SELECT * FROM consent_records WHERE user_id = $1', [userId]),
    ]);

    const messages = await Message.find({ senderId: userId })
      .select('conversationId content contentType createdAt')
      .lean();

    await query(
      `INSERT INTO audit_logs (user_id, action, gdpr_category) VALUES ($1, 'compliance.data_export', 'data_rights')`,
      [userId]
    );

    return {
      user: user.rows[0],
      profile: profile.rows[0],
      interactions: interactions.rows,
      conversations: conversations.rows,
      messages,
      auditLogs: auditLogs.rows,
      consents: consents.rows,
      exportedAt: new Date().toISOString(),
    };
  }

  async requestAccountDeletion(userId: string, verificationMethod: string = 'token') {
    const result = await query(
      `INSERT INTO data_deletion_requests (user_id, verification_method)
       VALUES ($1, $2) RETURNING id, requested_at, status`,
      [userId, verificationMethod]
    );

    await query(
      `INSERT INTO audit_logs (user_id, action, gdpr_category)
       VALUES ($1, 'compliance.deletion_requested', 'data_rights')`,
      [userId]
    );

    return result.rows[0];
  }

  async recordConsent(userId: string, consentType: string, version: number, ipHash?: string) {
    await query(
      `INSERT INTO consent_records (user_id, consent_type, version, ip_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, consent_type) DO UPDATE SET
         version = $3, granted_at = NOW(), withdrawn_at = NULL, ip_hash = $4`,
      [userId, consentType, version, ipHash || null]
    );
  }

  async withdrawConsent(userId: string, consentType: string) {
    await query(
      `UPDATE consent_records SET withdrawn_at = NOW()
       WHERE user_id = $1 AND consent_type = $2`,
      [userId, consentType]
    );
  }
}
