-- GC-2.3: Series and recurring events (e.g. "Every first Friday at X")
CREATE TABLE IF NOT EXISTS event_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recurrence_rule TEXT,
    next_occurrence TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_series_follows (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    series_id UUID NOT NULL REFERENCES event_series(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, series_id)
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES event_series(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_series ON events(series_id) WHERE series_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_series_follows_series ON user_series_follows(series_id);

COMMENT ON TABLE event_series IS 'Recurring event series (e.g. first Friday at X); events link via series_id';
COMMENT ON TABLE user_series_follows IS 'Users following a series for reminders';
