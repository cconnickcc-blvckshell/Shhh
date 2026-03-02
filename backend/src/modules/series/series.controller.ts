import { Request, Response, NextFunction } from 'express';
import { SeriesService } from './series.service';

const seriesService = new SeriesService();

export class SeriesController {
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const series = await seriesService.getSeries(req.params.id as string);
      if (!series) {
        res.status(404).json({ error: { message: 'Series not found' } });
        return;
      }
      const following = await seriesService.isFollowing(req.user!.userId, req.params.id as string);
      res.json({ data: { ...series, following } });
    } catch (err) {
      next(err);
    }
  }

  async getUpcoming(req: Request, res: Response, next: NextFunction) {
    try {
      const series = await seriesService.getSeries(req.params.id as string);
      if (!series) {
        res.status(404).json({ error: { message: 'Series not found' } });
        return;
      }
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const events = await seriesService.getUpcomingEvents(req.params.id as string, limit);
      res.json({ data: events, count: events.length });
    } catch (err) {
      next(err);
    }
  }

  async follow(req: Request, res: Response, next: NextFunction) {
    try {
      const series = await seriesService.follow(req.user!.userId, req.params.id as string);
      res.json({ data: series, message: 'Following series' });
    } catch (err) {
      next(err);
    }
  }

  async unfollow(req: Request, res: Response, next: NextFunction) {
    try {
      await seriesService.unfollow(req.user!.userId, req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const series = await seriesService.createSeries(req.user!.userId, req.body);
      res.status(201).json({ data: series });
    } catch (err) {
      next(err);
    }
  }
}
