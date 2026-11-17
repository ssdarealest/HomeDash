import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import {
  authMiddleware,
  requireRole,
  signSessionJwt,
  generateCaregiverMagicToken,
  verifyCaregiverMagicToken,
  type SessionPayload,
} from '@homedash/server-runtime';

export interface AuthRouterOptions {
  jwtSecret: string;
  magicLinkSecret?: string;
  rpId?: string;
  rpName?: string;
  baseUrl?: string;
}

const CaregiverInviteSchema = z.object({
  patientMemberId: z.string().uuid(),
  caregiverName: z.string().min(1).max(100),
  ttlHours: z.number().int().min(1).max(72).default(8),
});

const CaregiverConsumeSchema = z.object({
  token: z.string().min(10),
});

const PasskeyRegisterOptionsSchema = z.object({
  username: z.string().min(3),
  displayName: z.string().min(1),
});

export function createAuthRouter(opts: AuthRouterOptions) {
  const router = new Hono();
  const magicSecret = opts.magicLinkSecret || opts.jwtSecret;
  const rpId = opts.rpId || 'localhost';
  const rpName = opts.rpName || 'HomeDash Family OS';
  const baseUrl = opts.baseUrl || 'http://localhost:3000';

  // 1. Generate Caregiver Magic Link (Admin only)
  router.post(
    '/caregiver/invite',
    authMiddleware(opts.jwtSecret),
    requireRole(['admin']),
    zValidator('json', CaregiverInviteSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
      }
    }),
    async (c) => {
      const session = c.get('session' as any) as SessionPayload;
      const { patientMemberId, caregiverName, ttlHours } = c.req.valid('json');

      const token = await generateCaregiverMagicToken(
        {
          householdId: session.householdId,
          patientMemberId,
          caregiverName,
          ttlHours,
        },
        magicSecret
      );

      const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
      const inviteUrl = `${baseUrl}/invite/caregiver?token=${encodeURIComponent(token)}`;

      return c.json({
        token,
        inviteUrl,
        expiresAt,
        caregiverName,
        patientMemberId,
      });
    }
  );

  // 2. Consume Caregiver Magic Link
  router.post(
    '/caregiver/consume',
    zValidator('json', CaregiverConsumeSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
      }
    }),
    async (c) => {
      const { token } = c.req.valid('json');
      const claims = await verifyCaregiverMagicToken(token, magicSecret);

      if (!claims) {
        return c.json({ error: 'Invalid or expired caregiver magic token' }, 401);
      }

      // Generate a temporary caregiver session JWT (duration matching token remaining TTL)
      const remainingSeconds = Math.max(60, Math.floor((claims.expiresAt - Date.now()) / 1000));
      const caregiverUserId = `guest-${crypto.randomUUID().slice(0, 8)}`;

      const sessionToken = await signSessionJwt(
        {
          userId: caregiverUserId,
          householdId: claims.householdId,
          role: 'caregiver_guest',
          isTemporaryCaregiver: true,
        },
        opts.jwtSecret,
        remainingSeconds
      );

      return c.json({
        sessionToken,
        role: 'caregiver_guest',
        householdId: claims.householdId,
        patientMemberId: claims.patientMemberId,
        caregiverName: claims.caregiverName,
        expiresAt: new Date(claims.expiresAt).toISOString(),
      });
    }
  );

  // 3. Current Authenticated Profile / Session Check
  router.get('/me', authMiddleware(opts.jwtSecret), async (c) => {
    const session = c.get('session' as any) as SessionPayload;
    return c.json({
      userId: session.userId,
      householdId: session.householdId,
      role: session.role,
      isTemporaryCaregiver: session.isTemporaryCaregiver ?? false,
      expiresAt: session.exp ? new Date(session.exp * 1000).toISOString() : null,
    });
  });

  // 4. WebAuthn Passkey Registration Options
  router.post(
    '/passkey/register/options',
    zValidator('json', PasskeyRegisterOptionsSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
      }
    }),
    async (c) => {
      const { username, displayName } = c.req.valid('json');
      const randomChallenge = Buffer.from(crypto.getRandomValues(new Uint8Array(32)))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const userIdBase64 = Buffer.from(crypto.randomUUID()).toString('base64url');

      return c.json({
        challenge: randomChallenge,
        rp: {
          name: rpName,
          id: rpId,
        },
        user: {
          id: userIdBase64,
          name: username,
          displayName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        timeout: 60000,
        attestation: 'none',
      });
    }
  );

  // 5. WebAuthn Passkey Login Options
  router.post('/passkey/login/options', async (c) => {
    const randomChallenge = Buffer.from(crypto.getRandomValues(new Uint8Array(32)))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return c.json({
      challenge: randomChallenge,
      rpId,
      timeout: 60000,
      userVerification: 'preferred',
    });
  });

  return router;
}
