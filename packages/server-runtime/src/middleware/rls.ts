import type { MiddlewareHandler } from 'hono';
import type { SessionPayload } from '../auth/jwt';

export interface DbSessionClient {
  unsafe: (sql: string, params?: any[]) => Promise<any>;
}

export function rlsContextMiddleware(
  getDbClient: (c: any) => DbSessionClient | Promise<DbSessionClient>
): MiddlewareHandler {
  return async (c, next) => {
    const session = c.get('session' as any) as SessionPayload | undefined;
    if (session) {
      const db = await getDbClient(c);
      // Parameterized set_config calls (is_local = true) to prevent SQL injection and transaction scope loss
      await db.unsafe(
        `SELECT set_config('app.current_household_id', $1, true), set_config('app.current_user_id', $2, true), set_config('app.current_user_role', $3, true);`,
        [session.householdId, session.userId, session.role]
      );
    }

    await next();
  };
}
