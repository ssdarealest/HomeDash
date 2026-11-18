import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { verifySessionToken, type SyncPubSub } from '@homedash/server-runtime';

export interface RealtimeRouterOptions {
  pubsub: SyncPubSub;
  jwtSecret: string;
}

export function createRealtimeRouter(opts: RealtimeRouterOptions) {
  const router = new Hono();
  const { pubsub, jwtSecret } = opts;

  // GET /realtime/stream
  router.get('/stream', async (c) => {
    // Authenticate via query param token or Bearer authorization header
    const token =
      c.req.query('token') ||
      c.req.header('authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return c.json({ error: 'Unauthorized: missing session token' }, 401);
    }

    const payload = await verifySessionToken(token, jwtSecret);
    if (!payload) {
      return c.json({ error: 'Unauthorized: invalid or expired session token' }, 401);
    }

    const householdId = payload.householdId;

    return streamSSE(c, async (stream) => {
      let unsubscribe: (() => void) | undefined;
      try {
        // Initial handshake confirmation
        await stream.writeSSE({
          event: 'connected',
          data: JSON.stringify({
            householdId,
            userId: payload.userId,
            timestamp: new Date().toISOString(),
          }),
        });

        // Subscribe to real-time sync invalidations for this household
        unsubscribe = pubsub.subscribe(householdId, async (event) => {
          try {
            await stream.writeSSE({
              event: 'sync:invalidate',
              data: JSON.stringify(event),
            });
          } catch {
            // Stream might be closed
          }
        });

        stream.onAbort(() => {
          unsubscribe?.();
        });

        // Heartbeat ping interval to keep connection alive across reverse proxies
        while (!stream.aborted) {
          await stream.sleep(30000);
          if (!stream.aborted) {
            try {
              await stream.writeSSE({ event: 'ping', data: 'heartbeat' });
            } catch {
              break;
            }
          }
        }
      } finally {
        unsubscribe?.();
      }
    });
  });

  return router;
}
