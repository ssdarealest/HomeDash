import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import {
  BreakGlassInitiateSchema,
  createOpenAPIDocument,
} from '@homedash/protocol';

export function createApp() {
  const app = new Hono();

  // Enable CORS
  app.use('*', cors());

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

  // Vault break-glass initiation with validation
  app.post(
    '/vault/break-glass/initiate',
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
