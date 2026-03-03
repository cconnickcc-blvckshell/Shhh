import { Request, Response, NextFunction } from 'express';
import { MessagingService } from './messaging.service';

const messagingService = new MessagingService();

export class MessagingController {
  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const conversations = await messagingService.getConversations(req.user!.userId);
      res.json({ data: conversations });
    } catch (err) {
      next(err);
    }
  }

  async createConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { participantIds, type, filterContext } = req.body;
      const allParticipants = [req.user!.userId, ...participantIds];
      const conv = await messagingService.createConversation(
        allParticipants,
        type as 'direct' | 'group' | 'event',
        filterContext as Record<string, unknown> | undefined
      );
      res.status(conv.existing ? 200 : 201).json({ data: conv });
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { before, limit } = req.query;
      const messages = await messagingService.getMessages(
        req.params.id as string,
        req.user!.userId,
        before as string | undefined,
        limit ? parseInt(limit as string, 10) : undefined
      );
      res.json({ data: messages });
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { content, contentType, ttlSeconds, clientMessageId } = req.body;
      const message = await messagingService.sendMessage(
        req.params.id as string,
        req.user!.userId,
        content,
        contentType,
        ttlSeconds,
        clientMessageId
      );
      res.status(201).json({ data: message });
    } catch (err) {
      next(err);
    }
  }

  async setRetention(req: Request, res: Response, next: NextFunction) {
    try {
      const { mode, archiveAt, defaultMessageTtlSeconds } = req.body;
      const data = await messagingService.setRetention(
        req.params.id as string,
        req.user!.userId,
        mode,
        { archiveAt: archiveAt ? new Date(archiveAt) : undefined, defaultMessageTtlSeconds }
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
}
