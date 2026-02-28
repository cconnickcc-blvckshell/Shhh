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

  /**
   * Process pending data deletion requests: anonymize PII first, then mark completed.
   * Semantics: anonymize first, hard delete later (conservative to avoid irreversible data loss).
   * Does not delete the user row (preserves FKs); call this from a scheduled worker.
   */
  async processDeletionRequests(limit: number = 10): Promise<number> {
    const pending = await query(
      `SELECT id, user_id FROM data_deletion_requests WHERE status = 'pending' ORDER BY requested_at ASC LIMIT $1`,
      [limit]
    );
    if (pending.rows.length === 0) return 0;

    let processed = 0;
    for (const row of pending.rows) {
      const { id: requestId, user_id: userId } = row;
      try {
        await query(`UPDATE data_deletion_requests SET status = 'processing' WHERE id = $1`, [requestId]);

        // Anonymize: overwrite PII so user is no longer identifiable
        await query(
          `UPDATE users SET phone_hash = 'deleted_' || id::text, email_hash = NULL, password_hash = NULL, is_active = false, updated_at = NOW(), deleted_at = NOW() WHERE id = $1`,
          [userId]
        );
        await query(
          `UPDATE user_profiles SET display_name = 'Deleted User', bio = '', photos_json = '[]'::jsonb, preferences_json = '{}'::jsonb, kinks = '{}', updated_at = NOW() WHERE user_id = $1`,
          [userId]
        );

        await query(
          `UPDATE data_deletion_requests SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [requestId]
        );
        await query(
          `INSERT INTO audit_logs (user_id, action, gdpr_category) VALUES ($1, 'compliance.deletion_processed', 'data_rights')`,
          [userId]
        );
        processed++;
      } catch (err) {
        await query(`UPDATE data_deletion_requests SET status = 'pending' WHERE id = $1`, [requestId]);
        throw err;
      }
    }
    return processed;
  }
}
