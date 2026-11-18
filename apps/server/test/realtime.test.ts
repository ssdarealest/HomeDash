import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import {
  signSessionToken,
  SyncPubSub,
} from '@homedash/server-runtime';

describe('Server Realtime SSE Channel', () => {
  const jwtSecret = 'test_jwt_secret_key_at_least_32_bytes_long!!';
  const householdId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  let app: ReturnType<typeof createApp>;
  let pubsub: SyncPubSub;
  let adminToken: string;

  beforeEach(async () => {
    pubsub = new SyncPubSub();
    app = createApp({
      jwtSecret,
      pubsub,
    } as any);

    adminToken = await signSessionToken(
      {
        userId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        householdId,
        role: 'admin',
      },
      jwtSecret
    );
  });

  it('should reject unauthenticated connections to /api/v1/realtime/stream with 401', async () => {
    const res = await app.request('/api/v1/realtime/stream');
    expect(res.status).toBe(401);
  });

  it('should accept authenticated SSE connections with valid token query parameter', async () => {
    const res = await app.request(`/api/v1/realtime/stream?token=${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
  });

  it('should accept authenticated SSE connections with Bearer Authorization header', async () => {
    const res = await app.request('/api/v1/realtime/stream', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
  });
});
