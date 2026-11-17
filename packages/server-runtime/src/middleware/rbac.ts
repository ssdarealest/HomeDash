import type { MiddlewareHandler } from 'hono';
import type { UserRole } from '@homedash/protocol';
import type { SessionPayload } from '../auth/jwt';

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

export function blockCaregiverFromSensitiveModules(): MiddlewareHandler {
  return async (c, next) => {
    const session = c.get('session' as any) as SessionPayload | undefined;
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
