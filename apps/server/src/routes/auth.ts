import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import {
  authMiddleware,
  requireRole,
  signSessionJwt,
  generateCaregiverMagicToken,
  verifyCaregiverMagicToken,
  InMemoryCacheClient,
  type CacheClient,
  type SessionPayload,
} from '@homedash/server-runtime';

export interface AuthRouterOptions {
  jwtSecret: string;
  magicLinkSecret?: string;
  rpId?: string;
  rpName?: string;
  baseUrl?: string;
  cache?: CacheClient;
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

const SessionMintSchema = z.object({
  role: z.enum(['admin', 'senior', 'teen_child', 'child', 'caregiver_guest']).default('admin'),
  householdId: z.string().min(1).default('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  userId: z.string().min(1).default(() => crypto.randomUUID()),
});

export function createAuthRouter(opts: AuthRouterOptions) {
  const router = new Hono();
  const magicSecret = opts.magicLinkSecret || opts.jwtSecret;
  const rpId = opts.rpId || 'localhost';
  const rpName = opts.rpName || 'HomeDash Family OS';
  const baseUrl = opts.baseUrl || 'http://localhost:3000';
  const cache = opts.cache || new InMemoryCacheClient();

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

  // 2. Consume Caregiver Magic Link with Replay Protection
  router.post(
    '/caregiver/consume',
    zValidator('json', CaregiverConsumeSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
      }
    }),
    async (c) => {
      const { token } = c.req.valid('json');

      // Check single-use revocation cache to prevent replay
      const isConsumed = await cache.get(`revoked:magic:${token}`);
      if (isConsumed) {
        return c.json({ error: 'Token has already been consumed or revoked' }, 401);
      }

      const claims = await verifyCaregiverMagicToken(token, magicSecret);
      if (!claims) {
        return c.json({ error: 'Invalid or expired caregiver magic token' }, 401);
      }

      const remainingSeconds = Math.max(60, Math.floor((claims.expiresAt - Date.now()) / 1000));
      // Mark token as consumed in cache for the duration of its remaining validity
      await cache.set(`revoked:magic:${token}`, '1', remainingSeconds);

      const caregiverUserId = crypto.randomUUID();

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

  // 4. WebAuthn Passkey Registration Options (Stores challenge with 5-min TTL)
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

      // Persist challenge with 5-minute TTL to prevent replay
      await cache.set(`passkey:challenge:${username}`, randomChallenge, 300);

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

  // 5. WebAuthn Passkey Login Options (Stores challenge with 5-min TTL)
  router.post('/passkey/login/options', async (c) => {
    const randomChallenge = Buffer.from(crypto.getRandomValues(new Uint8Array(32)))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Persist login challenge with 5-minute TTL
    await cache.set(`passkey:challenge:anon:${randomChallenge}`, randomChallenge, 300);

    return c.json({
      challenge: randomChallenge,
      rpId,
      timeout: 60000,
      userVerification: 'preferred',
    });
  });

  // 6. Mint Session JWT (for web client, dev, and testing)
  router.post('/session', async (c) => {
    let rawBody: unknown = {};
    try {
      const text = await c.req.text();
      if (text && text.trim().length > 0) {
        rawBody = JSON.parse(text);
      }
    } catch {
      return c.json({ error: 'Validation failed', message: 'Invalid JSON body' }, 400);
    }

    const parseResult = SessionMintSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return c.json({ error: 'Validation failed', issues: parseResult.error.issues }, 400);
    }

    const { role, householdId, userId } = parseResult.data;
    const isTemporaryCaregiver = role === 'caregiver_guest';

    const sessionToken = await signSessionJwt(
      {
        userId,
        householdId,
        role: role as any,
        isTemporaryCaregiver,
      },
      opts.jwtSecret
    );

    return c.json({
      sessionToken,
      role,
      householdId,
      userId,
    });
  });

  return router;
}
