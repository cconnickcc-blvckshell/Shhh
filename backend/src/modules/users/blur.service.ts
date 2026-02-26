import { query } from '../../config/database';

export class BlurRevealService {
  async setBlurPreference(userId: string, blurPhotos: boolean) {
    await query(
      `UPDATE user_profiles SET blur_photos = $1 WHERE user_id = $2`,
      [blurPhotos, userId]
    );
  }

  async revealPhotosTo(fromUserId: string, toUserId: string, expiresInHours?: number) {
    const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 3600 * 1000) : null;

    await query(
      `INSERT INTO photo_reveals (from_user_id, to_user_id, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET
         revealed_at = NOW(), expires_at = $3`,
      [fromUserId, toUserId, expiresAt]
    );
  }

  async revokeReveal(fromUserId: string, toUserId: string) {
    await query(
      `DELETE FROM photo_reveals WHERE from_user_id = $1 AND to_user_id = $2`,
      [fromUserId, toUserId]
    );
  }

  async canSeeUnblurred(viewerId: string, profileOwnerId: string): Promise<boolean> {
    if (viewerId === profileOwnerId) return true;

    const profile = await query(
      `SELECT blur_photos FROM user_profiles WHERE user_id = $1`,
      [profileOwnerId]
    );

    if (!profile.rows[0]?.blur_photos) return true;

    const reveal = await query(
      `SELECT 1 FROM photo_reveals
       WHERE from_user_id = $1 AND to_user_id = $2
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [profileOwnerId, viewerId]
    );

    return reveal.rows.length > 0;
  }

  async getMutualReveals(userId: string) {
    const result = await query(
      `SELECT pr.to_user_id, p.display_name, pr.revealed_at, pr.expires_at,
              EXISTS(SELECT 1 FROM photo_reveals pr2
                     WHERE pr2.from_user_id = pr.to_user_id AND pr2.to_user_id = $1
                       AND (pr2.expires_at IS NULL OR pr2.expires_at > NOW())) as is_mutual
       FROM photo_reveals pr
       JOIN user_profiles p ON pr.to_user_id = p.user_id
       WHERE pr.from_user_id = $1 AND (pr.expires_at IS NULL OR pr.expires_at > NOW())`,
      [userId]
    );
    return result.rows;
  }
}
