import { query } from '../../config/database';

export class ReferencesService {
  async createReference(fromUserId: string, toUserId: string, rating: number, comment?: string) {
    if (fromUserId === toUserId) {
      throw Object.assign(new Error('Cannot reference yourself'), { statusCode: 400 });
    }

    const result = await query(
      `INSERT INTO user_references (from_user_id, to_user_id, rating, comment_encrypted)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET rating = $3, comment_encrypted = $4, created_at = NOW()
       RETURNING id`,
      [fromUserId, toUserId, rating, comment || null]
    );

    return result.rows[0];
  }

  async getReferencesFor(userId: string) {
    const result = await query(
      `SELECT r.id, r.rating, r.comment_encrypted as comment, r.created_at, r.is_visible,
              p.display_name as from_user_name, u.verification_tier as from_user_tier
       FROM user_references r
       JOIN user_profiles p ON r.from_user_id = p.user_id
       JOIN users u ON r.from_user_id = u.id
       WHERE r.to_user_id = $1 AND r.is_visible = true
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const stats = await query(
      `SELECT COUNT(*) as total, AVG(rating) as avg_rating
       FROM user_references WHERE to_user_id = $1 AND is_visible = true`,
      [userId]
    );

    return {
      references: result.rows,
      totalCount: parseInt(stats.rows[0].total),
      averageRating: parseFloat(stats.rows[0].avg_rating) || 0,
    };
  }
}
