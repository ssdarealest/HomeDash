import type { MiddlewareHandler } from 'hono';
import { verifySessionJwt } from '../auth/jwt';

export function authMiddleware(jwtSecret: string): MiddlewareHandler {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      // Fallback to query parameter ?token= for link/redirect consumption
      token = c.req.query('token');
    }

    if (!token) {
      return c.json({ error: 'Missing or malformed authorization header' }, 401);
    }

    const session = await verifySessionJwt(token, jwtSecret);
    if (!session) {
      return c.json({ error: 'Invalid or expired session token' }, 401);
    }

    c.set('session' as any, session);
    await next();
  };
}
