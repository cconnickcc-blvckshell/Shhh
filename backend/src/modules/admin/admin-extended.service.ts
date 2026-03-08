import { query } from '../../config/database';

export class AdminExtendedService {
  // ==================== REVENUE ====================
  async getRevenueOverview() {
    const [subscriptions, adRevenue, mrr] = await Promise.all([
      query(`
        SELECT tier, COUNT(*) as cnt,
          SUM(CASE WHEN tier = 'discreet' THEN 999 WHEN tier = 'phantom' THEN 1999 WHEN tier = 'elite' THEN 3999 ELSE 0 END) as revenue_cents
        FROM subscriptions WHERE status = 'active' GROUP BY tier
      `),
      query(`
        SELECT SUM(spent_cents) as total_ad_revenue, COUNT(*) as total_placements,
          SUM(impression_count) as total_impressions, SUM(tap_count) as total_taps
        FROM ad_placements
      `),
      query(`
        SELECT
          COUNT(*) FILTER (WHERE tier != 'free' AND status = 'active') as paying_users,
          SUM(CASE WHEN tier = 'discreet' THEN 999 WHEN tier = 'phantom' THEN 1999 WHEN tier = 'elite' THEN 3999 ELSE 0 END) as mrr_cents
        FROM subscriptions WHERE status = 'active'
      `),
    ]);

    return {
      subscriptions: subscriptions.rows,
      adRevenue: adRevenue.rows[0],
      mrr: mrr.rows[0],
    };
  }

  async getRevenueHistory(days: number = 30) {
    const result = await query(`
      SELECT date_trunc('day', created_at)::date as date,
        COUNT(*) FILTER (WHERE tier != 'free' AND status = 'active') as new_subs,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancellations,
        COALESCE(SUM(CASE WHEN tier = 'discreet' THEN 999 WHEN tier = 'phantom' THEN 1999 WHEN tier = 'elite' THEN 3999 ELSE 0 END) FILTER (WHERE status = 'active'), 0)::int as revenue_cents
      FROM subscriptions
      WHERE created_at > NOW() - $1 * INTERVAL '1 day'
      GROUP BY date_trunc('day', created_at)
      ORDER BY date ASC
    `, [days]);
    return result.rows;
  }

  // ==================== USERS ====================
  async searchUsers(searchQuery: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const result = await query(`
      SELECT u.id, u.is_active, u.verification_tier, u.role, u.created_at,
        up.display_name, up.gender, up.verification_status, up.experience_level, up.is_host, up.photos_json,
        ts.score as trust_score, ts.badge as trust_badge,
        (SELECT COUNT(*) FROM reports WHERE reported_user_id = u.id) as report_count
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN trust_scores ts ON u.id = ts.user_id
      WHERE up.display_name ILIKE $1 OR u.id::text ILIKE $1
      ORDER BY u.created_at DESC
      LIMIT $2 OFFSET $3
    `, [`%${searchQuery}%`, limit, offset]);

    const total = await query(`
      SELECT COUNT(*) as cnt FROM users u JOIN user_profiles up ON u.id = up.user_id
      WHERE up.display_name ILIKE $1 OR u.id::text ILIKE $1
    `, [`%${searchQuery}%`]);

    return { users: result.rows, total: parseInt(total.rows[0].cnt), page, limit };
  }

  async listUsers(page: number = 1, limit: number = 20, filter?: string) {
    const offset = (page - 1) * limit;
    let where = '';
    if (filter === 'active') where = 'AND u.is_active = true';
    if (filter === 'banned') where = 'AND u.is_active = false';
    if (filter === 'verified') where = 'AND u.verification_tier >= 1';
    if (filter === 'hosts') where = 'AND up.is_host = true';
    if (filter === 'admins') where = "AND u.role != 'user'";

    const result = await query(`
      SELECT u.id, u.is_active, u.verification_tier, u.role, u.created_at,
        up.display_name, up.gender, up.verification_status, up.experience_level, up.is_host, up.photos_json,
        ts.score as trust_score, ts.badge as trust_badge,
        (SELECT COUNT(*) FROM reports WHERE reported_user_id = u.id) as report_count,
        p.state as presence_state
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN trust_scores ts ON u.id = ts.user_id
      LEFT JOIN presence p ON u.id = p.user_id AND p.expires_at > NOW()
      WHERE u.deleted_at IS NULL ${where}
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const total = await query(`SELECT COUNT(*) as cnt FROM users u JOIN user_profiles up ON u.id = up.user_id WHERE u.deleted_at IS NULL ${where}`);

    return { users: result.rows, total: parseInt(total.rows[0].cnt), page, limit };
  }

  async setUserRole(userId: string, role: string) {
    await query(`UPDATE users SET role = $1 WHERE id = $2`, [role, userId]);
  }

  async toggleUserActive(userId: string, active: boolean) {
    await query(`UPDATE users SET is_active = $1 WHERE id = $2`, [active, userId]);
  }

  async setVerificationTier(userId: string, tier: number) {
    await query(`UPDATE users SET verification_tier = $1 WHERE id = $2`, [tier, userId]);
    const statuses = ['unverified', 'photo_verified', 'id_verified', 'reference_verified'];
    await query(`UPDATE user_profiles SET verification_status = $1 WHERE user_id = $2`, [statuses[tier] || 'unverified', userId]);
  }

  // ==================== VENUES ====================
  async listVenues(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const result = await query(`
      SELECT v.*, va.is_claimed, va.subscription_tier as venue_tier, va.contact_name,
        (SELECT COUNT(*) FROM venue_checkins vc WHERE vc.venue_id = v.id AND vc.checked_out_at IS NULL) as current_checkins,
        (SELECT COUNT(*) FROM events e WHERE e.venue_id = v.id AND e.status IN ('upcoming','active')) as upcoming_events,
        (SELECT COUNT(*) FROM ad_placements ap WHERE ap.venue_id = v.id AND ap.is_active = true) as active_ads,
        (SELECT AVG(rating) FROM venue_reviews vr WHERE vr.venue_id = v.id) as avg_rating
      FROM venues v
      LEFT JOIN venue_accounts va ON v.id = va.venue_id
      WHERE v.is_active = true
      ORDER BY v.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  // ==================== ADS ====================
  async listAdPlacements(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const result = await query(`
      SELECT ap.*, v.name as venue_name,
        CASE WHEN ap.impression_count > 0 THEN
          ROUND(ap.tap_count::numeric / ap.impression_count * 100, 2)
        ELSE 0 END as ctr_percent,
        ROUND(ap.spent_cents::numeric / 100, 2) as spent_dollars
      FROM ad_placements ap
      LEFT JOIN venues v ON ap.venue_id = v.id
      ORDER BY ap.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  async toggleAdPlacement(placementId: string, active: boolean) {
    await query(`UPDATE ad_placements SET is_active = $1 WHERE id = $2`, [active, placementId]);
  }

  // ==================== EVENTS ====================
  async listEvents(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const result = await query(`
      SELECT e.*, v.name as venue_name, p.display_name as host_name,
        (SELECT COUNT(*) FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') as going_count,
        (SELECT COUNT(*) FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'checked_in') as checked_in_count
      FROM events e
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN user_profiles p ON e.host_user_id = p.user_id
      ORDER BY e.starts_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }

  // ==================== SAFETY ====================
  async getSafetyAlerts() {
    const [panicAlerts, venueDistressAlerts, missedCheckins, recentReports] = await Promise.all([
      query(`
        SELECT sc.*, p.display_name FROM safety_checkins sc
        JOIN user_profiles p ON sc.user_id = p.user_id
        WHERE sc.type = 'panic' AND sc.created_at > NOW() - INTERVAL '24 hours'
        ORDER BY sc.created_at DESC
      `),
      query(`
        SELECT al.id, al.user_id, al.created_at, al.metadata_json,
          p.display_name,
          v.name as venue_name,
          (al.metadata_json->>'venueId')::uuid as venue_id
        FROM audit_logs al
        LEFT JOIN user_profiles p ON al.user_id = p.user_id
        LEFT JOIN venues v ON (al.metadata_json->>'venueId')::uuid = v.id
        WHERE al.action = 'safety.venue_distress'
          AND al.created_at > NOW() - INTERVAL '24 hours'
        ORDER BY al.created_at DESC
      `),
      query(`
        SELECT sc.*, p.display_name FROM safety_checkins sc
        JOIN user_profiles p ON sc.user_id = p.user_id
        WHERE sc.expected_next_at < NOW() AND sc.alert_sent = false
          AND NOT EXISTS (SELECT 1 FROM safety_checkins sc2 WHERE sc2.user_id = sc.user_id AND sc2.created_at > sc.created_at)
        ORDER BY sc.expected_next_at ASC
      `),
      query(`
        SELECT r.*, rp.display_name as reporter_name, tp.display_name as reported_name
        FROM reports r
        JOIN user_profiles rp ON r.reporter_id = rp.user_id
        JOIN user_profiles tp ON r.reported_user_id = tp.user_id
        WHERE r.status = 'pending'
        ORDER BY r.created_at ASC LIMIT 20
      `),
    ]);

    return {
      panicAlerts: panicAlerts.rows,
      venueDistressAlerts: venueDistressAlerts.rows,
      missedCheckins: missedCheckins.rows,
      pendingReports: recentReports.rows,
    };
  }

  // ==================== SYSTEM SETTINGS ====================
  async getAdControls() {
    const result = await query(`SELECT * FROM ad_controls`);
    return result.rows;
  }

  async updateAdControl(id: string, value: Record<string, unknown>) {
    await query(`UPDATE ad_controls SET value = $1, updated_at = NOW() WHERE id = $2`, [JSON.stringify(value), id]);
  }

  // ==================== MAP / GEO ====================
  /** Live user locations for command center map. Returns lat, lng, userId, lastSeen, presenceState. */
  async getPresenceGeo() {
    const result = await query(`
      SELECT
        l.user_id as "userId",
        ST_Y(l.geom_point::geometry)::double precision as lat,
        ST_X(l.geom_point::geometry)::double precision as lng,
        l.updated_at as "lastSeen",
        p.state as "presenceState"
      FROM locations l
      JOIN users u ON l.user_id = u.id AND u.deleted_at IS NULL
      LEFT JOIN presence p ON l.user_id = p.user_id AND p.expires_at > NOW()
      WHERE (l.expires_at IS NULL OR l.expires_at > NOW())
      ORDER BY l.updated_at DESC
      LIMIT 5000
    `);
    return result.rows.map((r: Record<string, unknown>) => ({
      userId: r.userId,
      lat: Number(r.lat),
      lng: Number(r.lng),
      lastSeen: r.lastSeen,
      presenceState: r.presenceState || 'unknown',
    }));
  }

  /** City-like aggregates for hot/dead and expansion. Uses ~11km grid cells. */
  async getStatsCities() {
    const result = await query(`
      WITH grid AS (
        SELECT
          ROUND(ST_Y(l.geom_point::geometry)::numeric, 1) as lat,
          ROUND(ST_X(l.geom_point::geometry)::numeric, 1) as lng,
          l.user_id
        FROM locations l
        JOIN users u ON l.user_id = u.id AND u.deleted_at IS NULL
        WHERE (l.expires_at IS NULL OR l.expires_at > NOW())
      )
      SELECT
        lat::double precision as lat,
        lng::double precision as lng,
        COUNT(*)::int as "activeCount",
        COUNT(*) FILTER (WHERE u.created_at > NOW() - INTERVAL '7 days')::int as "newThisWeek"
      FROM grid g
      JOIN users u ON g.user_id = u.id
      GROUP BY g.lat, g.lng
      ORDER BY "activeCount" DESC
      LIMIT 500
    `);
    return result.rows.map((r: Record<string, unknown>) => ({
      lat: Number(r.lat),
      lng: Number(r.lng),
      activeCount: Number(r.activeCount),
      newThisWeek: Number(r.newThisWeek),
    }));
  }

  // ==================== ENHANCED DASHBOARD ====================
  async getDashboardOverview() {
    const [users, revenue, safety, content, system] = await Promise.all([
      query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true AND deleted_at IS NULL) as active,
          COUNT(*) FILTER (WHERE verification_tier >= 1) as verified,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_24h,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_7d
        FROM users
      `),
      query(`
        SELECT
          COALESCE(SUM(CASE WHEN tier = 'discreet' THEN 999 WHEN tier = 'phantom' THEN 1999 WHEN tier = 'elite' THEN 3999 ELSE 0 END), 0) as mrr_cents,
          COUNT(*) FILTER (WHERE tier != 'free' AND status = 'active') as paying_users,
          (SELECT COALESCE(SUM(spent_cents), 0) FROM ad_placements) as ad_revenue_cents
        FROM subscriptions WHERE status = 'active'
      `),
      query(`
        SELECT
          (SELECT COUNT(*) FROM safety_checkins WHERE type = 'panic' AND created_at > NOW() - INTERVAL '24 hours') as panic_24h,
          (SELECT COUNT(*) FROM audit_logs WHERE action = 'safety.venue_distress' AND created_at > NOW() - INTERVAL '24 hours') as venue_distress_24h,
          (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
          (SELECT COUNT(*) FROM moderation_queue WHERE status = 'pending') as pending_moderation
      `),
      query(`
        SELECT
          (SELECT COUNT(*) FROM conversations WHERE last_message_at > NOW() - INTERVAL '24 hours') as active_conversations_24h,
          (SELECT COUNT(*) FROM whispers WHERE created_at > NOW() - INTERVAL '24 hours') as whispers_24h,
          (SELECT COUNT(*) FROM events WHERE status IN ('upcoming','active')) as active_events,
          (SELECT COUNT(*) FROM venues WHERE is_active = true) as active_venues,
          (SELECT COUNT(*) FROM presence WHERE expires_at > NOW() AND state != 'invisible') as online_now
        `),
      query(`
        SELECT
          (SELECT COUNT(*) FROM ad_placements WHERE is_active = true) as active_ads,
          (SELECT value FROM ad_controls WHERE id = 'global') as ad_config
      `),
    ]);

    return {
      users: users.rows[0],
      revenue: revenue.rows[0],
      safety: safety.rows[0],
      content: content.rows[0],
      system: system.rows[0],
    };
  }

  /** Conversion funnel: signup → verified → first action counts. */
  async getConversionFunnel() {
    const [signups, verified, liked, messaged, whispered, rsvpd] = await Promise.all([
      query(`SELECT COUNT(*)::int as cnt FROM users WHERE deleted_at IS NULL`),
      query(`SELECT COUNT(*)::int as cnt FROM users WHERE deleted_at IS NULL AND verification_tier >= 1`),
      query(`SELECT COUNT(DISTINCT from_user_id)::int as cnt FROM user_interactions WHERE type = 'like'`),
      query(`
        SELECT COUNT(DISTINCT cp.user_id)::int as cnt
        FROM conversation_participants cp
        JOIN conversations c ON cp.conversation_id = c.id
        WHERE c.last_message_at IS NOT NULL
      `),
      query(`SELECT COUNT(DISTINCT from_user_id)::int as cnt FROM whispers`),
      query(`SELECT COUNT(DISTINCT user_id)::int as cnt FROM event_rsvps`),
    ]);
    return {
      signups: signups.rows[0]?.cnt ?? 0,
      verified: verified.rows[0]?.cnt ?? 0,
      hasLiked: liked.rows[0]?.cnt ?? 0,
      hasMessaged: messaged.rows[0]?.cnt ?? 0,
      hasWhispered: whispered.rows[0]?.cnt ?? 0,
      hasRsvpd: rsvpd.rows[0]?.cnt ?? 0,
    };
  }

  /** Live activity feed: recent audit logs + reports for dashboard. */
  async getActivityFeed(limit: number = 30) {
    const logs = await query(
      `SELECT al.id, al.user_id, al.action, al.created_at, al.metadata_json, p.display_name
       FROM audit_logs al
       LEFT JOIN user_profiles p ON al.user_id = p.user_id
       ORDER BY al.created_at DESC LIMIT $1`,
      [limit]
    );
    return logs.rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      userId: r.user_id,
      action: r.action,
      displayName: r.display_name || 'Unknown',
      createdAt: r.created_at,
      metadata: r.metadata_json || {},
    }));
  }

  /** Trust score distribution for admin dashboard histogram. */
  async getTrustScoreDistribution() {
    const result = await query(`
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(ts.score, 0) BETWEEN 0 AND 20)::int as bucket_0_20,
        COUNT(*) FILTER (WHERE COALESCE(ts.score, 0) BETWEEN 21 AND 40)::int as bucket_21_40,
        COUNT(*) FILTER (WHERE COALESCE(ts.score, 0) BETWEEN 41 AND 60)::int as bucket_41_60,
        COUNT(*) FILTER (WHERE COALESCE(ts.score, 0) BETWEEN 61 AND 80)::int as bucket_61_80,
        COUNT(*) FILTER (WHERE COALESCE(ts.score, 0) BETWEEN 81 AND 100)::int as bucket_81_100,
        COUNT(*) FILTER (WHERE ts.score IS NULL)::int as no_score
      FROM users u
      LEFT JOIN trust_scores ts ON u.id = ts.user_id
      WHERE u.deleted_at IS NULL
    `);
    return result.rows[0];
  }
}
