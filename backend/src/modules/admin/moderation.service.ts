import { query } from '../../config/database';

export class ModerationService {
  async getQueue(type?: string, status: string = 'pending', limit: number = 50) {
    const params: unknown[] = [status, limit];
    let typeFilter = '';
    if (type) {
      typeFilter = 'AND mq.type = $3';
      params.push(type);
    }

    const result = await query(
      `SELECT mq.*, p.display_name as target_user_name
       FROM moderation_queue mq
       LEFT JOIN verifications v ON mq.target_type = 'verification' AND mq.target_id = v.id
       LEFT JOIN user_profiles p ON v.user_id = p.user_id
       WHERE mq.status = $1 ${typeFilter}
       ORDER BY mq.priority DESC, mq.created_at ASC
       LIMIT $2`,
      params
    );
    return result.rows;
  }

  async getStats() {
    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'assigned') as assigned,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_today,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_today,
        COUNT(*) FILTER (WHERE status = 'escalated') as escalated
      FROM moderation_queue
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    const userStats = await query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true AND deleted_at IS NULL) as active_users,
        COUNT(*) FILTER (WHERE verification_tier >= 1) as verified_users,
        COUNT(*) FILTER (WHERE verification_tier >= 2) as id_verified_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today
      FROM users
    `);

    const reportStats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today
      FROM reports
    `);

    return {
      moderation: result.rows[0],
      users: userStats.rows[0],
      reports: reportStats.rows[0],
    };
  }

  async getReports(status: string = 'pending', limit: number = 50) {
    const result = await query(
      `SELECT r.*,
        rp.display_name as reporter_name,
        tp.display_name as reported_name
       FROM reports r
       JOIN user_profiles rp ON r.reporter_id = rp.user_id
       JOIN user_profiles tp ON r.reported_user_id = tp.user_id
       WHERE r.status = $1
       ORDER BY r.created_at ASC LIMIT $2`,
      [status, limit]
    );
    return result.rows;
  }

  async resolveReport(reportId: string, status: 'resolved' | 'dismissed', _adminNotes?: string) {
    await query(
      `UPDATE reports SET status = $1, resolved_at = NOW() WHERE id = $2`,
      [status, reportId]
    );

    if (status === 'resolved') {
      const report = await query('SELECT reported_user_id, reason FROM reports WHERE id = $1', [reportId]);
      if (report.rows.length > 0) {
        await query(
          `INSERT INTO content_flags (content_type, content_id, user_id, flag_type, source, confidence, status)
           VALUES ('profile_bio', $1, $2, $3, 'admin', 1.0, 'confirmed')`,
          [reportId, report.rows[0].reported_user_id, report.rows[0].reason]
        );
      }
    }

    return { reportId, status };
  }

  async banUser(userId: string, reason: string) {
    await query('UPDATE users SET is_active = false WHERE id = $1', [userId]);
    await query(
      `INSERT INTO audit_logs (user_id, action, gdpr_category, metadata_json)
       VALUES ($1, 'admin.user_banned', 'moderation', $2)`,
      [userId, JSON.stringify({ reason })]
    );
  }

  async getAuditLogs(limit: number = 100, offset: number = 0) {
    const result = await query(
      `SELECT al.*, p.display_name
       FROM audit_logs al
       LEFT JOIN user_profiles p ON al.user_id = p.user_id
       ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async getUserDetail(userId: string) {
    const [user, profile, trustScore, verifications, reports, interactions] = await Promise.all([
      query('SELECT id, is_active, verification_tier, created_at FROM users WHERE id = $1', [userId]),
      query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]),
      query('SELECT * FROM trust_scores WHERE user_id = $1', [userId]),
      query('SELECT * FROM verifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
      query('SELECT * FROM reports WHERE reported_user_id = $1 ORDER BY created_at DESC', [userId]),
      query(
        `SELECT type, COUNT(*) as cnt FROM user_interactions WHERE from_user_id = $1 GROUP BY type`,
        [userId]
      ),
    ]);

    return {
      user: user.rows[0],
      profile: profile.rows[0],
      trustScore: trustScore.rows[0],
      verifications: verifications.rows,
      reports: reports.rows,
      interactions: interactions.rows,
    };
  }
}
