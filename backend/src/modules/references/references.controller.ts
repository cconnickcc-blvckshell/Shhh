import { Request, Response, NextFunction } from 'express';
import { ReferencesService } from './references.service';

const svc = new ReferencesService();

export class ReferencesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.createReference(req.user!.userId, req.body.toUserId, req.body.rating, req.body.comment);
      res.status(201).json({ data: result });
    } catch (err) { next(err); }
  }

  async getForUser(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getReferencesFor(req.params.userId as string);
      res.json({ data });
    } catch (err) { next(err); }
  }
}
