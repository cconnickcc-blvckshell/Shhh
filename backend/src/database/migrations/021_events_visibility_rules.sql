-- GC-2.2: Private/gated events — who can see the event (open, tier_min, invite_only, attended_2_plus)
ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility_rule VARCHAR(30) DEFAULT 'open'
  CHECK (visibility_rule IS NULL OR visibility_rule IN ('open', 'tier_min', 'invite_only', 'attended_2_plus'));

ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility_tier_min INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility_radius_km INTEGER;

COMMENT ON COLUMN events.visibility_rule IS 'open = anyone; tier_min = min verification tier; invite_only = only with invite; attended_2_plus = 2+ events attended';
COMMENT ON COLUMN events.visibility_tier_min IS 'Min verification_tier when visibility_rule = tier_min';
COMMENT ON COLUMN events.visibility_radius_km IS 'Only show to users within this km of event venue (when set)';
