import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { logger } from '../config/logger';
import { workerJobFailuresTotal } from '../middleware/metrics';
import { PresenceService } from '../modules/discovery/presence.service';
import { IntentService } from '../modules/users/intent.service';
import { ChatSessionService } from '../modules/messaging/session.service';
import { MediaService } from '../modules/media/media.service';
import { WhisperService } from '../modules/discovery/whisper.service';
import { EventLifecycleService } from '../modules/events/lifecycle.service';
import { ComplianceService } from '../modules/compliance/compliance.service';
import { MessagingService } from '../modules/messaging/messaging.service';
import { SafetyService } from '../modules/safety/safety.service';

const connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null });

const presenceSvc = new PresenceService();
const intentSvc = new IntentService();
const sessionSvc = new ChatSessionService();
const mediaSvc = new MediaService();
const whisperSvc = new WhisperService();
const lifecycleSvc = new EventLifecycleService();
const complianceSvc = new ComplianceService();
const messagingSvc = new MessagingService();
const safetySvc = new SafetyService();

// Cleanup queue — runs scheduled jobs
const cleanupQueue = new Queue('cleanup', { connection });

// Dead-letter queue for jobs that exhaust retries
const dlq = new Queue('cleanup-dlq', { connection });

const WORKER_ATTEMPTS = 3;
const WORKER_BACKOFF_MS = 5000;

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
      case 'process-missed-checkins': {
        const count = await safetySvc.processMissedCheckins(20);
        logger.info({ count, duration: Date.now() - start }, 'Missed check-in alerts sent');
        break;
      }
    }
  }, { connection, concurrency: 2, removeOnComplete: { count: 100 } });

  worker.on('failed', async (job, err) => {
    workerJobFailuresTotal.inc({ job: job?.name ?? 'unknown' });
    logger.error({ job: job?.name, attemptsMade: job?.attemptsMade, err }, 'Worker job failed');

    if (job && job.attemptsMade >= WORKER_ATTEMPTS) {
      try {
        await dlq.add(
          `dlq-${job.name}-${job.id}`,
          {
            originalJob: job.name,
            originalId: job.id,
            data: job.data,
            failedReason: err?.message,
            attemptsMade: job.attemptsMade,
          },
          { jobId: `dlq-${job.name}-${Date.now()}-${Math.random().toString(36).slice(2)}` }
        );
        logger.info({ job: job.name, originalId: job.id }, 'Job moved to DLQ');
      } catch (dlqErr) {
        logger.error({ err: dlqErr, job: job.name }, 'Failed to move job to DLQ');
      }
    }
  });

  const jobOpts = { attempts: WORKER_ATTEMPTS, backoff: { type: 'exponential' as const, delay: WORKER_BACKOFF_MS } };

  // Schedule recurring jobs (with retry + DLQ on exhaustion)
  await cleanupQueue.upsertJobScheduler('presence-decay', { every: 60000 }, { name: 'decay-presence', ...jobOpts });
  await cleanupQueue.upsertJobScheduler('intent-cleanup', { every: 300000 }, { name: 'clean-intents', ...jobOpts });
  await cleanupQueue.upsertJobScheduler('session-expiry', { every: 300000 }, { name: 'expire-sessions', ...jobOpts });
  await cleanupQueue.upsertJobScheduler('media-cleanup', { every: 600000 }, { name: 'cleanup-media', ...jobOpts });
  await cleanupQueue.upsertJobScheduler('whisper-cleanup', { every: 300000 }, { name: 'clean-whispers', ...jobOpts });
  await cleanupQueue.upsertJobScheduler('event-lifecycle', { every: 60000 }, { name: 'event-lifecycle', ...jobOpts });
  await cleanupQueue.upsertJobScheduler('process-deletions', { every: 300000 }, { name: 'process-deletions', ...jobOpts });
  await cleanupQueue.upsertJobScheduler('archive-conversations', { every: 60000 }, { name: 'archive-conversations', ...jobOpts });
  await cleanupQueue.upsertJobScheduler('process-missed-checkins', { every: 120000 }, { name: 'process-missed-checkins', ...jobOpts });

  logger.info('Background workers started — presence (1m), intents (5m), sessions (5m), media (10m), whispers (5m), events (1m), deletions (5m), archive (1m), missed-checkins (2m)');
}
