-- GC-3.2: Two-layer profile (SFW public / NSFW private)
-- When tier is after_reveal or after_match, GET profile returns reduced (public) subset until viewer has revealed or has conversation.
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_visibility_tier VARCHAR(20) DEFAULT 'all'
  CHECK (profile_visibility_tier IN ('all', 'after_reveal', 'after_match'));

COMMENT ON COLUMN user_profiles.profile_visibility_tier IS 'Who sees full profile: all = everyone; after_reveal = full only after mutual reveal; after_match = full only after conversation';
