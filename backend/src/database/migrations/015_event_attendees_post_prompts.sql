-- Post-event prompt state (avoid spam: one prompt per type per user per event)
CREATE TABLE IF NOT EXISTS event_post_prompts (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_type VARCHAR(30) NOT NULL CHECK (prompt_type IN ('reference', 'keep_chatting', 'reveal')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id, prompt_type)
);

CREATE INDEX IF NOT EXISTS idx_event_post_prompts_event ON event_post_prompts(event_id);
