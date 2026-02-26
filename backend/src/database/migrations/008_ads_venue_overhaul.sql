-- ============================================================
-- AD SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    surface VARCHAR(20) NOT NULL CHECK (surface IN ('discover_feed', 'chat_list', 'post_event', 'venue_page')),
    headline VARCHAR(100) NOT NULL,
    body TEXT,
    media_url TEXT,
    cta_text VARCHAR(30) DEFAULT 'Learn More',
    cta_url TEXT,
    target_radius_km INTEGER DEFAULT 50,
    target_intents TEXT[] DEFAULT '{}',
    target_genders TEXT[] DEFAULT '{}',
    budget_cents INTEGER DEFAULT 0,
    spent_cents INTEGER DEFAULT 0,
    max_impressions INTEGER,
    impression_count INTEGER DEFAULT 0,
    tap_count INTEGER DEFAULT 0,
    cpm_cents INTEGER DEFAULT 1500,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_placements_surface ON ad_placements(surface) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ad_placements_venue ON ad_placements(venue_id);

CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id UUID NOT NULL REFERENCES ad_placements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    surface VARCHAR(20) NOT NULL,
    shown_at TIMESTAMPTZ DEFAULT NOW(),
    tapped_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    dismiss_ttl_days INTEGER DEFAULT 7
);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_user ON ad_impressions(user_id, surface);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_placement ON ad_impressions(placement_id);

-- Cadence rules (configurable per surface)
CREATE TABLE IF NOT EXISTS ad_cadence_rules (
    surface VARCHAR(20) PRIMARY KEY,
    max_per_24h INTEGER DEFAULT 1,
    min_gap_minutes INTEGER DEFAULT 60,
    skip_first_open BOOLEAN DEFAULT true,
    skip_during_intents TEXT[] DEFAULT ARRAY['open_to_chat'],
    is_enabled BOOLEAN DEFAULT true
);

INSERT INTO ad_cadence_rules (surface, max_per_24h, min_gap_minutes, skip_first_open) VALUES
  ('discover_feed', 2, 30, true),
  ('chat_list', 1, 1440, true),
  ('post_event', 1, 0, false),
  ('venue_page', 3, 10, false)
ON CONFLICT (surface) DO NOTHING;

-- Admin kill switch
CREATE TABLE IF NOT EXISTS ad_controls (
    id VARCHAR(30) PRIMARY KEY,
    value JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO ad_controls (id, value) VALUES
  ('global', '{"enabled": true, "density_multiplier": 1.0}'::jsonb),
  ('city_overrides', '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================
-- VENUE ACCOUNT OVERHAUL
-- ============================================================

-- Venue profile enhancements
ALTER TABLE venues ADD COLUMN IF NOT EXISTS tagline VARCHAR(200);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(50);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS dress_code TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS age_minimum INTEGER DEFAULT 18;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS price_range VARCHAR(10) DEFAULT '$$';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS rules_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';

-- Venue analytics (daily aggregates)
CREATE TABLE IF NOT EXISTS venue_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    checkins INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    peak_hour INTEGER,
    peak_count INTEGER DEFAULT 0,
    profile_views INTEGER DEFAULT 0,
    event_rsvps INTEGER DEFAULT 0,
    ad_impressions INTEGER DEFAULT 0,
    ad_taps INTEGER DEFAULT 0,
    ad_revenue_cents INTEGER DEFAULT 0,
    whispers_sent INTEGER DEFAULT 0,
    UNIQUE(venue_id, date)
);

-- Venue staff accounts
CREATE TABLE IF NOT EXISTS venue_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff', 'security', 'dj')),
    permissions TEXT[] DEFAULT ARRAY['view_checkins'],
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_venue_staff_unique ON venue_staff(venue_id, user_id) WHERE is_active = true;

-- Venue reviews
CREATE TABLE IF NOT EXISTS venue_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    vibe_tags TEXT[] DEFAULT '{}',
    comment_encrypted TEXT,
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(venue_id, user_id)
);

-- Venue specials / recurring promotions
CREATE TABLE IF NOT EXISTS venue_specials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME,
    end_time TIME,
    is_recurring BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
