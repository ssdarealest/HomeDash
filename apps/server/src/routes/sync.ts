import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  SyncPushRequestSchema,
  SyncPullRequestSchema,
} from '@homedash/protocol';
import {
  authMiddleware,
  type SyncService,
} from '@homedash/server-runtime';

export interface SyncRouterOptions {
  syncService: SyncService;
  jwtSecret: string;
}

export function createSyncRouter(opts: SyncRouterOptions) {
  const router = new Hono();
  const { syncService, jwtSecret } = opts;

  // POST /sync/push
  router.post(
    '/push',
    authMiddleware(jwtSecret),
    zValidator('json', SyncPushRequestSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
      }
    }),
    async (c) => {
      const session = c.get('session' as any);
      const body = c.req.valid('json');

      if (!session || session.householdId !== body.householdId) {
        return c.json({ error: 'Forbidden: household mismatch' }, 403);
      }

      try {
        const result = await syncService.processPush(
          session.householdId,
          session.userId,
          session.role,
          body
        );
        return c.json(result, 200);
      } catch (err: any) {
        const msg = err?.message || 'Push sync failed';
        if (msg.includes('Forbidden')) {
          return c.json({ error: msg }, 403);
        }
        if (msg.includes('not eligible')) {
          return c.json({ error: msg }, 400);
        }
        return c.json({ error: msg }, 500);
      }
    }
  );

  // POST /sync/pull
  router.post(
    '/pull',
    authMiddleware(jwtSecret),
    zValidator('json', SyncPullRequestSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
      }
    }),
    async (c) => {
      const session = c.get('session' as any);
      const body = c.req.valid('json');

      if (!session || session.householdId !== body.householdId) {
        return c.json({ error: 'Forbidden: household mismatch' }, 403);
      }

      try {
        const result = await syncService.processPull(session.householdId, session.role, body);
        return c.json(result, 200);
      } catch (err: any) {
        const msg = err?.message || 'Pull sync failed';
        if (msg.includes('Forbidden')) {
          return c.json({ error: msg }, 403);
        }
        return c.json({ error: msg }, 500);
      }
    }
  );

  return router;
}
