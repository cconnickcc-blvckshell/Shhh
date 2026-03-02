-- ============================================================
-- STRUCTURED PREFERENCE COLUMNS (replaces preferences_json)
-- ============================================================

-- "I'm showing as" (what I am)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS show_as_role VARCHAR(20)
    CHECK (show_as_role IN ('top', 'bottom', 'versatile', 'switch', 'dom', 'sub', 'n_a'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS show_as_relationship VARCHAR(20)
    CHECK (show_as_relationship IN ('single', 'coupled', 'open', 'poly', 'its_complicated'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER;

-- "I want to see" (seeking filters — NULL = show everyone)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS seeking_genders TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS seeking_roles TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS seeking_relationships TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS seeking_experience TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS seeking_age_min INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS seeking_age_max INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS seeking_verified_only BOOLEAN DEFAULT false;

-- Indexes for filter performance
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON user_profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON user_profiles(show_as_role);
CREATE INDEX IF NOT EXISTS idx_profiles_relationship ON user_profiles(show_as_relationship);
