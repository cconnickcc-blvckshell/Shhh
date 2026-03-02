-- Couple dissolution tracking
ALTER TABLE couples ADD COLUMN IF NOT EXISTS dissolution_requested_at TIMESTAMPTZ;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS dissolution_confirmed_by UUID[];
ALTER TABLE couples ADD COLUMN IF NOT EXISTS cooldown_expires_at TIMESTAMPTZ;

-- Trust scores
CREATE TABLE IF NOT EXISTS trust_scores (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    score REAL DEFAULT 0,
    tier_points REAL DEFAULT 0,
    reference_points REAL DEFAULT 0,
    age_points REAL DEFAULT 0,
    report_penalty REAL DEFAULT 0,
    badge VARCHAR(20) DEFAULT 'new',
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety: Emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone_hash VARCHAR(128) NOT NULL,
    relationship VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id);

-- Safety: Check-ins
CREATE TABLE IF NOT EXISTS safety_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('arrived', 'periodic', 'departed', 'panic')),
    location GEOMETRY(Point, 4326),
    expected_next_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    alert_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_checkins_user ON safety_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_checkins_pending ON safety_checkins(expected_next_at) WHERE responded_at IS NULL;

-- Geofences
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(200),
    type VARCHAR(30) DEFAULT 'venue' CHECK (type IN ('venue', 'restricted', 'custom')),
    geom_polygon GEOMETRY(Polygon, 4326) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geofences_geom ON geofences USING GIST (geom_polygon);

-- Venue enhancements
ALTER TABLE venues ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS photos_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS hours_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified';
ALTER TABLE venues ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Moderation queue
CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(30) NOT NULL CHECK (type IN ('verification_photo', 'verification_id', 'report', 'content_flag', 'venue_verification')),
    target_id UUID NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'approved', 'rejected', 'escalated')),
    assigned_to UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_type ON moderation_queue(type);

-- Content flags (automated moderation)
CREATE TABLE IF NOT EXISTS content_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN ('message', 'profile_photo', 'profile_bio', 'event_description')),
    content_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    flag_type VARCHAR(30) NOT NULL CHECK (flag_type IN ('spam', 'harassment', 'explicit', 'underage', 'scam', 'impersonation')),
    confidence REAL,
    source VARCHAR(20) DEFAULT 'automated' CHECK (source IN ('automated', 'user_report', 'admin')),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_flags_user ON content_flags(user_id);
