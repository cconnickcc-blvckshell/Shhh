import { Request, Response, NextFunction } from 'express';
import { ComplianceService } from './compliance.service';

const complianceService = new ComplianceService();

export class ComplianceController {
  async dataExport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await complianceService.requestDataExport(req.user!.userId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async requestDeletion(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await complianceService.requestAccountDeletion(req.user!.userId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async recordConsent(req: Request, res: Response, next: NextFunction) {
    try {
      const { consentType, version } = req.body;
      await complianceService.recordConsent(req.user!.userId, consentType, version);
      res.json({ data: { message: 'Consent recorded' } });
    } catch (err) {
      next(err);
    }
  }

  async withdrawConsent(req: Request, res: Response, next: NextFunction) {
    try {
      const { consentType } = req.body;
      await complianceService.withdrawConsent(req.user!.userId, consentType);
      res.json({ data: { message: 'Consent withdrawn' } });
    } catch (err) {
      next(err);
    }
  }
}
