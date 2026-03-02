-- Media uploads (photos, videos)
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    storage_provider VARCHAR(20) DEFAULT 'local' CHECK (storage_provider IN ('local', 's3', 'gcs')),
    is_nsfw BOOLEAN DEFAULT false,
    moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_media_user ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_expires ON media(expires_at) WHERE expires_at IS NOT NULL AND deleted_at IS NULL;

-- Private albums
CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT true,
    cover_media_id UUID REFERENCES media(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_albums_owner ON albums(owner_id);

-- Album media (many-to-many)
CREATE TABLE IF NOT EXISTS album_media (
    album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (album_id, media_id)
);

-- Album sharing (grant/revoke access to specific users)
CREATE TABLE IF NOT EXISTS album_shares (
    album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES users(id),
    can_download BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    PRIMARY KEY (album_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_album_shares_user ON album_shares(shared_with_user_id) WHERE revoked_at IS NULL;

-- Self-destructing media messages (enhanced tracking)
-- Uses existing messages collection in MongoDB with expiresAt TTL
-- This table tracks view state for view-once media in PostgreSQL for reliability
CREATE TABLE IF NOT EXISTS media_view_tracking (
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES users(id),
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    view_duration_ms INTEGER,
    PRIMARY KEY (media_id, viewer_id)
);
