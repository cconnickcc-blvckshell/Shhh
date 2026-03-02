import { Request, Response, NextFunction } from 'express';
import { DiscoveryService } from './discovery.service';
import { SubscriptionService } from '../billing/subscription.service';
import { UsersService } from '../users/users.service';
import { config } from '../../config';

const discoveryService = new DiscoveryService();
const subscriptionService = new SubscriptionService();
const usersService = new UsersService();

export class DiscoveryController {
  async discover(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, radius, gender, experienceLevel, minTier, primaryIntent: queryIntent, inMyGroups: inMyGroupsQ, venueId, eventId } = req.query;
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

      let primaryIntent = queryIntent as string | undefined;
      if (primaryIntent === undefined) {
        const profile = await usersService.getProfile(userId);
        primaryIntent = profile?.primaryIntent ?? undefined;
      }

      const users = await discoveryService.getNearbyUsers(
        userId,
        parseFloat(lat as string),
        parseFloat(lng as string),
        {
          radius: radiusKm,
          gender: gender as string | undefined,
          experienceLevel: experienceLevel as string | undefined,
          minTier: minTier ? parseInt(minTier as string, 10) : undefined,
          primaryIntent: primaryIntent as 'social' | 'curious' | 'lifestyle' | 'couple' | undefined,
          inMyGroups: inMyGroupsQ === 'true',
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

  async getCrossingPaths(req: Request, res: Response, next: NextFunction) {
    try {
      const minCount = req.query.minCount ? parseInt(req.query.minCount as string) : 2;
      const paths = await discoveryService.getCrossingPaths(req.user!.userId, minCount);
      res.json({ data: paths, count: paths.length });
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
