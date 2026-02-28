import { Request, Response, NextFunction } from 'express';
import { EventsService } from './events.service';

const eventsService = new EventsService();

export class EventsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventsService.createEvent(req.user!.userId, req.body);
      res.status(201).json({ data: event });
    } catch (err) {
      next(err);
    }
  }

  async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, radius, vibe } = req.query;
      const events = await eventsService.getNearbyEvents(
        parseFloat(lat as string),
        parseFloat(lng as string),
        radius ? parseFloat(radius as string) : undefined,
        vibe ? { vibeTag: vibe as 'social_mix' | 'lifestyle' | 'kink' | 'couples_only' | 'newbie_friendly' } : undefined
      );
      res.json({ data: events, count: events.length });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventsService.getEvent(req.params.id as string);
      if (!event) {
        res.status(404).json({ error: { message: 'Event not found' } });
        return;
      }
      res.json({ data: event });
    } catch (err) {
      next(err);
    }
  }

  async rsvp(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventsService.rsvp(req.params.id as string, req.user!.userId, req.body.status);
      res.json({ data: event });
    } catch (err) {
      next(err);
    }
  }

  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      await eventsService.checkIn(req.params.id as string, req.user!.userId);
      res.json({ data: { message: 'Checked in successfully' } });
    } catch (err) {
      next(err);
    }
  }

  async getAttendees(req: Request, res: Response, next: NextFunction) {
    try {
      const attendees = await eventsService.getEventAttendees(req.params.id as string);
      res.json({ data: attendees, count: attendees.length });
    } catch (err) {
      next(err);
    }
  }

  async getChatRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const rooms = await eventsService.getEventChatRooms(req.params.id as string);
      res.json({ data: rooms, count: rooms.length });
    } catch (err) {
      next(err);
    }
  }

  async setDoorCode(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventsService.setDoorCode(
        req.params.id as string,
        req.user!.userId,
        req.body.code,
        req.body.expiresAt
      );
      res.json({ data: event });
    } catch (err) {
      next(err);
    }
  }

  async validateDoorCode(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventsService.validateDoorCode(
        req.body.eventId,
        req.body.code,
        req.user!.userId
      );
      res.json({ data: event, message: 'Access granted' });
    } catch (err) {
      next(err);
    }
  }
}
