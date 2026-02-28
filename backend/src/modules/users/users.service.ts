import { query } from '../../config/database';

export type PrimaryIntent = 'social' | 'curious' | 'lifestyle' | 'couple';
export type DiscoveryVisibleTo = 'all' | 'social_and_curious' | 'same_intent';
export type ProfileVisibilityTier = 'all' | 'after_reveal' | 'after_match';

export interface UserProfile {
  userId: string;
  displayName: string;
  bio: string;
  gender: string | null;
  sexuality: string | null;
  photosJson: unknown[];
  verificationStatus: string;
  preferencesJson: Record<string, unknown>;
  kinks: string[];
  experienceLevel: string;
  isHost: boolean;
  travelModeUntil: string | null;
  primaryIntent?: PrimaryIntent | null;
  discoveryVisibleTo?: DiscoveryVisibleTo | null;
  profileVisibilityTier?: ProfileVisibilityTier | null;
  crossingPathsVisible?: boolean | null;
}

export class UsersService {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const result = await query(
      `SELECT up.*, u.verification_tier
       FROM user_profiles up
       JOIN users u ON up.user_id = u.id
       WHERE up.user_id = $1 AND u.deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      userId: row.user_id,
      displayName: row.display_name,
      bio: row.bio,
      gender: row.gender,
      sexuality: row.sexuality,
      photosJson: row.photos_json,
      verificationStatus: row.verification_status,
      preferencesJson: row.preferences_json,
      kinks: row.kinks,
      experienceLevel: row.experience_level,
      isHost: row.is_host,
      travelModeUntil: row.travel_mode_until,
      primaryIntent: row.primary_intent ?? null,
      discoveryVisibleTo: row.discovery_visible_to ?? null,
      profileVisibilityTier: row.profile_visibility_tier ?? null,
      crossingPathsVisible: row.crossing_paths_visible ?? null,
    };
  }

  /** True if viewer has "unlocked" full profile: mutual reveal for after_reveal, or shared conversation for after_match. */
  async canViewFullProfile(ownerId: string, viewerId: string, tier: string): Promise<boolean> {
    if (tier !== 'after_reveal' && tier !== 'after_match') return true;
    if (ownerId === viewerId) return true;
    if (tier === 'after_reveal') {
      const rev = await query(
        `SELECT 1 FROM photo_reveals
         WHERE ((from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1))
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [ownerId, viewerId]
      );
      return rev.rows.length > 0;
    }
    const conv = await query(
      `SELECT 1 FROM conversation_participants cp1
       JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id AND cp2.user_id = $2
       WHERE cp1.user_id = $1 AND cp2.user_id = $2`,
      [ownerId, viewerId]
    );
    return conv.rows.length > 0;
  }

  async updateProfile(userId: string, data: Partial<UserProfile>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    const mapping: Record<string, string> = {
      displayName: 'display_name',
      bio: 'bio',
      gender: 'gender',
      sexuality: 'sexuality',
      photosJson: 'photos_json',
      preferencesJson: 'preferences_json',
      kinks: 'kinks',
      experienceLevel: 'experience_level',
      isHost: 'is_host',
      primaryIntent: 'primary_intent',
      discoveryVisibleTo: 'discovery_visible_to',
      profileVisibilityTier: 'profile_visibility_tier',
      crossingPathsVisible: 'crossing_paths_visible',
    };

    for (const [key, column] of Object.entries(mapping)) {
      if (key in data && data[key as keyof UserProfile] !== undefined) {
        const value = data[key as keyof UserProfile];
        if (key === 'photosJson' || key === 'preferencesJson') {
          fields.push(`${column} = $${paramIdx}::jsonb`);
          values.push(JSON.stringify(value));
        } else if (key === 'kinks') {
          fields.push(`${column} = $${paramIdx}::text[]`);
          values.push(value);
        } else {
          fields.push(`${column} = $${paramIdx}`);
          values.push(value);
        }
        paramIdx++;
      }
    }

    if (fields.length === 0) return this.getProfile(userId);

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    await query(
      `UPDATE user_profiles SET ${fields.join(', ')} WHERE user_id = $${paramIdx}`,
      values
    );

    return this.getProfile(userId);
  }

  async blockUser(blockerId: string, blockedId: string, reason?: string) {
    await query(
      `INSERT INTO blocks (blocker_id, blocked_id, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
      [blockerId, blockedId, reason || null]
    );
  }

  async reportUser(reporterId: string, reportedId: string, reason: string, description?: string) {
    const result = await query(
      `INSERT INTO reports (reporter_id, reported_user_id, reason, description)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [reporterId, reportedId, reason, description || null]
    );
    return result.rows[0];
  }

  async likeUser(fromUserId: string, toUserId: string) {
    await query(
      `INSERT INTO user_interactions (from_user_id, to_user_id, type)
       VALUES ($1, $2, 'like')
       ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET type = 'like', created_at = NOW()`,
      [fromUserId, toUserId]
    );

    const match = await query(
      `SELECT 1 FROM user_interactions
       WHERE from_user_id = $1 AND to_user_id = $2 AND type = 'like'`,
      [toUserId, fromUserId]
    );

    return { matched: match.rows.length > 0 };
  }

  async passUser(fromUserId: string, toUserId: string) {
    await query(
      `INSERT INTO user_interactions (from_user_id, to_user_id, type)
       VALUES ($1, $2, 'pass')
       ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET type = 'pass', created_at = NOW()`,
      [fromUserId, toUserId]
    );
  }
}
