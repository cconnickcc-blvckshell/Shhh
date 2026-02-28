-- GC-4.2: Content slots for guides and norms (minimal CMS)
CREATE TABLE IF NOT EXISTS content_slots (
    key VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200),
    body_md TEXT,
    link VARCHAR(500),
    locale VARCHAR(10) DEFAULT 'en',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE content_slots IS 'Static or curated content: guides, norms, success stories (GC-4.2)';

-- GC-4.3: Add talk_first to events.vibe_tag (beginner-friendly)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_vibe_tag_check;
ALTER TABLE events ADD CONSTRAINT events_vibe_tag_check
  CHECK (vibe_tag IS NULL OR vibe_tag IN ('social_mix', 'lifestyle', 'kink', 'couples_only', 'newbie_friendly', 'talk_first'));
