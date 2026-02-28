-- Permissioned reveal: level (0=blur, 1=face, 2=body) and scope (global, conversation)
-- Adds level + scope columns; keeps one row per (from, to) for backward compatibility (global scope only until we need conversation-scoped reveals).

ALTER TABLE photo_reveals ADD COLUMN IF NOT EXISTS level SMALLINT DEFAULT 2 CHECK (level >= 0 AND level <= 3);
ALTER TABLE photo_reveals ADD COLUMN IF NOT EXISTS scope_type VARCHAR(20) DEFAULT 'global' CHECK (scope_type IN ('global', 'conversation'));
ALTER TABLE photo_reveals ADD COLUMN IF NOT EXISTS scope_id UUID;

UPDATE photo_reveals SET level = 2, scope_type = 'global', scope_id = NULL WHERE scope_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_photo_reveals_to_expires ON photo_reveals(to_user_id) WHERE (expires_at IS NULL OR expires_at > NOW());
