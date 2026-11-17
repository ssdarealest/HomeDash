import type { MiddlewareHandler } from 'hono';
import type { SessionPayload } from '../auth/jwt';

export interface DbSessionClient {
  unsafe: (sql: string) => Promise<any>;
}

export function rlsContextMiddleware(
  getDbClient: (c: any) => DbSessionClient | Promise<DbSessionClient>
): MiddlewareHandler {
  return async (c, next) => {
    const session = c.get('session' as any) as SessionPayload | undefined;
    if (session) {
      const db = await getDbClient(c);
      // Clean / escape parameter values
      const householdId = session.householdId.replace(/'/g, "''");
      const userId = session.userId.replace(/'/g, "''");
      const role = session.role.replace(/'/g, "''");

      const rlsContextSql = `
        SET LOCAL app.current_household_id = '${householdId}';
        SET LOCAL app.current_user_id = '${userId}';
        SET LOCAL app.current_user_role = '${role}';
      `.trim();

      await db.unsafe(rlsContextSql);
    }

    await next();
  };
}
