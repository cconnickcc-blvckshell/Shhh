-- B.6 Tier 2 ID flow: store document URL for admin review (like selfie_url for photo)
ALTER TABLE public.verifications
ADD COLUMN IF NOT EXISTS id_document_url TEXT;
