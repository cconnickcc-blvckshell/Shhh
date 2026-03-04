-- Performance index pack: the minimum set to survive 100k users.
-- Without these, discovery, chat list, moderation, and safety workers crawl.

-- A) Discovery & Geo
CREATE INDEX IF NOT EXISTS idx_locations_geom
ON public.locations USING GIST (geom_point);

CREATE INDEX IF NOT EXISTS idx_locations_expires
ON public.locations (expires_at);

-- B) Presence
CREATE INDEX IF NOT EXISTS idx_presence_expires
ON public.presence (expires_at);

CREATE INDEX IF NOT EXISTS idx_presence_state
ON public.presence (state);

CREATE INDEX IF NOT EXISTS idx_presence_venue_event
ON public.presence (venue_id, event_id);

-- C) Interactions (likes/passes) — gets huge fast
CREATE INDEX IF NOT EXISTS idx_user_interactions_to
ON public.user_interactions (to_user_id);

CREATE INDEX IF NOT EXISTS idx_user_interactions_from
ON public.user_interactions (from_user_id);

-- D) Conversations + unread counts (chat list load)
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user
ON public.conversation_participants (user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_unread
ON public.conversation_participants (user_id, unread_count)
WHERE unread_count > 0;

CREATE INDEX IF NOT EXISTS idx_conversations_last_message
ON public.conversations (last_message_at DESC);

-- E) Events browsing
CREATE INDEX IF NOT EXISTS idx_events_starts
ON public.events (starts_at);

CREATE INDEX IF NOT EXISTS idx_events_venue_starts
ON public.events (venue_id, starts_at);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_user
ON public.event_rsvps (user_id);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event
ON public.event_rsvps (event_id);

-- F) Ads cadence enforcement
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user_surface_shown
ON public.ad_impressions (user_id, surface, shown_at DESC);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_placement
ON public.ad_impressions (placement_id);

-- G) Moderation / reports queues
CREATE INDEX IF NOT EXISTS idx_reports_status_created
ON public.reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status_priority
ON public.moderation_queue (status, priority DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_flags_status
ON public.content_flags (status, created_at DESC);

-- H) Safety dead-man switch
CREATE INDEX IF NOT EXISTS idx_safety_checkins_expected
ON public.safety_checkins (expected_next_at)
WHERE alert_sent = false;

-- I) Blocks lookup (for exclusion in discovery)
CREATE INDEX IF NOT EXISTS idx_blocks_blocker
ON public.blocks (blocker_id);

CREATE INDEX IF NOT EXISTS idx_blocks_blocked
ON public.blocks (blocked_id);

-- J) Whispers expiry
CREATE INDEX IF NOT EXISTS idx_whispers_expires
ON public.whispers (expires_at);

CREATE INDEX IF NOT EXISTS idx_whispers_to_user
ON public.whispers (to_user_id);

-- K) Intent flags expiry
CREATE INDEX IF NOT EXISTS idx_intent_flags_expires
ON public.intent_flags (expires_at);
