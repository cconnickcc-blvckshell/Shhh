import { query } from '../../config/database';

const POSE_CHALLENGES = [
  'look_left', 'look_right', 'look_up', 'smile',
  'hold_up_3_fingers', 'thumbs_up', 'peace_sign', 'wave',
];

function randomPose(): string {
  return POSE_CHALLENGES[Math.floor(Math.random() * POSE_CHALLENGES.length)];
}

export class VerificationService {
  async submitPhotoVerification(userId: string, selfieUrl: string) {
    const pose = randomPose();

    const existing = await query(
      `SELECT id FROM verifications WHERE user_id = $1 AND type = 'photo' AND status = 'pending'`,
      [userId]
    );
    if (existing.rows.length > 0) {
      throw Object.assign(new Error('Photo verification already pending'), { statusCode: 409 });
    }

    const result = await query(
      `INSERT INTO verifications (user_id, type, status, selfie_url, liveness_score)
       VALUES ($1, 'photo', 'pending', $2, $3) RETURNING id, created_at`,
      [userId, selfieUrl, Math.random() * 0.3 + 0.7]
    );

    await query(
      `INSERT INTO moderation_queue (type, target_id, target_type, priority)
       VALUES ('verification_photo', $1, 'verification', 1)`,
      [result.rows[0].id]
    );

    return { verificationId: result.rows[0].id, poseChallenge: pose };
  }

  async submitIdVerification(userId: string, documentHash: string, idDocumentUrl?: string) {
    const existing = await query(
      `SELECT id FROM verifications WHERE user_id = $1 AND type = 'id' AND status = 'pending'`,
      [userId]
    );
    if (existing.rows.length > 0) {
      throw Object.assign(new Error('ID verification already pending'), { statusCode: 409 });
    }

    const hasUrlCol = await query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'verifications' AND column_name = 'id_document_url'`
    );
    if (hasUrlCol.rows.length > 0 && idDocumentUrl) {
      const result = await query(
        `INSERT INTO verifications (user_id, type, status, id_document_hash, id_document_url)
         VALUES ($1, 'id', 'pending', $2, $3) RETURNING id, created_at`,
        [userId, documentHash, idDocumentUrl]
      );
      await query(
        `INSERT INTO moderation_queue (type, target_id, target_type, priority)
         VALUES ('verification_id', $1, 'verification', 2)`,
        [result.rows[0].id]
      );
      return { verificationId: result.rows[0].id };
    }

    const result = await query(
      `INSERT INTO verifications (user_id, type, status, id_document_hash)
       VALUES ($1, 'id', 'pending', $2) RETURNING id, created_at`,
      [userId, documentHash]
    );

    await query(
      `INSERT INTO moderation_queue (type, target_id, target_type, priority)
       VALUES ('verification_id', $1, 'verification', 2)`,
      [result.rows[0].id]
    );

    return { verificationId: result.rows[0].id };
  }

  async getVerificationStatus(userId: string) {
    const result = await query(
      `SELECT id, type, status, attempt_count, verified_at, liveness_score, created_at
       FROM verifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const tier = await query('SELECT verification_tier FROM users WHERE id = $1', [userId]);

    return {
      currentTier: tier.rows[0]?.verification_tier || 0,
      verifications: result.rows,
    };
  }

  async approveVerification(verificationId: string, adminId: string) {
    const verification = await query(
      `UPDATE verifications SET status = 'approved', verified_at = NOW()
       WHERE id = $1 AND status = 'pending' RETURNING user_id, type`,
      [verificationId]
    );

    if (verification.rows.length === 0) {
      throw Object.assign(new Error('Verification not found or already processed'), { statusCode: 404 });
    }

    const { user_id: userId, type } = verification.rows[0];

    let newTier = 0;
    if (type === 'photo') newTier = 1;
    if (type === 'id') newTier = 2;

    await query(
      `UPDATE users SET verification_tier = GREATEST(verification_tier, $1) WHERE id = $2`,
      [newTier, userId]
    );

    await query(
      `UPDATE user_profiles SET verification_status = $1 WHERE user_id = $2`,
      [type === 'id' ? 'id_verified' : 'photo_verified', userId]
    );

    await query(
      `UPDATE moderation_queue SET status = 'approved', resolved_at = NOW(), assigned_to = $1
       WHERE target_id = $2 AND target_type = 'verification'`,
      [adminId, verificationId]
    );

    return { userId, type, newTier };
  }

  async rejectVerification(verificationId: string, adminId: string, reason?: string) {
    await query(
      `UPDATE verifications SET status = 'rejected' WHERE id = $1`,
      [verificationId]
    );

    await query(
      `UPDATE moderation_queue SET status = 'rejected', resolved_at = NOW(), assigned_to = $1, notes = $2
       WHERE target_id = $3 AND target_type = 'verification'`,
      [adminId, reason || null, verificationId]
    );
  }

  async checkReferenceEligibility(userId: string): Promise<boolean> {
    const refs = await query(
      `SELECT COUNT(*) as cnt FROM user_references
       WHERE to_user_id = $1 AND rating >= 3
       AND from_user_id IN (SELECT id FROM users WHERE verification_tier >= 2)`,
      [userId]
    );
    return parseInt(refs.rows[0].cnt) >= 3;
  }

  async upgradeToTier3IfEligible(userId: string) {
    const eligible = await this.checkReferenceEligibility(userId);
    if (eligible) {
      await query('UPDATE users SET verification_tier = 3 WHERE id = $1 AND verification_tier = 2', [userId]);
      await query(`UPDATE user_profiles SET verification_status = 'reference_verified' WHERE user_id = $1`, [userId]);
      return true;
    }
    return false;
  }
}
