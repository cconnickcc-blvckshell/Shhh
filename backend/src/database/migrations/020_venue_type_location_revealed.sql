-- GC-2.1: Venue can be physical place, promoter, or series; event can hide location until RSVP
ALTER TABLE venues ADD COLUMN IF NOT EXISTS venue_type VARCHAR(20) DEFAULT 'physical'
  CHECK (venue_type IN ('physical', 'promoter', 'series'));

ALTER TABLE events ADD COLUMN IF NOT EXISTS location_revealed_after_rsvp BOOLEAN DEFAULT false;

COMMENT ON COLUMN venues.venue_type IS 'physical = fixed place; promoter = pop-up/promoter; series = recurring series';
COMMENT ON COLUMN events.location_revealed_after_rsvp IS 'When true, venue location/name hidden until user has RSVP going/checked_in';
