import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import {
  BreakGlassInitiateSchema,
  createOpenAPIDocument,
} from '@homedash/protocol';
import {
  authMiddleware,
  requireRole,
  blockCaregiverFromSensitiveModules,
  SyncService,
  SyncPubSub,
  InMemorySyncJournalStore,
  DailyOpsService,
  HealthService,
} from '@homedash/server-runtime';
import { createAuthRouter } from './routes/auth';
import { createSyncRouter } from './routes/sync';
import { createRealtimeRouter } from './routes/realtime';
import { createDailyOpsRouter } from './routes/daily-ops';
import { createHealthRouter } from './routes/health';

export interface AppOptions {
  jwtSecret?: string;
  magicLinkSecret?: string;
  rpId?: string;
  syncService?: SyncService;
  pubsub?: SyncPubSub;
  dailyOpsService?: DailyOpsService;
  healthService?: HealthService;
}

export function createApp(opts?: AppOptions) {
  const app = new Hono();
  const jwtSecret = opts?.jwtSecret || process.env.JWT_SECRET || 'thang_developer_rat_dep_trai!';
  const pubsub = opts?.pubsub || new SyncPubSub();
  const dailyOpsService = opts?.dailyOpsService || new DailyOpsService();
  const healthService = opts?.healthService || new HealthService();
  const syncService =
    opts?.syncService ||
    new SyncService({
      journalStore: new InMemorySyncJournalStore(),
      pubsub,
    });

  // Enable CORS
  app.use('*', cors());

  // Block caregivers from financial ledgers and zero-knowledge vault globally
  app.use('*', blockCaregiverFromSensitiveModules(jwtSecret));

  // Health check
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      service: 'homedash-api',
      timestamp: new Date().toISOString(),
    });
  });

  // OpenAPI specification
  app.get('/openapi.json', (c) => {
    return c.json(createOpenAPIDocument());
  });

  // Mount Auth Router under /api/v1/auth
  const authRouter = createAuthRouter({
    jwtSecret,
    magicLinkSecret: opts?.magicLinkSecret,
    rpId: opts?.rpId,
  });
  app.route('/api/v1/auth', authRouter);

  // Mount Sync Router under /api/v1/sync and /sync
  const syncRouter = createSyncRouter({
    syncService,
    jwtSecret,
  });
  app.route('/api/v1/sync', syncRouter);
  app.route('/sync', syncRouter);

  // Mount Realtime Router under /api/v1/realtime and /realtime
  const realtimeRouter = createRealtimeRouter({
    pubsub,
    jwtSecret,
  });
  app.route('/api/v1/realtime', realtimeRouter);
  app.route('/realtime', realtimeRouter);

  // Mount Daily Ops Router under /api/v1/daily-ops
  const dailyOpsRouter = createDailyOpsRouter({
    dailyOpsService,
    jwtSecret,
  });
  app.route('/api/v1/daily-ops', dailyOpsRouter);

  // Mount Health Router under /api/v1/health
  const healthRouter = createHealthRouter({
    healthService,
    jwtSecret,
  });
  app.route('/api/v1/health', healthRouter);

  // Vault break-glass initiation with auth and validation
  app.post(
    '/vault/break-glass/initiate',
    authMiddleware(jwtSecret),
    requireRole(['admin', 'senior', 'teen_child']),
    zValidator('json', BreakGlassInitiateSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
      }
    }),
    async (c) => {
      const { householdId } = c.req.valid('json');
      return c.json({
        status: 'pending_cooldown',
        householdId,
        cooldownExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });
    }
  );

  return app;
}
