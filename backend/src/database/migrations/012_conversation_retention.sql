-- Conversation retention modes: ephemeral, timed_archive, persistent
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS retention_mode VARCHAR(20) DEFAULT 'persistent'
  CHECK (retention_mode IN ('ephemeral', 'timed_archive', 'persistent'));
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archive_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS default_message_ttl_seconds INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_conversations_archive_at ON conversations(archive_at)
  WHERE is_archived = false AND archive_at IS NOT NULL;
