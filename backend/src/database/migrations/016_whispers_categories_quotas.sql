-- Whispers: category and reveal_policy (keep reveal-on-response rules simple)
ALTER TABLE whispers ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'curious'
  CHECK (category IN ('compliment', 'invite', 'curious', 'other'));
ALTER TABLE whispers ADD COLUMN IF NOT EXISTS reveal_policy VARCHAR(20) DEFAULT 'on_response'
  CHECK (reveal_policy IN ('on_response', 'anonymous_only', 'never'));

-- One pending whisper per (from, to) at DB level (predicate uses only column values, no NOW())
CREATE UNIQUE INDEX IF NOT EXISTS idx_whispers_one_pending_per_pair
  ON whispers (from_user_id, to_user_id) WHERE status = 'pending';

COMMENT ON COLUMN whispers.category IS 'compliment, invite, curious, other';
COMMENT ON COLUMN whispers.reveal_policy IS 'on_response, anonymous_only, never';
