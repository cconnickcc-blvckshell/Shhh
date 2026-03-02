-- Whispers (anonymous proximity signals)
CREATE TABLE IF NOT EXISTS whispers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL CHECK (length(message) <= 100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'seen', 'responded', 'expired', 'ignored')),
    response TEXT CHECK (length(response) <= 100),
    revealed BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_whispers_to ON whispers(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_whispers_from ON whispers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_whispers_expires ON whispers(expires_at);

-- Onboarding tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- Event lifecycle phases
ALTER TABLE events ADD COLUMN IF NOT EXISTS phase VARCHAR(20) DEFAULT 'upcoming'
    CHECK (phase IN ('discovery', 'upcoming', 'live', 'winding_down', 'post', 'archived'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS discovery_radius_km INTEGER DEFAULT 50;
ALTER TABLE events ADD COLUMN IF NOT EXISTS auto_checkin_enabled BOOLEAN DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS reference_prompts_sent BOOLEAN DEFAULT false;
