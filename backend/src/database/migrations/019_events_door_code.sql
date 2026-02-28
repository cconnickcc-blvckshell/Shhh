-- Event-level door code for venue-issued passes (private events). Code stored as hash; rate-limit validation.
ALTER TABLE events ADD COLUMN IF NOT EXISTS door_code_hash VARCHAR(128);
ALTER TABLE events ADD COLUMN IF NOT EXISTS door_code_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN events.door_code_hash IS 'SHA-256 hash of door code for at-door validation; NULL = no code set';
COMMENT ON COLUMN events.door_code_expires_at IS 'When door code expires (optional)';

CREATE INDEX IF NOT EXISTS idx_events_door_code_hash ON events(door_code_hash) WHERE door_code_hash IS NOT NULL;
