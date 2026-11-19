import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  BreakGlassInitiateSchema,
  BreakGlassVetoSchema,
} from '@homedash/protocol';
import {
  authMiddleware,
  requireRole,
  VaultBreakGlassService,
} from '@homedash/server-runtime';

export interface VaultBreakGlassRouterOptions {
  vaultBreakGlassService: VaultBreakGlassService;
  jwtSecret: string;
}

export function createVaultBreakGlassRouter(opts: VaultBreakGlassRouterOptions) {
  const router = new Hono();
  const { vaultBreakGlassService, jwtSecret } = opts;

  router.use('*', authMiddleware(jwtSecret));

  router.post(
    '/initiate',
    requireRole(['admin', 'senior', 'teen_child']),
    zValidator('json', BreakGlassInitiateSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const session = c.get('session' as any);
      const { householdId } = c.req.valid('json');
      const result = await vaultBreakGlassService.initiateBreakGlass(householdId, session?.userId);
      return c.json(result, 200);
    }
  );

  router.post(
    '/veto',
    requireRole(['admin']),
    zValidator('json', BreakGlassVetoSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const { requestId, vetoToken } = c.req.valid('json');
      const result = await vaultBreakGlassService.vetoBreakGlass(requestId, vetoToken);
      if (!result) {
        return c.json({ error: 'Invalid veto token or request not pending' }, 400);
      }
      return c.json(result, 200);
    }
  );

  router.get('/status/:id', async (c) => {
    const id = c.req.param('id');
    const result = await vaultBreakGlassService.getStatus(id);
    if (!result) return c.json({ error: 'Request not found' }, 404);
    return c.json(result, 200);
  });

  router.get('/escrow-shares/:id', async (c) => {
    const id = c.req.param('id');
    const session = c.get('session' as any);
    const shares = await vaultBreakGlassService.getEscrowShares(id, session?.userId);
    if (!shares) {
      return c.json({ error: 'Unauthorized or request not approved' }, 403);
    }
    return c.json({ escrowShares: shares }, 200);
  });

  router.get('/emergency-items/:id', async (c) => {
    const id = c.req.param('id');
    const session = c.get('session' as any);
    const items = await vaultBreakGlassService.getEmergencyVaultItems(id, session?.userId);
    if (!items) {
      return c.json({ error: 'Unauthorized or request not approved' }, 403);
    }
    return c.json({ vaultItems: items }, 200);
  });

  return router;
}
