-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_hash VARCHAR(128) UNIQUE NOT NULL,
    email_hash VARCHAR(128) UNIQUE,
    password_hash VARCHAR(256),
    is_active BOOLEAN DEFAULT true,
    verification_tier INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_phone_hash ON users(phone_hash);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Refresh tokens for JWT rotation
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(256) UNIQUE NOT NULL,
    device_fingerprint VARCHAR(256),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Couples
CREATE TABLE couples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_1_id UUID NOT NULL REFERENCES users(id),
    partner_2_id UUID REFERENCES users(id),
    invite_code_hash VARCHAR(128) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'dissolved')),
    verified_at TIMESTAMPTZ,
    dissolution_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_couples_partners ON couples(partner_1_id, partner_2_id);

-- User Profiles
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(50) NOT NULL,
    bio TEXT DEFAULT '',
    birthdate DATE,
    gender VARCHAR(30),
    sexuality VARCHAR(50),
    photos_json JSONB DEFAULT '[]'::jsonb,
    verification_status VARCHAR(20) DEFAULT 'unverified',
    preferences_json JSONB DEFAULT '{}'::jsonb,
    kinks TEXT[] DEFAULT '{}',
    experience_level VARCHAR(20) DEFAULT 'new',
    is_host BOOLEAN DEFAULT false,
    travel_mode_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations (PostGIS)
CREATE TABLE locations (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    geom_point GEOMETRY(Point, 4326) NOT NULL,
    accuracy_meters REAL DEFAULT 0,
    is_precise_mode BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_geom ON locations USING GIST (geom_point);
CREATE INDEX idx_locations_updated ON locations(updated_at);

-- Verifications
CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('photo', 'id', 'reference')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    attempt_count INTEGER DEFAULT 1,
    verified_at TIMESTAMPTZ,
    selfie_url TEXT,
    id_document_hash VARCHAR(256),
    liveness_score REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verifications_user ON verifications(user_id);

-- References (trust system)
CREATE TABLE user_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment_encrypted TEXT,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- Blocks
CREATE TABLE blocks (
    blocker_id UUID NOT NULL REFERENCES users(id),
    blocked_id UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    sync_to_partner BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

-- Venues
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    address_hash VARCHAR(256),
    type VARCHAR(30) DEFAULT 'club',
    verified_owner_id UUID REFERENCES users(id),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    rating REAL DEFAULT 0,
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_location ON venues(lat, lng);

-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id),
    host_user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    type VARCHAR(30) DEFAULT 'party',
    capacity INTEGER,
    is_private BOOLEAN DEFAULT false,
    invite_code_hash VARCHAR(128),
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_starts ON events(starts_at);
CREATE INDEX idx_events_host ON events(host_user_id);

-- Event RSVPs
CREATE TABLE event_rsvps (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'declined', 'checked_in')),
    plus_ones INTEGER DEFAULT 0,
    arrived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- Conversations (metadata in PG, messages in MongoDB)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'event')),
    is_encrypted BOOLEAN DEFAULT true,
    encryption_key_id VARCHAR(256),
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    unread_count INTEGER DEFAULT 0,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);

-- Likes / Passes
CREATE TABLE user_interactions (
    from_user_id UUID NOT NULL REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(10) NOT NULL CHECK (type IN ('like', 'pass')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (from_user_id, to_user_id)
);

CREATE INDEX idx_interactions_to ON user_interactions(to_user_id, type);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    reported_user_id UUID NOT NULL REFERENCES users(id),
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    ip_hash VARCHAR(128),
    user_agent_hash VARCHAR(128),
    metadata_json JSONB DEFAULT '{}'::jsonb,
    gdpr_category VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Consent Records
CREATE TABLE consent_records (
    user_id UUID NOT NULL REFERENCES users(id),
    consent_type VARCHAR(50) NOT NULL,
    version INTEGER DEFAULT 1,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    withdrawn_at TIMESTAMPTZ,
    ip_hash VARCHAR(128),
    PRIMARY KEY (user_id, consent_type)
);

-- Data Deletion Requests
CREATE TABLE data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
    verification_method VARCHAR(30)
);
