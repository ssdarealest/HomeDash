import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app';
import { signSessionJwt } from '@homedash/server-runtime';

describe('Hono Backend Application', () => {
  const jwtSecret = 'test-secret-key-at-least-32-bytes-long!';
  const app = createApp({ jwtSecret });

  it('should return health check ok on GET /health', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('homedash-api');
    expect(body.timestamp).toBeDefined();
  });

  it('should return OpenAPI document on GET /openapi.json', async () => {
    const res = await app.request('/openapi.json');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.openapi).toMatch(/^3\./);
    expect(body.info.title).toBe('Family OS API');
  });

  it('should reject unauthenticated request on POST /vault/break-glass/initiate with 401', async () => {
    const res = await app.request('/vault/break-glass/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }),
    });

    expect(res.status).toBe(401);
  });

  it('should reject caregiver_guest on POST /vault/break-glass/initiate with 403', async () => {
    const caregiverToken = await signSessionJwt(
      {
        userId: '44444444-4444-4444-4444-444444444444',
        householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        role: 'caregiver_guest',
      },
      jwtSecret
    );

    const res = await app.request('/vault/break-glass/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${caregiverToken}`,
      },
      body: JSON.stringify({ householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }),
    });

    expect(res.status).toBe(403);
  });

  it('should validate inputs on POST /vault/break-glass/initiate and reject invalid UUID', async () => {
    const adminToken = await signSessionJwt(
      {
        userId: '11111111-1111-1111-1111-111111111111',
        householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        role: 'admin',
      },
      jwtSecret
    );

    const res = await app.request('/vault/break-glass/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ householdId: 'invalid-uuid' }),
    });

    expect(res.status).toBe(400);
  });

  it('should allow authorized member on POST /vault/break-glass/initiate', async () => {
    const adminToken = await signSessionJwt(
      {
        userId: '11111111-1111-1111-1111-111111111111',
        householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        role: 'admin',
      },
      jwtSecret
    );

    const res = await app.request('/vault/break-glass/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('pending_cooldown');
  });
});
