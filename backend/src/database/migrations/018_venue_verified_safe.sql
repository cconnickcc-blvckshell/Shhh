-- Verified safe venue badge (self-attest or partner program; no PII in attestation)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS verified_safe_at TIMESTAMPTZ;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS verified_safe_metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN venues.verified_safe_at IS 'When venue completed safe-space checklist (self-attest or partner); NULL = not attested';
COMMENT ON COLUMN venues.verified_safe_metadata IS 'Checklist/attestation metadata (no PII); e.g. method, checklist keys';
