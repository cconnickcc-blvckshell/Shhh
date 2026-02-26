import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';

const usersService = new UsersService();

export class UsersController {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await usersService.getProfile(req.user!.userId);
      if (!profile) {
        res.status(404).json({ error: { message: 'Profile not found' } });
        return;
      }
      res.json({ data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await usersService.updateProfile(req.user!.userId, req.body);
      res.json({ data: profile });
    } catch (err) {
      next(err);
    }
  }

  async likeUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.likeUser(req.user!.userId, req.params.id as string);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async passUser(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.passUser(req.user!.userId, req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.blockUser(req.user!.userId, req.params.id as string, req.body.reason);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async reportUser(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await usersService.reportUser(
        req.user!.userId,
        req.params.id as string,
        req.body.reason,
        req.body.description
      );
      res.status(201).json({ data: report });
    } catch (err) {
      next(err);
    }
  }
}
