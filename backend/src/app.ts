import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import discoveryRoutes from './modules/discovery/discovery.routes';
import messagingRoutes from './modules/messaging/messaging.routes';
import eventsRoutes from './modules/events/events.routes';
import complianceRoutes from './modules/compliance/compliance.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(globalRateLimiter);

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    });
  });

  app.use('/v1/auth', authRoutes);
  app.use('/v1/users', usersRoutes);
  app.use('/v1/discover', discoveryRoutes);
  app.use('/v1/conversations', messagingRoutes);
  app.use('/v1/events', eventsRoutes);
  app.use('/v1/compliance', complianceRoutes);

  app.use(errorHandler);

  return app;
}
