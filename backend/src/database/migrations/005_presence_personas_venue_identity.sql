-- ============================================================
-- PRESENCE STATE MACHINE
-- ============================================================

CREATE TABLE IF NOT EXISTS presence (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    state VARCHAR(20) NOT NULL DEFAULT 'invisible'
        CHECK (state IN ('invisible', 'nearby', 'browsing', 'at_venue', 'at_event', 'open_to_chat', 'paused', 'cooldown')),
    venue_id UUID REFERENCES venues(id),
    event_id UUID REFERENCES events(id),
    expires_at TIMESTAMPTZ NOT NULL,
    affirmed_at TIMESTAMPTZ DEFAULT NOW(),
    decay_minutes INTEGER DEFAULT 30,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_state ON presence(state) WHERE state != 'invisible';
CREATE INDEX IF NOT EXISTS idx_presence_expires ON presence(expires_at);

-- ============================================================
-- PERSONA SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('solo', 'couple', 'anonymous', 'traveler')),
    display_name VARCHAR(50) NOT NULL,
    bio TEXT DEFAULT '',
    avatar_media_id UUID REFERENCES media(id),
    photos_json JSONB DEFAULT '[]'::jsonb,
    preferences_json JSONB DEFAULT '{}'::jsonb,
    kinks TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    blur_photos BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personas_user ON personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_active ON personas(user_id) WHERE is_active = true;

-- Link couple persona to partner
ALTER TABLE personas ADD COLUMN IF NOT EXISTS linked_partner_id UUID REFERENCES users(id);

-- ============================================================
-- INTENT FLAGS (time-scoped)
-- ============================================================

CREATE TABLE IF NOT EXISTS intent_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    flag VARCHAR(30) NOT NULL CHECK (flag IN (
        'open_tonight', 'traveling', 'hosting', 'at_event',
        'looking_for_friends', 'looking_for_more', 'just_browsing',
        'new_in_town', 'couples_only', 'single_friendly'
    )),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intent_flags_user ON intent_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_intent_flags_active ON intent_flags(expires_at);

-- ============================================================
-- VENUE IDENTITY (first-class accounts)
-- ============================================================

-- Venue accounts (venues can log in, manage their profile)
CREATE TABLE IF NOT EXISTS venue_accounts (
    venue_id UUID PRIMARY KEY REFERENCES venues(id) ON DELETE CASCADE,
    email_hash VARCHAR(128) UNIQUE,
    password_hash VARCHAR(256),
    contact_name VARCHAR(100),
    contact_phone_hash VARCHAR(128),
    is_claimed BOOLEAN DEFAULT false,
    claimed_at TIMESTAMPTZ,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
    stripe_customer_id VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venue announcements / ads
CREATE TABLE IF NOT EXISTS venue_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    media_id UUID REFERENCES media(id),
    type VARCHAR(20) DEFAULT 'announcement' CHECK (type IN ('announcement', 'promotion', 'event_promo', 'special')),
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    target_radius_km INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    taps INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venue_announcements_active ON venue_announcements(venue_id, expires_at) WHERE is_active = true;

-- Venue check-ins (user checked into venue)
CREATE TABLE IF NOT EXISTS venue_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    user_id UUID NOT NULL REFERENCES users(id),
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    checked_out_at TIMESTAMPTZ,
    is_visible BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_venue_checkins_venue ON venue_checkins(venue_id) WHERE checked_out_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_venue_checkins_user ON venue_checkins(user_id);

-- Venue chat rooms (temporary, event-bound)
CREATE TABLE IF NOT EXISTS venue_chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    event_id UUID REFERENCES events(id),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    max_participants INTEGER DEFAULT 100,
    auto_close_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHAT SESSIONS (bounded, expiring conversations)
-- ============================================================

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS session_ttl_hours INTEGER DEFAULT 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS panic_wiped_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS requires_mutual_consent BOOLEAN DEFAULT true;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS consent_granted_by UUID[];

-- ============================================================
-- PHOTO BLUR/REVEAL
-- ============================================================

-- Per-user blur preferences on profile photos
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS blur_photos BOOLEAN DEFAULT false;

-- Mutual reveal tracking
CREATE TABLE IF NOT EXISTS photo_reveals (
    from_user_id UUID NOT NULL REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    revealed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    PRIMARY KEY (from_user_id, to_user_id)
);

-- ============================================================
-- PREMIUM SUBSCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'discreet', 'phantom', 'elite')),
    stripe_subscription_id VARCHAR(128),
    stripe_customer_id VARCHAR(128),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    persona_slots INTEGER DEFAULT 1,
    features_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id) WHERE status = 'active';

-- ============================================================
-- SCREENSHOT / MEDIA PROTECTION
-- ============================================================

CREATE TABLE IF NOT EXISTS screenshot_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id),
    target_user_id UUID REFERENCES users(id),
    conversation_id UUID REFERENCES conversations(id),
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    response_action VARCHAR(30) DEFAULT 'notify'
);
