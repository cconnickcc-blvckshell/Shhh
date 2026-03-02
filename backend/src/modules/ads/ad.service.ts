import { query } from '../../config/database';
import { getRedis } from '../../config/redis';

type Surface = 'discover_feed' | 'chat_list' | 'post_event' | 'venue_page';

const HARDCODED_GUARDRAILS: Record<string, { maxPer24h?: number }> = {
  discover_feed: { maxPer24h: 2 },
  chat_list: { maxPer24h: 1 },
  post_event: { maxPer24h: 1 },
  venue_page: { maxPer24h: 3 },
};

export class AdService {
  async getEligibleAd(userId: string, surface: Surface, lat?: number, lng?: number): Promise<any | null> {
    const redis = getRedis();

    // Check if user is premium (premium = no ads ever)
    const sub = await query(
      `SELECT tier FROM subscriptions WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    if (sub.rows.length > 0 && sub.rows[0].tier !== 'free') return null;

    // Check global kill switch
    const globalControl = await query(`SELECT value FROM ad_controls WHERE id = 'global'`);
    if (!globalControl.rows[0]?.value?.enabled) return null;

    // Check cadence rules
    const cadence = await query(`SELECT * FROM ad_cadence_rules WHERE surface = $1`, [surface]);
    if (cadence.rows.length > 0 && !cadence.rows[0].is_enabled) return null;

    // Check per-user cooldown in Redis
    const cooldownKey = `ad_cooldown:${userId}:${surface}`;
    const onCooldown = await redis.get(cooldownKey);
    if (onCooldown) return null;

    // Check 24h impression count
    const recent = await query(
      `SELECT COUNT(*) as cnt FROM ad_impressions
       WHERE user_id = $1 AND surface = $2 AND shown_at > NOW() - INTERVAL '24 hours'`,
      [userId, surface]
    );
    const maxPer24h = cadence.rows[0]?.max_per_24h || HARDCODED_GUARDRAILS[surface]?.maxPer24h || 2;
    if (parseInt(recent.rows[0].cnt) >= maxPer24h) return null;

    // Check dismissed placements
    const dismissed = await query(
      `SELECT placement_id FROM ad_impressions
       WHERE user_id = $1 AND dismissed_at IS NOT NULL
         AND dismissed_at > NOW() - INTERVAL '7 days'`,
      [userId]
    );
    const dismissedIds = dismissed.rows.map(r => r.placement_id);

    // Check user intents (skip during open_to_chat for chat_list)
    if (surface === 'chat_list') {
      const presence = await query(`SELECT state FROM presence WHERE user_id = $1 AND expires_at > NOW()`, [userId]);
      if (presence.rows[0]?.state === 'open_to_chat') return null;
    }

    // Find eligible ad
    let locationFilter = '';
    const params: any[] = [surface];

    if (lat && lng) {
      locationFilter = `AND EXISTS (
        SELECT 1 FROM venues v WHERE v.id = ap.venue_id
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography,
            ap.target_radius_km * 1000
          )
      )`;
      params.push(lat, lng);
    }

    const result = await query(
      `SELECT ap.*, v.name as venue_name, v.lat as venue_lat, v.lng as venue_lng,
              v.logo_url, v.tagline as venue_tagline
       FROM ad_placements ap
       LEFT JOIN venues v ON ap.venue_id = v.id
       WHERE ap.surface = $1
         AND ap.is_active = true
         AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
         AND (ap.max_impressions IS NULL OR ap.impression_count < ap.max_impressions)
         AND (ap.budget_cents = 0 OR ap.spent_cents < ap.budget_cents)
         ${dismissedIds.length > 0 ? `AND ap.id NOT IN (${dismissedIds.map((_, i) => `$${params.length + i + 1}`).join(',')})` : ''}
         ${locationFilter}
       ORDER BY ap.cpm_cents DESC, random()
       LIMIT 1`,
      [...params, ...dismissedIds]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async recordImpression(placementId: string, userId: string, surface: Surface) {
    const redis = getRedis();

    await query(
      `INSERT INTO ad_impressions (placement_id, user_id, surface) VALUES ($1, $2, $3)`,
      [placementId, userId, surface]
    );

    await query(
      `UPDATE ad_placements SET impression_count = impression_count + 1,
       spent_cents = spent_cents + (cpm_cents / 1000)
       WHERE id = $1`,
      [placementId]
    );

    // Set cooldown
    const cadence = await query(`SELECT min_gap_minutes FROM ad_cadence_rules WHERE surface = $1`, [surface]);
    const cooldownMinutes = cadence.rows[0]?.min_gap_minutes || 60;
    await redis.set(`ad_cooldown:${userId}:${surface}`, '1', 'EX', cooldownMinutes * 60);
  }

  async recordTap(impressionId: string) {
    const impression = await query(
      `UPDATE ad_impressions SET tapped_at = NOW() WHERE id = $1 RETURNING placement_id`,
      [impressionId]
    );
    if (impression.rows[0]) {
      await query(`UPDATE ad_placements SET tap_count = tap_count + 1 WHERE id = $1`, [impression.rows[0].placement_id]);
    }
  }

  async dismissAd(impressionId: string, userId: string) {
    await query(
      `UPDATE ad_impressions SET dismissed_at = NOW() WHERE id = $1 AND user_id = $2`,
      [impressionId, userId]
    );
  }

  async createPlacement(venueId: string, data: {
    surface: Surface; headline: string; body?: string; mediaUrl?: string;
    ctaText?: string; ctaUrl?: string; targetRadiusKm?: number;
    targetIntents?: string[]; budgetCents?: number; maxImpressions?: number;
    cpmCents?: number; expiresInDays?: number;
  }) {
    const expiresAt = data.expiresInDays ? new Date(Date.now() + data.expiresInDays * 86400000) : null;

    const result = await query(
      `INSERT INTO ad_placements (venue_id, surface, headline, body, media_url, cta_text, cta_url,
        target_radius_km, target_intents, budget_cents, max_impressions, cpm_cents, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [venueId, data.surface, data.headline, data.body || null, data.mediaUrl || null,
       data.ctaText || 'Learn More', data.ctaUrl || null, data.targetRadiusKm || 50,
       data.targetIntents || [], data.budgetCents || 0, data.maxImpressions || null,
       data.cpmCents || 1500, expiresAt]
    );
    return result.rows[0];
  }

  async getPlacementStats(placementId: string) {
    const result = await query(
      `SELECT ap.*,
        COUNT(DISTINCT ai.user_id) as unique_views,
        COUNT(ai.tapped_at) FILTER (WHERE ai.tapped_at IS NOT NULL) as total_taps,
        CASE WHEN ap.impression_count > 0 THEN
          ROUND(COUNT(ai.tapped_at) FILTER (WHERE ai.tapped_at IS NOT NULL)::numeric / ap.impression_count * 100, 2)
        ELSE 0 END as ctr_percent
       FROM ad_placements ap
       LEFT JOIN ad_impressions ai ON ap.id = ai.placement_id
       WHERE ap.id = $1
       GROUP BY ap.id`,
      [placementId]
    );
    return result.rows[0];
  }
}
