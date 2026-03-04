-- Operational improvements from schema review:
-- 1) refresh_tokens: add last_used_at + ip_hash for anomaly detection
-- 2) subscriptions: enforce one active subscription per user
-- 3) Add updated_at to tables that are missing it

-- refresh_tokens: anomaly detection columns
ALTER TABLE public.refresh_tokens
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ip_hash VARCHAR(64);

-- subscriptions: prevent billing bugs from duplicate rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_unique'
  ) THEN
    -- Remove duplicates first (keep most recent)
    DELETE FROM public.subscriptions a
    USING public.subscriptions b
    WHERE a.user_id = b.user_id
      AND a.created_at < b.created_at;

    ALTER TABLE public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Add updated_at to tables missing it
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'blocks', 'emergency_contacts', 'media', 'albums',
      'trust_scores', 'push_tokens', 'consent_records',
      'ad_placements', 'venue_staff', 'groups', 'group_members'
    ])
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()',
      tbl
    );
  END LOOP;
END $$;
