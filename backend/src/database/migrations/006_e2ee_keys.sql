-- End-to-end encryption key storage
CREATE TABLE IF NOT EXISTS user_keys (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    key_fingerprint VARCHAR(64) NOT NULL,
    algorithm VARCHAR(20) DEFAULT 'x25519-xsalsa20-poly1305',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rotated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS prekey_bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prekey_public TEXT NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prekeys_available ON prekey_bundles(user_id) WHERE is_used = false;

-- Encrypted conversation keys (per-conversation symmetric key, encrypted per participant)
CREATE TABLE IF NOT EXISTS conversation_keys (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    encrypted_key TEXT NOT NULL,
    key_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);
