import { Request, Response, NextFunction } from 'express';
import { MessagingService } from './messaging.service';

const messagingService = new MessagingService();

export class MessagingController {
  async getUnreadTotal(req: Request, res: Response, next: NextFunction) {
    try {
      const total = await messagingService.getUnreadTotal(req.user!.userId);
      res.json({ total });
    } catch (err) {
      next(err);
    }
  }

  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const conversations = await messagingService.getConversations(req.user!.userId);
      res.json({ data: conversations });
    } catch (err) {
      next(err);
    }
  }

  /** A.2 State sync: single round-trip for badge + list reconciliation on app foreground. */
  async getSync(req: Request, res: Response, next: NextFunction) {
    try {
      const [total, conversations] = await Promise.all([
        messagingService.getUnreadTotal(req.user!.userId),
        messagingService.getConversations(req.user!.userId),
      ]);
      res.json({ total, data: conversations, serverTime: new Date().toISOString() });
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

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await messagingService.markConversationRead(req.params.id as string, req.user!.userId);
      res.status(204).send();
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
