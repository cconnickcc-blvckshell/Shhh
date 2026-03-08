import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { metricsMiddleware, metricsHandler, metricsAuth } from './middleware/metrics';
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
import mediaRoutes from './modules/media/media.routes';
import presenceRoutes from './modules/discovery/presence.routes';
import personaRoutes from './modules/users/persona.routes';
import venueIdentityRoutes from './modules/venues/venue-identity.routes';
import sessionRoutes from './modules/messaging/session.routes';
import blurRoutes from './modules/users/blur.routes';
import intentRoutes from './modules/users/intent.routes';
import preferencesRoutes from './modules/users/preferences.routes';
import e2eeRoutes from './modules/messaging/e2ee.routes';
import billingRoutes from './modules/billing/billing.routes';
import { handleStripeWebhook } from './modules/billing/webhook.handler';
import whisperRoutes from './modules/discovery/whisper.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import referralRoutes from './modules/referrals/referral.routes';
import adRoutes from './modules/ads/ad.routes';
import venueDashboardRoutes from './modules/venues/venue-dashboard.routes';
import tonightRoutes from './modules/tonight/tonight.routes';
import seriesRoutes from './modules/series/series.routes';
import contentRoutes from './modules/content/content.routes';
import storiesRoutes from './modules/stories/stories.routes';
import groupsRoutes from './modules/groups/groups.routes';
import path from 'path';
import { TrustScoreService } from './modules/users/trust.service';
import { authenticate as authMiddleware } from './middleware/auth';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: config.cors.origins.length > 0
      ? config.cors.origins
      : false, // production with no CORS_ORIGINS: reject all (fail-safe)
    credentials: true,
  }));
  app.use(compression());

  // Stripe webhook: single raw-body handler (must be before express.json)
  app.post('/v1/billing/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());
  app.use(metricsMiddleware);
  app.use(globalRateLimiter);

  // Root: redirect to API docs
  app.get('/', (_req, res) => res.redirect(302, '/docs'));

  // API Documentation
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Shhh API Docs',
  }));
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec));

  app.get('/metrics', metricsAuth, metricsHandler);
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.5.0',
      modules: [
        'auth', 'users', 'couples', 'verification', 'references',
        'discovery', 'presence', 'personas', 'intents',
        'messaging', 'sessions', 'events',
        'venues', 'venue-identity', 'safety',
        'media', 'albums', 'blur-reveal',
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
  app.use('/v1/series', seriesRoutes);
  app.use('/v1/content', contentRoutes);
  app.use('/v1/stories', storiesRoutes);
  app.use('/v1/groups', groupsRoutes);
  app.use('/v1/tonight', tonightRoutes);
  app.use('/v1/venues', venuesRoutes);
  app.use('/v1/safety', safetyRoutes);
  app.use('/v1/compliance', complianceRoutes);

  // Media & Albums
  app.use('/v1/media', mediaRoutes);
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  // Presence, Personas, Intents
  app.use('/v1/presence', presenceRoutes);
  app.use('/v1/personas', personaRoutes);
  app.use('/v1/intents', intentRoutes);
  app.use('/v1/preferences', preferencesRoutes);

  // Whispers
  app.use('/v1/whispers', whisperRoutes);

  // Analytics (Wave 4 prerequisite)
  app.use('/v1/analytics', analyticsRoutes);

  // Referrals (Wave 5)
  app.use('/v1/referrals', referralRoutes);

  // Ads
  app.use('/v1/ads', adRoutes);

  // Venue Identity + Dashboard
  app.use('/v1/venues', venueIdentityRoutes);
  app.use('/v1/venues', venueDashboardRoutes);

  // Chat Sessions, Blur/Reveal, E2EE
  app.use('/v1/conversations', sessionRoutes);
  app.use('/v1/photos', blurRoutes);
  app.use('/v1/e2ee', e2eeRoutes);

  // Billing
  app.use('/v1/billing', billingRoutes);

  // Test-only routes (NODE_ENV=test only — never in production)
  if (config.nodeEnv === 'test') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires -- conditional load to avoid test routes in prod
    const testRoutes = require('./modules/test/test.routes').default;
    app.use('/v1/test', testRoutes);
  }

  // Extended Admin API — must mount before base admin routes so that
  // /users/list and /users/search match before /:userId
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- conditional load for admin-extended
  const adminExtendedRoutes = require('./modules/admin/admin-extended.routes').default;
  app.use('/v1/admin', adminExtendedRoutes);

  // Admin API (base routes with :userId params — after extended)
  app.use('/v1/admin', adminRoutes);

  // Trust score endpoint on user routes
  const trustSvc = new TrustScoreService();
  app.get('/v1/users/:userId/trust-score', authMiddleware, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const userId = req.params.userId as string;
      const score = await trustSvc.getScore(userId);
      res.json({ data: score });
    } catch (err) { next(err); }
  });

  app.use(errorHandler);

  return app;
}
