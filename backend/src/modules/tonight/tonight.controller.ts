import { Request, Response, NextFunction } from 'express';
import { TonightService } from './tonight.service';

export class TonightController {
  constructor(private tonightService: TonightService) {}

  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, date, radius } = req.query;
      const latNum = parseFloat(lat as string);
      const lngNum = parseFloat(lng as string);
      if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        res.status(400).json({ error: { message: 'lat and lng are required and must be numbers' } });
        return;
      }
      const data = await this.tonightService.getFeed(latNum, lngNum, {
        date: (date as string) || undefined,
        radiusKm: radius ? parseFloat(radius as string) : undefined,
      });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
}
