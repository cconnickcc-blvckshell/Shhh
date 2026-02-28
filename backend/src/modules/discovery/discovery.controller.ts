import { Request, Response, NextFunction } from 'express';
import { DiscoveryService } from './discovery.service';
import { SubscriptionService } from '../billing/subscription.service';
import { config } from '../../config';

const discoveryService = new DiscoveryService();
const subscriptionService = new SubscriptionService();

export class DiscoveryController {
  async discover(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, radius, gender, experienceLevel, minTier, venueId, eventId } = req.query;
      const userId = req.user!.userId;

      const sub = await subscriptionService.getSubscription(userId);
      const tier = (sub as { tier?: string }).tier || 'free';
      const inVenueOrEventContext = !!(venueId || eventId);
      const limit = inVenueOrEventContext
        ? config.geo.discoveryCapPremium
        : tier === 'free'
          ? config.geo.discoveryCapFree
          : config.geo.discoveryCapPremium;

      const radiusKm = radius ? parseFloat(radius as string) : 50;
      const effectiveRadiusKm = Math.min(radiusKm, config.geo.maxDiscoveryRadiusKm);

      const users = await discoveryService.getNearbyUsers(
        userId,
        parseFloat(lat as string),
        parseFloat(lng as string),
        {
          radius: radiusKm,
          gender: gender as string | undefined,
          experienceLevel: experienceLevel as string | undefined,
          minTier: minTier ? parseInt(minTier as string, 10) : undefined,
        },
        { limit }
      );

      let computedRadiusKm: number | undefined;
      if (users.length < 15 && effectiveRadiusKm < config.geo.maxDiscoveryRadiusKm) {
        computedRadiusKm = Math.min(effectiveRadiusKm * 1.5, config.geo.maxDiscoveryRadiusKm);
      }

      res.json({
        data: users,
        count: users.length,
        discoveryCap: limit,
        radiusUsedKm: effectiveRadiusKm,
        ...(computedRadiusKm !== undefined && { computedRadiusKm }),
      });
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
