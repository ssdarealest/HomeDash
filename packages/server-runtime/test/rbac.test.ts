import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { signSessionJwt } from '../src/auth/jwt';
import {
  authMiddleware,
  requireRole,
  blockCaregiverFromSensitiveModules,
} from '../src/middleware/index';

describe('RBAC Middleware', () => {
  const secret = 'super-secret-jwt-signing-key-32-bytes-minimum!';

  const createApp = () => {
    const app = new Hono();
    app.use('*', authMiddleware(secret));
    app.use('*', blockCaregiverFromSensitiveModules());

    app.get('/public-protected', (c) => c.json({ ok: true, session: c.get('session' as any) }));
    app.get('/admin-only', requireRole(['admin']), (c) => c.json({ ok: true }));
    app.get('/finance/accounts', (c) => c.json({ accounts: [] }));
    app.get('/vault/items', (c) => c.json({ items: [] }));
    app.get('/caregiver/meds', (c) => c.json({ meds: [] }));

    return app;
  };

  it('should return 401 when Authorization header is missing', async () => {
    const app = createApp();
    const res = await app.request('/public-protected');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('authorization header');
  });

  it('should allow valid token and set session context', async () => {
    const app = createApp();
    const token = await signSessionJwt(
      {
        userId: '11111111-1111-1111-1111-111111111111',
        householdId: '22222222-2222-2222-2222-222222222222',
        role: 'teen_child',
      },
      secret
    );

    const res = await app.request('/public-protected', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.session.userId).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('should block non-admin role from admin-only routes with 403', async () => {
    const app = createApp();
    const token = await signSessionJwt(
      {
        userId: '11111111-1111-1111-1111-111111111111',
        householdId: '22222222-2222-2222-2222-222222222222',
        role: 'teen_child',
      },
      secret
    );

    const res = await app.request('/admin-only', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('insufficient role');
  });

  it('should strictly block caregiver_guest from /finance/* routes', async () => {
    const app = createApp();
    const token = await signSessionJwt(
      {
        userId: '44444444-4444-4444-4444-444444444444',
        householdId: '22222222-2222-2222-2222-222222222222',
        role: 'caregiver_guest',
      },
      secret
    );

    const res = await app.request('/finance/accounts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Caregivers cannot access financial ledgers or zero-knowledge vault');
  });

  it('should strictly block caregiver_guest from /vault/* routes', async () => {
    const app = createApp();
    const token = await signSessionJwt(
      {
        userId: '44444444-4444-4444-4444-444444444444',
        householdId: '22222222-2222-2222-2222-222222222222',
        role: 'caregiver_guest',
      },
      secret
    );

    const res = await app.request('/vault/items', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  it('should allow caregiver_guest to access allowed routes like /caregiver/meds', async () => {
    const app = createApp();
    const token = await signSessionJwt(
      {
        userId: '44444444-4444-4444-4444-444444444444',
        householdId: '22222222-2222-2222-2222-222222222222',
        role: 'caregiver_guest',
      },
      secret
    );

    const res = await app.request('/caregiver/meds', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });
});
