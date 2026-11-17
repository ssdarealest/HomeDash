import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { rlsContextMiddleware } from '../src/middleware/rls';

describe('RLS Context Middleware', () => {
  it('should set PostgreSQL session variables safely via parameterized set_config', async () => {
    const executedQueries: { sql: string; params?: any[] }[] = [];

    const mockDb = {
      unsafe: async (sql: string, params?: any[]) => {
        executedQueries.push({ sql, params });
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
    expect(executedQueries[0].sql).toContain("set_config('app.current_household_id'");
    expect(executedQueries[0].params).toEqual([
      '22222222-2222-2222-2222-222222222222',
      '11111111-1111-1111-1111-111111111111',
      'admin',
    ]);
  });
});
