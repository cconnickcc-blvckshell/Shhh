-- GC-3.1 / GC-3.3 / GC-3.4: Intent as first-class, onboarding intent, curious protected lane
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS primary_intent VARCHAR(20)
  CHECK (primary_intent IS NULL OR primary_intent IN ('social', 'curious', 'lifestyle', 'couple'));

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS discovery_visible_to VARCHAR(30) DEFAULT 'all'
  CHECK (discovery_visible_to IN ('all', 'social_and_curious', 'same_intent'));

CREATE INDEX IF NOT EXISTS idx_user_profiles_primary_intent ON user_profiles(primary_intent) WHERE primary_intent IS NOT NULL;

COMMENT ON COLUMN user_profiles.primary_intent IS 'Canonical lane: social, curious, lifestyle, couple; used for discovery filter and onboarding';
COMMENT ON COLUMN user_profiles.discovery_visible_to IS 'Who can see me in discovery: all | social_and_curious | same_intent (curious protected lane)';
