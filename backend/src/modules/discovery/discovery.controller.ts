import { Request, Response, NextFunction } from 'express';
import { DiscoveryService } from './discovery.service';

const discoveryService = new DiscoveryService();

export class DiscoveryController {
  async discover(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, radius, gender, experienceLevel, minTier } = req.query;
      const users = await discoveryService.getNearbyUsers(
        req.user!.userId,
        parseFloat(lat as string),
        parseFloat(lng as string),
        {
          radius: radius ? parseFloat(radius as string) : undefined,
          gender: gender as string | undefined,
          experienceLevel: experienceLevel as string | undefined,
          minTier: minTier ? parseInt(minTier as string, 10) : undefined,
        }
      );
      res.json({ data: users, count: users.length });
    } catch (err) {
      next(err);
    }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, isPrecise } = req.body;
      await discoveryService.updateLocation(req.user!.userId, lat, lng, isPrecise || false);
      res.json({ data: { message: 'Location updated' } });
    } catch (err) {
      next(err);
    }
  }
}
