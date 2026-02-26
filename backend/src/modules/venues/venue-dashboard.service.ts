import { query } from '../../config/database';

export class VenueDashboardService {
  // ==================== ANALYTICS ====================
  async getDashboard(venueId: string) {
    const [stats, todayAnalytics, recentEvents, activeAds, recentReviews, specials] = await Promise.all([
      this.getRealtimeStats(venueId),
      this.getTodayAnalytics(venueId),
      query(`SELECT id, title, starts_at, phase, status FROM events WHERE venue_id = $1 AND status IN ('upcoming','active') ORDER BY starts_at ASC LIMIT 5`, [venueId]),
      query(`SELECT id, surface, headline, impression_count, tap_count, spent_cents FROM ad_placements WHERE venue_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 5`, [venueId]),
      query(`SELECT vr.rating, vr.vibe_tags, vr.created_at FROM venue_reviews vr WHERE vr.venue_id = $1 ORDER BY vr.created_at DESC LIMIT 5`, [venueId]),
      query(`SELECT * FROM venue_specials WHERE venue_id = $1 AND is_active = true ORDER BY day_of_week`, [venueId]),
    ]);

    return {
      realtime: stats,
      today: todayAnalytics,
      upcomingEvents: recentEvents.rows,
      activeAds: activeAds.rows,
      recentReviews: recentReviews.rows,
      specials: specials.rows,
    };
  }

  async getRealtimeStats(venueId: string) {
    const [checkedIn, chatRooms, onlineNearby] = await Promise.all([
      query(`SELECT COUNT(*) as cnt FROM venue_checkins WHERE venue_id = $1 AND checked_out_at IS NULL`, [venueId]),
      query(`SELECT COUNT(*) as cnt FROM venue_chat_rooms WHERE venue_id = $1 AND is_active = true AND (auto_close_at IS NULL OR auto_close_at > NOW())`, [venueId]),
      query(`SELECT COUNT(*) as cnt FROM presence WHERE venue_id = $1 AND expires_at > NOW()`, [venueId]),
    ]);

    return {
      currentlyCheckedIn: parseInt(checkedIn.rows[0].cnt),
      activeChatRooms: parseInt(chatRooms.rows[0].cnt),
      nearbyOnline: parseInt(onlineNearby.rows[0].cnt),
    };
  }

  async getTodayAnalytics(venueId: string) {
    const result = await query(
      `SELECT * FROM venue_analytics WHERE venue_id = $1 AND date = CURRENT_DATE`,
      [venueId]
    );
    return result.rows[0] || { checkins: 0, unique_visitors: 0, profile_views: 0, ad_impressions: 0, ad_taps: 0, ad_revenue_cents: 0 };
  }

  async getAnalyticsRange(venueId: string, days: number = 30) {
    const result = await query(
      `SELECT * FROM venue_analytics WHERE venue_id = $1 AND date >= CURRENT_DATE - $2 ORDER BY date DESC`,
      [venueId, days]
    );
    return result.rows;
  }

  async getWeeklyTrends(venueId: string) {
    const result = await query(
      `SELECT
        EXTRACT(DOW FROM date) as day_of_week,
        AVG(checkins) as avg_checkins,
        AVG(unique_visitors) as avg_visitors,
        MAX(peak_count) as max_peak
       FROM venue_analytics WHERE venue_id = $1 AND date >= CURRENT_DATE - 90
       GROUP BY EXTRACT(DOW FROM date) ORDER BY day_of_week`,
      [venueId]
    );
    return result.rows;
  }

  // ==================== STAFF ====================
  async inviteStaff(venueId: string, userId: string, role: string) {
    const result = await query(
      `INSERT INTO venue_staff (venue_id, user_id, role)
       VALUES ($1, $2, $3) RETURNING *`,
      [venueId, userId, role]
    );
    return result.rows[0];
  }

  async getStaff(venueId: string) {
    const result = await query(
      `SELECT vs.*, p.display_name FROM venue_staff vs
       JOIN user_profiles p ON vs.user_id = p.user_id
       WHERE vs.venue_id = $1 AND vs.is_active = true ORDER BY vs.role`,
      [venueId]
    );
    return result.rows;
  }

  async removeStaff(venueId: string, staffId: string) {
    await query(`UPDATE venue_staff SET is_active = false WHERE id = $1 AND venue_id = $2`, [staffId, venueId]);
  }

  // ==================== REVIEWS ====================
  async submitReview(venueId: string, userId: string, rating: number, vibeTags?: string[], comment?: string) {
    const checkedIn = await query(
      `SELECT 1 FROM venue_checkins WHERE venue_id = $1 AND user_id = $2`,
      [venueId, userId]
    );
    if (checkedIn.rows.length === 0) {
      throw Object.assign(new Error('Must visit venue before reviewing'), { statusCode: 403 });
    }

    const result = await query(
      `INSERT INTO venue_reviews (venue_id, user_id, rating, vibe_tags, comment_encrypted)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (venue_id, user_id) DO UPDATE SET rating = $3, vibe_tags = $4, comment_encrypted = $5, created_at = NOW()
       RETURNING id`,
      [venueId, userId, rating, vibeTags || [], comment || null]
    );
    return result.rows[0];
  }

  async getReviews(venueId: string) {
    const [reviews, summary] = await Promise.all([
      query(
        `SELECT vr.rating, vr.vibe_tags, vr.created_at, vr.is_anonymous
         FROM venue_reviews vr WHERE vr.venue_id = $1 ORDER BY vr.created_at DESC LIMIT 20`,
        [venueId]
      ),
      query(
        `SELECT COUNT(*) as total, AVG(rating) as avg_rating,
                MODE() WITHIN GROUP (ORDER BY unnest) as top_vibe
         FROM venue_reviews, unnest(vibe_tags) WHERE venue_id = $1`,
        [venueId]
      ),
    ]);

    return { reviews: reviews.rows, summary: summary.rows[0] };
  }

  // ==================== SPECIALS ====================
  async createSpecial(venueId: string, data: {
    title: string; description?: string; dayOfWeek?: number;
    startTime?: string; endTime?: string; isRecurring?: boolean;
  }) {
    const result = await query(
      `INSERT INTO venue_specials (venue_id, title, description, day_of_week, start_time, end_time, is_recurring)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [venueId, data.title, data.description || null, data.dayOfWeek ?? null,
       data.startTime || null, data.endTime || null, data.isRecurring ?? true]
    );
    return result.rows[0];
  }

  async getSpecials(venueId: string) {
    const result = await query(
      `SELECT * FROM venue_specials WHERE venue_id = $1 AND is_active = true ORDER BY day_of_week`,
      [venueId]
    );
    return result.rows;
  }

  // ==================== VENUE PROFILE ====================
  async updateVenueProfile(venueId: string, data: Record<string, unknown>) {
    const allowed: Record<string, string> = {
      tagline: 'tagline', coverPhotoUrl: 'cover_photo_url', logoUrl: 'logo_url',
      websiteUrl: 'website_url', instagramHandle: 'instagram_handle',
      dressCode: 'dress_code', ageMinimum: 'age_minimum', priceRange: 'price_range',
      features: 'features', rulesJson: 'rules_json', description: 'description',
      name: 'name', capacity: 'capacity', amenities: 'amenities',
    };

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, col] of Object.entries(allowed)) {
      if (data[key] !== undefined) {
        if (key === 'features' || key === 'amenities') {
          fields.push(`${col} = $${idx}::text[]`);
        } else if (key === 'rulesJson') {
          fields.push(`${col} = $${idx}::jsonb`);
          values.push(JSON.stringify(data[key]));
          idx++;
          continue;
        } else {
          fields.push(`${col} = $${idx}`);
        }
        values.push(data[key]);
        idx++;
      }
    }

    if (fields.length === 0) return null;
    fields.push('updated_at = NOW()');
    values.push(venueId);

    await query(`UPDATE venues SET ${fields.join(', ')} WHERE id = $${idx}`, values);

    const result = await query(`SELECT * FROM venues WHERE id = $1`, [venueId]);
    return result.rows[0];
  }

  async getFullVenueProfile(venueId: string) {
    const [venue, reviews, specials, stats, events, chatRooms] = await Promise.all([
      query(`SELECT v.*, va.contact_name, va.subscription_tier FROM venues v LEFT JOIN venue_accounts va ON v.id = va.venue_id WHERE v.id = $1`, [venueId]),
      this.getReviews(venueId),
      this.getSpecials(venueId),
      this.getRealtimeStats(venueId),
      query(`SELECT id, title, starts_at, ends_at, type, capacity FROM events WHERE venue_id = $1 AND status IN ('upcoming','active') ORDER BY starts_at LIMIT 5`, [venueId]),
      query(`SELECT id, name, is_active FROM venue_chat_rooms WHERE venue_id = $1 AND is_active = true`, [venueId]),
    ]);

    return {
      ...venue.rows[0],
      reviews,
      specials,
      realtime: stats,
      upcomingEvents: events.rows,
      chatRooms: chatRooms.rows,
    };
  }
}
