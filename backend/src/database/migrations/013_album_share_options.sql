-- Vault album share: target type, watermark, notify on view
ALTER TABLE album_shares ADD COLUMN IF NOT EXISTS share_target_type VARCHAR(20) DEFAULT 'user'
  CHECK (share_target_type IN ('user', 'persona', 'couple'));
ALTER TABLE album_shares ADD COLUMN IF NOT EXISTS share_target_id UUID;
ALTER TABLE album_shares ADD COLUMN IF NOT EXISTS watermark_mode VARCHAR(20) DEFAULT 'off'
  CHECK (watermark_mode IN ('off', 'subtle', 'invisible'));
ALTER TABLE album_shares ADD COLUMN IF NOT EXISTS notify_on_view BOOLEAN DEFAULT false;
