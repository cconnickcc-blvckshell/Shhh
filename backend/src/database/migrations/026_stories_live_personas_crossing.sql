-- GC-5.1: Stories (24h, reuse media)
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_views (
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_venue ON stories(venue_id) WHERE venue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);

-- GC-5.2: Live at venue (opt-in time limit)
ALTER TABLE venue_checkins ADD COLUMN IF NOT EXISTS live_until TIMESTAMPTZ;
COMMENT ON COLUMN venue_checkins.live_until IS 'When set, user appears as "live" only until this time (opt-in time-limited).';

-- GC-5.5: Tonight-only / burn persona
ALTER TABLE personas ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS is_burn BOOLEAN DEFAULT false;
COMMENT ON COLUMN personas.expires_at IS 'When set, persona auto-deactivates after this time (tonight-only).';
COMMENT ON COLUMN personas.is_burn IS 'Burner persona; one night, no trace.';

-- GC-5.4: Crossing paths opt-in
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS crossing_paths_visible BOOLEAN DEFAULT false;
COMMENT ON COLUMN user_profiles.crossing_paths_visible IS 'When true, user can see/receive "we keep crossing paths" nudge with others who also opted in.';
