import { Request, Response, NextFunction } from 'express';
import { StoriesService } from './stories.service';

const storiesService = new StoriesService();

export class StoriesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const story = await storiesService.create(req.user!.userId, req.body.mediaId, {
        venueId: req.body.venueId,
        ttlHours: req.body.ttlHours,
      });
      res.status(201).json({ data: story });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const story = await storiesService.getStory(req.params.id as string);
      if (!story) {
        res.status(404).json({ error: { message: 'Story not found or expired' } });
        return;
      }
      res.json({ data: story });
    } catch (err) {
      next(err);
    }
  }

  async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 50;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const stories = await storiesService.getNearby(lat, lng, radius, limit);
      res.json({ data: stories, count: stories.length });
    } catch (err) {
      next(err);
    }
  }

  async getByVenue(req: Request, res: Response, next: NextFunction) {
    try {
      const stories = await storiesService.getByVenue(req.params.id as string);
      res.json({ data: stories, count: stories.length });
    } catch (err) {
      next(err);
    }
  }

  async view(req: Request, res: Response, next: NextFunction) {
    try {
      const story = await storiesService.getStory(req.params.id as string);
      if (!story) {
        res.status(404).json({ error: { message: 'Story not found or expired' } });
        return;
      }
      await storiesService.recordView(req.params.id as string, req.user!.userId);
      res.json({ data: { viewed: true } });
    } catch (err) {
      next(err);
    }
  }

  async getViewers(req: Request, res: Response, next: NextFunction) {
    try {
      const story = await storiesService.getStory(req.params.id as string);
      if (!story) {
        res.status(404).json({ error: { message: 'Story not found or expired' } });
        return;
      }
      if (story.user_id !== req.user!.userId) {
        res.status(403).json({ error: { message: 'Only the author can see viewers' } });
        return;
      }
      const viewers = await storiesService.getViewers(req.params.id as string, req.user!.userId);
      res.json({ data: viewers });
    } catch (err) {
      next(err);
    }
  }
}
