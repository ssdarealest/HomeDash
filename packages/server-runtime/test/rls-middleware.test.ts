import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { rlsContextMiddleware } from '../src/middleware/rls';

describe('RLS Context Middleware', () => {
  it('should set PostgreSQL session variables for transaction', async () => {
    const executedQueries: string[] = [];

    const mockDb = {
      unsafe: async (query: string) => {
        executedQueries.push(query);
      },
    };

    const app = new Hono();
    // Simulate auth setting session
    app.use('*', async (c, next) => {
      c.set('session' as any, {
        userId: '11111111-1111-1111-1111-111111111111',
        householdId: '22222222-2222-2222-2222-222222222222',
        role: 'admin',
      });
      await next();
    });

    app.use('*', rlsContextMiddleware(() => mockDb));

    app.get('/test', (c) => c.json({ ok: true }));

    const res = await app.request('/test');
    expect(res.status).toBe(200);

    expect(executedQueries.length).toBe(1);
    expect(executedQueries[0]).toContain("SET LOCAL app.current_household_id = '22222222-2222-2222-2222-222222222222'");
    expect(executedQueries[0]).toContain("SET LOCAL app.current_user_id = '11111111-1111-1111-1111-111111111111'");
    expect(executedQueries[0]).toContain("SET LOCAL app.current_user_role = 'admin'");
  });
});
