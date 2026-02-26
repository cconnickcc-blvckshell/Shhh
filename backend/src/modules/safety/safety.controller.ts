import { Request, Response, NextFunction } from 'express';
import { SafetyService } from './safety.service';

const svc = new SafetyService();

export class SafetyController {
  async addContact(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.addEmergencyContact(req.user!.userId, req.body.name, req.body.phone, req.body.relationship);
      res.status(201).json({ data: result });
    } catch (err) { next(err); }
  }

  async getContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const contacts = await svc.getEmergencyContacts(req.user!.userId);
      res.json({ data: contacts });
    } catch (err) { next(err); }
  }

  async removeContact(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.removeEmergencyContact(req.user!.userId, req.params.id as string);
      res.status(204).send();
    } catch (err) { next(err); }
  }

  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.checkIn(req.user!.userId, req.body.type, req.body.eventId, req.body.lat, req.body.lng, req.body.nextCheckInMinutes);
      res.json({ data: result });
    } catch (err) { next(err); }
  }

  async panic(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await svc.panic(req.user!.userId, req.body.lat, req.body.lng);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
}
