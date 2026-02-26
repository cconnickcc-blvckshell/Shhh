import { Request, Response, NextFunction } from 'express';
import { CouplesService } from './couples.service';

const couplesService = new CouplesService();

export class CouplesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await couplesService.createCouple(req.user!.userId);
      res.status(201).json({ data: result });
    } catch (err) { next(err); }
  }

  async link(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await couplesService.linkPartner(req.user!.userId, req.body.inviteCode);
      res.json({ data: result });
    } catch (err) { next(err); }
  }

  async getMyCouple(req: Request, res: Response, next: NextFunction) {
    try {
      const couple = await couplesService.getMyCouple(req.user!.userId);
      if (!couple) { res.status(404).json({ error: { message: 'Not in a couple' } }); return; }
      res.json({ data: couple });
    } catch (err) { next(err); }
  }

  async requestDissolution(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await couplesService.requestDissolution(req.user!.userId, req.body.reason);
      res.json({ data: result });
    } catch (err) { next(err); }
  }

  async confirmDissolution(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await couplesService.confirmDissolution(req.user!.userId);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
}
