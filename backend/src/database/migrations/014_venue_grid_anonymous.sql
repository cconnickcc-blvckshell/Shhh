-- Venue grid: anonymous mode for check-in (default-friendly: first-time users not exposed)
ALTER TABLE venue_checkins ADD COLUMN IF NOT EXISTS anonymous_mode BOOLEAN DEFAULT true;

COMMENT ON COLUMN venue_checkins.anonymous_mode IS 'When true, user appears as anonymous tile on venue grid; default true for privacy.';
