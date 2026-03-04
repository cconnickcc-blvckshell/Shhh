-- Fix album_shares PK: current PK (album_id, shared_with_user_id) doesn't support
-- share_target_type/share_target_id model (user, persona, couple targets).
-- Fix photo_reveals PK: current PK (from_user_id, to_user_id) ignores scope_type/scope_id,
-- preventing multiple scoped reveals.

-- 1) album_shares: backfill share_target columns, then fix PK
UPDATE public.album_shares
SET share_target_type = 'user',
    share_target_id = shared_with_user_id
WHERE share_target_id IS NULL
  AND shared_with_user_id IS NOT NULL;

ALTER TABLE public.album_shares
DROP CONSTRAINT IF EXISTS album_shares_pkey;

ALTER TABLE public.album_shares
ADD CONSTRAINT album_shares_pkey
PRIMARY KEY (album_id, share_target_type, share_target_id);

CREATE INDEX IF NOT EXISTS idx_album_shares_user
ON public.album_shares (shared_with_user_id);

-- 2) photo_reveals: expand PK to include scope
-- First ensure scope_type has a default for existing rows
UPDATE public.photo_reveals
SET scope_type = 'global'
WHERE scope_type IS NULL;

ALTER TABLE public.photo_reveals
ALTER COLUMN scope_type SET DEFAULT 'global';

ALTER TABLE public.photo_reveals
DROP CONSTRAINT IF EXISTS photo_reveals_pkey;

ALTER TABLE public.photo_reveals
ADD CONSTRAINT photo_reveals_pkey
PRIMARY KEY (from_user_id, to_user_id, scope_type);
