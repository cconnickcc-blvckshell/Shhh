import { query } from '../../config/database';

interface TrustBreakdown {
  tierPoints: number;
  referencePoints: number;
  agePoints: number;
  reportPenalty: number;
  totalScore: number;
  badge: 'new' | 'verified' | 'established' | 'trusted';
}

export class TrustScoreService {
  async calculateScore(userId: string): Promise<TrustBreakdown> {
    const [user, refs, reports, accountAge] = await Promise.all([
      query('SELECT verification_tier, created_at FROM users WHERE id = $1', [userId]),
      query(
        `SELECT AVG(r.rating) as avg_rating, COUNT(*) as cnt,
                SUM(CASE WHEN u.verification_tier >= 2 THEN r.rating * 1.5 ELSE r.rating END) as weighted_sum
         FROM user_references r
         JOIN users u ON r.from_user_id = u.id
         WHERE r.to_user_id = $1 AND r.is_visible = true`,
        [userId]
      ),
      query(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE status IN ('reviewing', 'resolved')) as actionable
         FROM reports WHERE reported_user_id = $1`,
        [userId]
      ),
      query(
        `SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 as days FROM users WHERE id = $1`,
        [userId]
      ),
    ]);

    const tier = user.rows[0]?.verification_tier || 0;
    const tierPoints = tier * 25;

    const weightedSum = parseFloat(refs.rows[0].weighted_sum) || 0;
    const referencePoints = Math.min(weightedSum * 2, 30);

    const days = parseFloat(accountAge.rows[0]?.days) || 0;
    const agePoints = Math.min(days / 30 * 5, 20);

    const actionableReports = parseInt(reports.rows[0].actionable) || 0;
    const reportPenalty = actionableReports * 10;

    const totalScore = Math.max(0, Math.min(100, tierPoints + referencePoints + agePoints - reportPenalty));

    let badge: TrustBreakdown['badge'] = 'new';
    if (totalScore >= 75) badge = 'trusted';
    else if (totalScore >= 50) badge = 'established';
    else if (totalScore >= 25) badge = 'verified';

    await query(
      `INSERT INTO trust_scores (user_id, score, tier_points, reference_points, age_points, report_penalty, badge, calculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         score = $2, tier_points = $3, reference_points = $4, age_points = $5,
         report_penalty = $6, badge = $7, calculated_at = NOW()`,
      [userId, totalScore, tierPoints, referencePoints, agePoints, reportPenalty, badge]
    );

    return { tierPoints, referencePoints, agePoints, reportPenalty, totalScore, badge };
  }

  async getScore(userId: string) {
    const cached = await query(
      `SELECT * FROM trust_scores WHERE user_id = $1 AND calculated_at > NOW() - INTERVAL '1 hour'`,
      [userId]
    );
    if (cached.rows.length > 0) {
      return cached.rows[0];
    }
    return this.calculateScore(userId);
  }
}
