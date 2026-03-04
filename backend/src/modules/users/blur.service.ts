import { query } from '../../config/database';

export class BlurRevealService {
  async setBlurPreference(userId: string, blurPhotos: boolean) {
    await query(
      `UPDATE user_profiles SET blur_photos = $1 WHERE user_id = $2`,
      [blurPhotos, userId]
    );
  }

  async revealPhotosTo(
    fromUserId: string,
    toUserId: string,
    options?: { expiresInHours?: number; level?: number; scopeType?: 'global' | 'conversation'; scopeId?: string }
  ) {
    const expiresAt = options?.expiresInHours
      ? new Date(Date.now() + options.expiresInHours * 3600 * 1000)
      : null;
    const hasScope = await this.hasRevealScopeColumns();
    if (hasScope) {
      const level = Math.min(2, Math.max(0, options?.level ?? 2));
      const scopeType = options?.scopeType ?? 'global';
      const scopeId = scopeType === 'conversation' ? options?.scopeId ?? null : null;
      await query(
        `INSERT INTO photo_reveals (from_user_id, to_user_id, expires_at, level, scope_type, scope_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (from_user_id, to_user_id, scope_type) DO UPDATE SET
           revealed_at = NOW(), expires_at = $3, level = $4, scope_id = $6`,
        [fromUserId, toUserId, expiresAt, level, scopeType, scopeId]
      );
    } else {
      await query(
        `INSERT INTO photo_reveals (from_user_id, to_user_id, expires_at, scope_type)
         VALUES ($1, $2, $3, 'global')
         ON CONFLICT (from_user_id, to_user_id, scope_type) DO UPDATE SET
           revealed_at = NOW(), expires_at = $3`,
        [fromUserId, toUserId, expiresAt]
      );
    }
  }

  async revokeReveal(fromUserId: string, toUserId: string) {
    await query(
      `DELETE FROM photo_reveals WHERE from_user_id = $1 AND to_user_id = $2`,
      [fromUserId, toUserId]
    );
  }

  /** Check if viewer can see profileOwner's unblurred photos (global or optional conversation scope). */
  async canSeeUnblurred(
    viewerId: string,
    profileOwnerId: string,
    context?: { scopeType?: 'global' | 'conversation'; scopeId?: string }
  ): Promise<boolean> {
    if (viewerId === profileOwnerId) return true;

    const profile = await query(
      `SELECT blur_photos FROM user_profiles WHERE user_id = $1`,
      [profileOwnerId]
    );
    if (!profile.rows[0]?.blur_photos) return true;

    const scopeType = context?.scopeType ?? 'global';
    const scopeId = context?.scopeId ?? null;
    const hasScopeColumns = await this.hasRevealScopeColumns();
    if (hasScopeColumns && scopeType === 'conversation' && scopeId) {
      const scopedReveal = await query(
        `SELECT 1 FROM photo_reveals
         WHERE from_user_id = $1 AND to_user_id = $2
           AND (expires_at IS NULL OR expires_at > NOW())
           AND scope_type = $3 AND (scope_id IS NOT DISTINCT FROM $4)`,
        [profileOwnerId, viewerId, scopeType, scopeId]
      );
      if (scopedReveal.rows.length > 0) return true;
      const globalReveal = await query(
        `SELECT 1 FROM photo_reveals
         WHERE from_user_id = $1 AND to_user_id = $2 AND scope_type = 'global'
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [profileOwnerId, viewerId]
      );
      if (globalReveal.rows.length > 0) return true;
      return false;
    }
    const reveal = await query(
      `SELECT 1 FROM photo_reveals
       WHERE from_user_id = $1 AND to_user_id = $2
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [profileOwnerId, viewerId]
    );
    return reveal.rows.length > 0;
  }

  private async hasRevealScopeColumns(): Promise<boolean> {
    const r = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'photo_reveals' AND column_name = 'scope_type'`
    );
    return r.rows.length > 0;
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
