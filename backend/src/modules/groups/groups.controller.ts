import { Request, Response, NextFunction } from 'express';
import { GroupsService } from './groups.service';

const groupsService = new GroupsService();

export class GroupsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const groups = await groupsService.list({ userId: req.user!.userId });
      res.json({ data: groups, count: groups.length });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await groupsService.create(req.user!.userId, req.body);
      res.status(201).json({ data: group });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await groupsService.getOne(req.params.id as string, req.user!.userId);
      if (!group) {
        res.status(404).json({ error: { message: 'Group not found' } });
        return;
      }
      res.json({ data: group });
    } catch (err) {
      next(err);
    }
  }

  async join(req: Request, res: Response, next: NextFunction) {
    try {
      const group = await groupsService.join(req.params.id as string, req.user!.userId);
      res.json({ data: group, message: 'Joined group' });
    } catch (err) {
      next(err);
    }
  }

  async leave(req: Request, res: Response, next: NextFunction) {
    try {
      await groupsService.leave(req.params.id as string, req.user!.userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await groupsService.getMembers(req.params.id as string, req.user!.userId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await groupsService.getEvents(req.params.id as string, req.user!.userId);
      res.json({ data: events, count: events.length });
    } catch (err) {
      next(err);
    }
  }

  async linkEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await groupsService.linkEvent(
        req.params.id as string,
        req.body.eventId,
        req.user!.userId
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}
