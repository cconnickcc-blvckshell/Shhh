import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../config/logger';
import { AuthPayload } from '../middleware/auth';

let io: SocketServer | null = null;

export function getIO(): SocketServer | null {
  return io;
}

export function setupWebSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user.userId;
    logger.info({ userId }, 'WebSocket connected');

    socket.join(`user:${userId}`);

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      logger.debug({ userId, conversationId }, 'Joined conversation room');
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        userId,
        conversationId: data.conversationId,
      });
    });

    socket.on('stop_typing', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_stop_typing', {
        userId,
        conversationId: data.conversationId,
      });
    });

    socket.on('message_read', (data: { conversationId: string; messageId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message_read', {
        userId,
        conversationId: data.conversationId,
        messageId: data.messageId,
      });
    });

    socket.on('disconnect', () => {
      logger.info({ userId }, 'WebSocket disconnected');
    });
  });

  return io;
}

export function emitNewMessage(conversationId: string, message: Record<string, unknown>) {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit('new_message', message);
}

export function emitToUser(userId: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function emitMediaSelfDestructed(conversationId: string, mediaId: string) {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit('media_self_destructed', { mediaId });
}

export function emitAlbumShared(userId: string, albumData: Record<string, unknown>) {
  if (!io) return;
  io.to(`user:${userId}`).emit('album_shared', albumData);
}

export function emitAlbumRevoked(userId: string, albumId: string) {
  if (!io) return;
  io.to(`user:${userId}`).emit('album_revoked', { albumId });
}
