-- Wave 4: Analytics events for density/trigger metrics (prerequisite for Wave 4)
-- Minimal schema: event_type, user_id, payload, created_at. No PII in payload.
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(80) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payload_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);

-- Event reminders: track 1h-before reminders sent to RSVP'd users (avoid duplicate)
CREATE TABLE IF NOT EXISTS event_reminders (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(30) NOT NULL DEFAULT '1h_before' CHECK (reminder_type IN ('1h_before', '24h_before')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_event ON event_reminders(event_id);

COMMENT ON TABLE analytics_events IS 'Product analytics: discovery_tile_impression, whisper_sent, push_sent, etc. No PII.';
COMMENT ON TABLE event_reminders IS 'Wave 4: Track event reminder pushes to avoid duplicate sends.';
