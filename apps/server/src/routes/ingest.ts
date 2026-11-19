import { Hono } from 'hono';
import { AndroidPushNotificationSchema } from '@homedash/protocol';
import { AndroidIngestService } from '@homedash/server-runtime';

export interface IngestRouterOptions {
  androidIngestService: AndroidIngestService;
}

export function createIngestRouter(opts: IngestRouterOptions) {
  const router = new Hono();
  const { androidIngestService } = opts;

  router.post('/android-notification', async (c) => {
    const householdId = c.req.header('X-HomeDash-Household-Id');
    const signature = c.req.header('X-HomeDash-Signature');

    if (!householdId || !signature) {
      return c.json({ error: 'Missing household or signature header' }, 401);
    }

    const rawBody = await c.req.text();
    let payloadJson: any;
    try {
      payloadJson = JSON.parse(rawBody);
    } catch {
      return c.json({ error: 'Invalid JSON payload' }, 400);
    }

    const parseResult = AndroidPushNotificationSchema.safeParse(payloadJson);
    if (!parseResult.success) {
      return c.json({ error: 'Validation failed', issues: parseResult.error.issues }, 400);
    }

    const result = await androidIngestService.ingestNotification(
      householdId,
      parseResult.data,
      rawBody,
      signature
    );

    if (result.status === 'rejected') {
      return c.json({ error: result.error || 'Ingestion rejected' }, 401);
    }

    return c.json(result, 200);
  });

  return router;
}
