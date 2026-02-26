import { Request, Response, NextFunction } from 'express';
import { ModerationService } from './moderation.service';
import { TrustScoreService } from '../users/trust.service';

const modSvc = new ModerationService();
const trustSvc = new TrustScoreService();

export class AdminController {
  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await modSvc.getStats();
      res.json({ data: stats });
    } catch (err) { next(err); }
  }

  async getModerationQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await modSvc.getQueue(req.query.type as string, req.query.status as string || 'pending');
      res.json({ data: items, count: items.length });
    } catch (err) { next(err); }
  }

  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await modSvc.getReports(req.query.status as string || 'pending');
      res.json({ data: reports, count: reports.length });
    } catch (err) { next(err); }
  }

  async resolveReport(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await modSvc.resolveReport(req.params.id as string, req.body.status, req.body.notes);
      res.json({ data: result });
    } catch (err) { next(err); }
  }

  async banUser(req: Request, res: Response, next: NextFunction) {
    try {
      await modSvc.banUser(req.params.userId as string, req.body.reason);
      res.json({ data: { message: 'User banned' } });
    } catch (err) { next(err); }
  }

  async getUserDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const detail = await modSvc.getUserDetail(req.params.userId as string);
      res.json({ data: detail });
    } catch (err) { next(err); }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await modSvc.getAuditLogs(
        req.query.limit ? parseInt(req.query.limit as string) : 100,
        req.query.offset ? parseInt(req.query.offset as string) : 0
      );
      res.json({ data: logs, count: logs.length });
    } catch (err) { next(err); }
  }

  async calculateTrustScore(req: Request, res: Response, next: NextFunction) {
    try {
      const score = await trustSvc.calculateScore(req.params.userId as string);
      res.json({ data: score });
    } catch (err) { next(err); }
  }
}
