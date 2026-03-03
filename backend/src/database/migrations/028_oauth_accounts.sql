-- OAuth accounts: link users to Apple, Google, Snapchat
-- Users can have phone_hash (phone auth) OR oauth (or both if linked later)
ALTER TABLE users ALTER COLUMN phone_hash DROP NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_hash_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_hash ON users(phone_hash) WHERE phone_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS oauth_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(256) NOT NULL,
    email_hash VARCHAR(128),
    display_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);
CREATE INDEX idx_oauth_accounts_provider_user ON oauth_accounts(provider, provider_user_id);
CREATE INDEX idx_oauth_accounts_user ON oauth_accounts(user_id);
