-- Pass with reason (GC-7.8): optional feedback when user passes
ALTER TABLE user_interactions ADD COLUMN IF NOT EXISTS pass_reason VARCHAR(50);

COMMENT ON COLUMN user_interactions.pass_reason IS 'Optional reason when type=pass: not_my_type, too_far, just_browsing, other';
