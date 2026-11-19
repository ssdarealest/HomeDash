import { Hono } from 'hono';
import { BotWebhookPayloadSchema } from '@homedash/protocol';
import {
  HealthService,
  BotNotificationDispatcher,
} from '@homedash/server-runtime';
import { timingSafeEqual } from 'node:crypto';

export interface NotificationsRouterOptions {
  healthService: HealthService;
  botDispatcher: BotNotificationDispatcher;
  botSecretToken?: string;
}

export function createNotificationsRouter(opts: NotificationsRouterOptions) {
  const router = new Hono();
  const { healthService, botDispatcher, botSecretToken } = opts;

  router.post('/bot/webhook', async (c) => {
    if (botSecretToken) {
      const headerToken = c.req.header('X-Telegram-Bot-Api-Secret-Token');
      if (!headerToken) {
        return c.json({ error: 'Missing webhook secret token' }, 401);
      }
      const headerBuf = Buffer.from(headerToken);
      const secretBuf = Buffer.from(botSecretToken);
      if (headerBuf.length !== secretBuf.length || !timingSafeEqual(headerBuf, secretBuf)) {
        return c.json({ error: 'Invalid webhook secret token' }, 401);
      }
    }

    const body = await c.req.json().catch(() => null);
    if (!body) return c.json({ error: 'Invalid JSON body' }, 400);

    const parseResult = BotWebhookPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json({ error: 'Validation failed', issues: parseResult.error.issues }, 400);
    }

    const { callbackQuery } = parseResult.data;
    if (callbackQuery?.data) {
      const resolved = botDispatcher.resolveToken(callbackQuery.data);
      if (!resolved) {
        return c.json({ error: 'Invalid or expired action token' }, 400);
      }

      if (resolved.action === 'taken') {
        await healthService.takeMedication(
          resolved.data.medicationId,
          resolved.data.memberId,
          { takenAt: new Date().toISOString() }
        );
        return c.json({ ok: true, action: 'taken', message: 'Medication recorded as taken' }, 200);
      } else if (resolved.action === 'snooze') {
        await healthService.snoozeMedication(
          resolved.data.medicationId,
          resolved.data.memberId,
          15
        );
        return c.json({ ok: true, action: 'snooze', message: 'Medication snoozed for 15 minutes' }, 200);
      }
    }

    return c.json({ ok: true, message: 'Webhook received' }, 200);
  });

  return router;
}
