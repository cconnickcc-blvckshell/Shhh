import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { VenueIdentityService } from './venue-identity.service';
import { validate } from '../../middleware/validation';
import { authenticate, requireTier } from '../../middleware/auth';

const router = Router();
const svc = new VenueIdentityService();

router.post('/:id/claim', authenticate, requireTier(2), validate(z.object({
  email: z.string().email(), contactName: z.string().min(2), phone: z.string().min(10),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.claimVenue(req.params.id as string, req.body.email, req.body.contactName, req.body.phone);
    res.json({ data: { claimed: true } });
  } catch (err) { next(err); }
});

router.post('/:id/announcements', authenticate, requireTier(2), validate(z.object({
  title: z.string().min(3).max(200), body: z.string().max(2000).optional(),
  type: z.enum(['announcement', 'promotion', 'event_promo', 'special']).optional(),
  expiresInHours: z.number().positive().max(168), targetRadiusKm: z.number().positive().optional(),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ann = await svc.createAnnouncement(req.params.id as string, req.body);
    res.status(201).json({ data: ann });
  } catch (err) { next(err); }
});

router.get('/announcements/nearby', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const anns = await svc.getActiveAnnouncements(lat, lng);
    res.json({ data: anns, count: anns.length });
  } catch (err) { next(err); }
});

router.post('/:id/checkin', authenticate, validate(z.object({
  anonymousMode: z.boolean().optional(),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.checkIn(req.params.id as string, req.user!.userId, { anonymousMode: req.body?.anonymousMode });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post('/:id/checkout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.checkOut(req.params.id as string, req.user!.userId);
    res.status(204).send();
  } catch (err) { next(err); }
});

router.get('/:id/attendees', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attendees = await svc.getVenueAttendees(req.params.id as string);
    res.json({ data: attendees, count: attendees.length });
  } catch (err) { next(err); }
});

router.get('/:id/grid', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grid = await svc.getVenueGrid(req.params.id as string);
    res.json({ data: grid, count: grid.length });
  } catch (err) { next(err); }
});

router.get('/:id/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await svc.getVenueStats(req.params.id as string);
    res.json({ data: stats });
  } catch (err) { next(err); }
});

router.post('/:id/chat-rooms', authenticate, requireTier(2), validate(z.object({
  name: z.string().min(2).max(100), eventId: z.string().uuid().optional(), autoCloseHours: z.number().positive().optional(),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await svc.createChatRoom(req.params.id as string, req.body.name, req.body.eventId, req.body.autoCloseHours);
    res.status(201).json({ data: room });
  } catch (err) { next(err); }
});

router.get('/:id/chat-rooms', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await svc.getActiveChatRooms(req.params.id as string);
    res.json({ data: rooms, count: rooms.length });
  } catch (err) { next(err); }
});

export default router;
