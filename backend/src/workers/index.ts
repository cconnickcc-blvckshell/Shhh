import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { logger } from '../config/logger';
import { PresenceService } from '../modules/discovery/presence.service';
import { IntentService } from '../modules/users/intent.service';
import { ChatSessionService } from '../modules/messaging/session.service';
import { MediaService } from '../modules/media/media.service';
import { WhisperService } from '../modules/discovery/whisper.service';
import { EventLifecycleService } from '../modules/events/lifecycle.service';
import { ComplianceService } from '../modules/compliance/compliance.service';
import { MessagingService } from '../modules/messaging/messaging.service';

const connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null });

const presenceSvc = new PresenceService();
const intentSvc = new IntentService();
const sessionSvc = new ChatSessionService();
const mediaSvc = new MediaService();
const whisperSvc = new WhisperService();
const lifecycleSvc = new EventLifecycleService();
const complianceSvc = new ComplianceService();
const messagingSvc = new MessagingService();

// Cleanup queue — runs scheduled jobs
const cleanupQueue = new Queue('cleanup', { connection });

export async function startWorkers() {
  const worker = new Worker('cleanup', async (job) => {
    const start = Date.now();

    switch (job.name) {
      case 'decay-presence': {
        const count = await presenceSvc.decayExpired();
        logger.info({ count, duration: Date.now() - start }, 'Presence decay complete');
        break;
      }
      case 'clean-intents': {
        const count = await intentSvc.cleanExpired();
        logger.info({ count, duration: Date.now() - start }, 'Intent cleanup complete');
        break;
      }
      case 'expire-sessions': {
        const count = await sessionSvc.expireSessionChats();
        logger.info({ count, duration: Date.now() - start }, 'Session expiry complete');
        break;
      }
      case 'cleanup-media': {
        const count = await mediaSvc.cleanupExpired();
        logger.info({ count, duration: Date.now() - start }, 'Media cleanup complete');
        break;
      }
      case 'clean-whispers': {
        const count = await whisperSvc.cleanExpired();
        logger.info({ count, duration: Date.now() - start }, 'Whisper cleanup complete');
        break;
      }
      case 'event-lifecycle': {
        const count = await lifecycleSvc.transitionEvents();
        logger.info({ count, duration: Date.now() - start }, 'Event lifecycle complete');
        break;
      }
      case 'process-deletions': {
        const count = await complianceSvc.processDeletionRequests(10);
        logger.info({ count, duration: Date.now() - start }, 'Deletion requests processed');
        break;
      }
      case 'archive-conversations': {
        const count = await messagingSvc.processArchiveConversations();
        logger.info({ count, duration: Date.now() - start }, 'Conversations archived');
        break;
      }
    }
  }, { connection, concurrency: 2 });

  worker.on('failed', (job, err) => {
    logger.error({ job: job?.name, err }, 'Worker job failed');
  });

  // Schedule recurring jobs
  await cleanupQueue.upsertJobScheduler('presence-decay', { every: 60000 }, { name: 'decay-presence' });
  await cleanupQueue.upsertJobScheduler('intent-cleanup', { every: 300000 }, { name: 'clean-intents' });
  await cleanupQueue.upsertJobScheduler('session-expiry', { every: 300000 }, { name: 'expire-sessions' });
  await cleanupQueue.upsertJobScheduler('media-cleanup', { every: 600000 }, { name: 'cleanup-media' });
  await cleanupQueue.upsertJobScheduler('whisper-cleanup', { every: 300000 }, { name: 'clean-whispers' });
  await cleanupQueue.upsertJobScheduler('event-lifecycle', { every: 60000 }, { name: 'event-lifecycle' });
  await cleanupQueue.upsertJobScheduler('process-deletions', { every: 300000 }, { name: 'process-deletions' });
  await cleanupQueue.upsertJobScheduler('archive-conversations', { every: 60000 }, { name: 'archive-conversations' });

  logger.info('Background workers started — presence (1m), intents (5m), sessions (5m), media (10m), whispers (5m), events (1m), deletions (5m), archive (1m)');
}
