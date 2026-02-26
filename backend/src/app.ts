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
import couplesRoutes from './modules/couples/couples.routes';
import verificationRoutes from './modules/verification/verification.routes';
import referencesRoutes from './modules/references/references.routes';
import safetyRoutes from './modules/safety/safety.routes';
import venuesRoutes from './modules/venues/venues.routes';
import adminRoutes from './modules/admin/admin.routes';
import { TrustScoreService } from './modules/users/trust.service';
import { authenticate as authMiddleware } from './middleware/auth';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(globalRateLimiter);

  // API Documentation
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Shhh API Docs',
  }));
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.2.0',
      modules: [
        'auth', 'users', 'couples', 'verification', 'references',
        'discovery', 'messaging', 'events', 'venues', 'safety',
        'compliance', 'admin',
      ],
    });
  });

  // Core API v1
  app.use('/v1/auth', authRoutes);
  app.use('/v1/users', usersRoutes);
  app.use('/v1/couples', couplesRoutes);
  app.use('/v1/verification', verificationRoutes);
  app.use('/v1/references', referencesRoutes);
  app.use('/v1/discover', discoveryRoutes);
  app.use('/v1/conversations', messagingRoutes);
  app.use('/v1/events', eventsRoutes);
  app.use('/v1/venues', venuesRoutes);
  app.use('/v1/safety', safetyRoutes);
  app.use('/v1/compliance', complianceRoutes);

  // Admin API
  app.use('/v1/admin', adminRoutes);

  // Trust score endpoint on user routes
  const trustSvc = new TrustScoreService();
  app.get('/v1/users/:userId/trust-score', authMiddleware, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const score = await trustSvc.getScore(req.params.id as string || req.params.userId as string);
      res.json({ data: score });
    } catch (err) { next(err); }
  });

  app.use(errorHandler);

  return app;
}
