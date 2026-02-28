import { query } from '../../config/database';
import { EventsService } from '../events/events.service';
import { VenuesService } from '../venues/venues.service';

const EVENTS_CAP = 30;
const VENUES_CAP = 20;
const DEFAULT_RADIUS_KM = 50;

function todayUtc(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export class TonightService {
  constructor(
    private eventsService: EventsService,
    private venuesService: VenuesService
  ) {}

  async getFeed(lat: number, lng: number, options?: { date?: string; radiusKm?: number }) {
    const date = options?.date ?? todayUtc();
    const radiusKm = options?.radiusKm ?? DEFAULT_RADIUS_KM;

    const [events, venues] = await Promise.all([
      this.eventsService.getNearbyEvents(lat, lng, radiusKm, { date }),
      this.venuesService.getNearbyVenues(lat, lng, radiusKm),
    ]);

    const cappedEvents = events.slice(0, EVENTS_CAP);
    const cappedVenues = venues.slice(0, VENUES_CAP);
    const venueIds = cappedVenues.map((v) => (v as unknown as { id: string }).id);

    let countByVenue: Record<string, number> = {};
    if (venueIds.length > 0) {
      const result = await query(
        `SELECT venue_id, COUNT(*)::int as cnt
         FROM venue_checkins
         WHERE checked_out_at IS NULL AND venue_id = ANY($1)
         GROUP BY venue_id`,
        [venueIds]
      );
      countByVenue = Object.fromEntries(result.rows.map((r: { venue_id: string; cnt: number }) => [r.venue_id, r.cnt]));
    }

    const venuesWithAttendees = cappedVenues.map((v) => ({
      ...v,
      currentAttendees: countByVenue[(v as unknown as { id: string }).id] ?? 0,
    }));

    return {
      events: cappedEvents,
      venues: venuesWithAttendees,
      date,
    };
  }
}
