import { Request, Response, NextFunction } from 'express';
import { VerificationService } from './verification.service';

const svc = new VerificationService();

export class VerificationController {
  async submitPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.submitPhotoVerification(req.user!.userId, req.body.selfieUrl);
      res.status(201).json({ data: result });
    } catch (err) { next(err); }
  }

  async submitId(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.submitIdVerification(req.user!.userId, req.body.documentHash);
      res.status(201).json({ data: result });
    } catch (err) { next(err); }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await svc.getVerificationStatus(req.user!.userId);
      res.json({ data: status });
    } catch (err) { next(err); }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.approveVerification(req.params.id as string, req.user!.userId);
      res.json({ data: result });
    } catch (err) { next(err); }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.rejectVerification(req.params.id as string, req.user!.userId, req.body.reason);
      res.status(204).send();
    } catch (err) { next(err); }
  }
}
