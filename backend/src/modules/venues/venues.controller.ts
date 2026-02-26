import { Request, Response, NextFunction } from 'express';
import { VenuesService } from './venues.service';

const svc = new VenuesService();

export class VenuesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const venue = await svc.createVenue(req.user!.userId, req.body);
      res.status(201).json({ data: venue });
    } catch (err) { next(err); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const venue = await svc.getVenue(req.params.id as string);
      if (!venue) { res.status(404).json({ error: { message: 'Venue not found' } }); return; }
      res.json({ data: venue });
    } catch (err) { next(err); }
  }

  async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const venues = await svc.getNearbyVenues(
        parseFloat(req.query.lat as string),
        parseFloat(req.query.lng as string),
        req.query.radius ? parseFloat(req.query.radius as string) : undefined
      );
      res.json({ data: venues, count: venues.length });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const venue = await svc.updateVenue(req.params.id as string, req.user!.userId, req.body);
      res.json({ data: venue });
    } catch (err) { next(err); }
  }

  async checkGeofences(req: Request, res: Response, next: NextFunction) {
    try {
      const fences = await svc.checkGeofences(
        parseFloat(req.query.lat as string),
        parseFloat(req.query.lng as string)
      );
      res.json({ data: fences });
    } catch (err) { next(err); }
  }
}
