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
} from '@homedash/server-runtime';
import { createAuthRouter } from './routes/auth';

export interface AppOptions {
  jwtSecret?: string;
  magicLinkSecret?: string;
  rpId?: string;
}

export function createApp(opts?: AppOptions) {
  const app = new Hono();
  const jwtSecret = opts?.jwtSecret || process.env.JWT_SECRET || 'homedash_fallback_development_secret_key_32_bytes!';

  // Enable CORS
  app.use('*', cors());

  // Block caregivers from financial ledgers and zero-knowledge vault globally
  app.use('*', blockCaregiverFromSensitiveModules());

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
