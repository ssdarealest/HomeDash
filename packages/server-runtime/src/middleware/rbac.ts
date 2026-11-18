import type { MiddlewareHandler } from 'hono';
import type { UserRole } from '@homedash/protocol';
import { verifySessionJwt, type SessionPayload } from '../auth/jwt';

export function requireRole(allowedRoles: UserRole[]): MiddlewareHandler {
  return async (c, next) => {
    const session = c.get('session' as any) as SessionPayload | undefined;
    if (!session) {
      return c.json({ error: 'Unauthorized: missing active session' }, 401);
    }

    if (!allowedRoles.includes(session.role)) {
      return c.json(
        {
          error: `Forbidden: insufficient role permissions. Required: [${allowedRoles.join(', ')}], current: ${session.role}`,
        },
        403
      );
    }

    await next();
  };
}

export function blockCaregiverFromSensitiveModules(jwtSecret?: string): MiddlewareHandler {
  return async (c, next) => {
    let session = c.get('session' as any) as SessionPayload | undefined;

    if (!session && jwtSecret) {
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7).trim()
        : c.req.query('token');
      if (token) {
        session = (await verifySessionJwt(token, jwtSecret)) || undefined;
        if (session) {
          c.set('session' as any, session);
        }
      }
    }

    if (session?.role === 'caregiver_guest') {
      const path = c.req.path;
      if (/(?:^|\/)(finance|vault)(?:\/|$)/i.test(path)) {
        return c.json(
          {
            error: 'Forbidden: Caregivers cannot access financial ledgers or zero-knowledge vault',
          },
          403
        );
      }
    }

    await next();
  };
}
