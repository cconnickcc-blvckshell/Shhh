/**
 * A.6 Visibility Policy Engine — single authority for "Can user A see/interact with user B?"
 * Consolidates: blocks, discovery_visible_to, profile_visibility_tier, etc.
 */
import { query } from '../../config/database';

export class VisibilityPolicyService {
  /** Bidirectional block check. Returns true if either user has blocked the other. */
  async isBlocked(userA: string, userB: string): Promise<boolean> {
    if (userA === userB) return false;
    const r = await query(
      `SELECT 1 FROM blocks
       WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)
       LIMIT 1`,
      [userA, userB]
    );
    return r.rows.length > 0;
  }

  /** Can A see B in discovery? (blocks + discovery_visible_to) */
  async canSeeInDiscovery(viewerId: string, targetId: string, viewerIntent?: string | null, targetVisibleTo?: string | null): Promise<boolean> {
    if (viewerId === targetId) return true;
    if (await this.isBlocked(viewerId, targetId)) return false;
    if (!targetVisibleTo || targetVisibleTo === 'all') return true;
    if (targetVisibleTo === 'social_and_curious') {
      return viewerIntent === 'social' || viewerIntent === 'curious';
    }
    if (targetVisibleTo === 'same_intent') {
      return viewerIntent === targetVisibleTo; // caller must pass target's intent for proper check
    }
    return true;
  }

  /** Can A view B's full profile? (blocks + profile_visibility_tier). Caller supplies afterReveal/afterMatch. */
  async canViewFullProfile(viewerId: string, targetId: string, profileVisibilityTier: string, afterReveal: boolean, afterMatch: boolean): Promise<boolean> {
    if (viewerId === targetId) return true;
    if (await this.isBlocked(viewerId, targetId)) return false;
    if (profileVisibilityTier === 'all') return true;
    if (profileVisibilityTier === 'after_reveal') return afterReveal;
    if (profileVisibilityTier === 'after_match') return afterMatch;
    return false;
  }

  /** Can A initiate conversation/message/whisper to B? (blocks only for now) */
  async canInitiateTo(viewerId: string, targetId: string): Promise<boolean> {
    if (viewerId === targetId) return false;
    return !(await this.isBlocked(viewerId, targetId));
  }

  /** Can A like/pass B? (blocks only) */
  async canInteractWith(viewerId: string, targetId: string): Promise<boolean> {
    if (viewerId === targetId) return false;
    return !(await this.isBlocked(viewerId, targetId));
  }
}
