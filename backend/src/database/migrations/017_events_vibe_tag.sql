-- Event vibe / theme tag for "what to expect" (Social mix, Lifestyle, Kink, Couples only, Newbie friendly)
ALTER TABLE events ADD COLUMN IF NOT EXISTS vibe_tag VARCHAR(30)
  CHECK (vibe_tag IS NULL OR vibe_tag IN ('social_mix', 'lifestyle', 'kink', 'couples_only', 'newbie_friendly'));

COMMENT ON COLUMN events.vibe_tag IS 'Audience/expectation tag: social_mix, lifestyle, kink, couples_only, newbie_friendly';
