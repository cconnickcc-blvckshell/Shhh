-- Wave 5: Referral flow — user invites, tracking, redemption
-- referral_codes: one unique code per user (shareable)
-- referrals: who referred whom (for analytics, perks)
CREATE TABLE IF NOT EXISTS referral_codes (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(12) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

COMMENT ON TABLE referral_codes IS 'Wave 5: User shareable codes for referral flow.';
COMMENT ON TABLE referrals IS 'Wave 5: Tracks referrer→referred for invite_redeemed analytics.';

-- Post-event prompt: add invite_friend type (Wave 5)
ALTER TABLE event_post_prompts DROP CONSTRAINT IF EXISTS event_post_prompts_prompt_type_check;
ALTER TABLE event_post_prompts ADD CONSTRAINT event_post_prompts_prompt_type_check
  CHECK (prompt_type IN ('reference', 'keep_chatting', 'reveal', 'invite_friend'));
