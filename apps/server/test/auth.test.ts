import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app';
import { signSessionJwt } from '@homedash/server-runtime';

describe('Auth REST Endpoints (/api/v1/auth)', () => {
  const jwtSecret = 'test-jwt-secret-for-integration-testing-at-least-32-chars';
  const app = createApp({ jwtSecret });

  it('should allow admin to generate caregiver invite magic link', async () => {
    const adminToken = await signSessionJwt(
      {
        userId: '11111111-1111-1111-1111-111111111111',
        householdId: '22222222-2222-2222-2222-222222222222',
        role: 'admin',
      },
      jwtSecret
    );

    const res = await app.request('/api/v1/auth/caregiver/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        patientMemberId: '33333333-3333-3333-3333-333333333333',
        caregiverName: 'Nurse Sarah',
        ttlHours: 8,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.inviteUrl).toContain(body.token);
    expect(body.expiresAt).toBeDefined();
  });

  it('should forbid teen_child from creating caregiver invite', async () => {
    const teenToken = await signSessionJwt(
      {
        userId: '55555555-5555-5555-5555-555555555555',
        householdId: '22222222-2222-2222-2222-222222222222',
        role: 'teen_child',
      },
      jwtSecret
    );

    const res = await app.request('/api/v1/auth/caregiver/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teenToken}`,
      },
      body: JSON.stringify({
        patientMemberId: '33333333-3333-3333-3333-333333333333',
        caregiverName: 'Nurse Sarah',
      }),
    });

    expect(res.status).toBe(403);
  });

  it('should consume valid caregiver magic link and return caregiver_guest session', async () => {
    // 1. Admin generates invite
    const adminToken = await signSessionJwt(
      {
        userId: '11111111-1111-1111-1111-111111111111',
        householdId: '22222222-2222-2222-2222-222222222222',
        role: 'admin',
      },
      jwtSecret
    );

    const inviteRes = await app.request('/api/v1/auth/caregiver/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        patientMemberId: '33333333-3333-3333-3333-333333333333',
        caregiverName: 'Nurse Sarah',
        ttlHours: 4,
      }),
    });
    const { token: magicToken } = await inviteRes.json();

    // 2. Caregiver consumes token
    const consumeRes = await app.request('/api/v1/auth/caregiver/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: magicToken }),
    });

    expect(consumeRes.status).toBe(200);
    const consumeBody = await consumeRes.json();
    expect(consumeBody.sessionToken).toBeDefined();
    expect(consumeBody.role).toBe('caregiver_guest');
    expect(consumeBody.householdId).toBe('22222222-2222-2222-2222-222222222222');

    // 3. Verify session works on /auth/me
    const meRes = await app.request('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${consumeBody.sessionToken}` },
    });
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.role).toBe('caregiver_guest');
    expect(meBody.isTemporaryCaregiver).toBe(true);
  });

  it('should reject invalid caregiver token on consume', async () => {
    const res = await app.request('/api/v1/auth/caregiver/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid.tampered.token' }),
    });
    expect(res.status).toBe(401);
  });

  it('should generate WebAuthn passkey registration and login options', async () => {
    const regRes = await app.request('/api/v1/auth/passkey/register/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'alice@homedash.local',
        displayName: 'Alice Johnson',
      }),
    });
    expect(regRes.status).toBe(200);
    const regBody = await regRes.json();
    expect(regBody.challenge).toBeDefined();
    expect(regBody.rp.id).toBeDefined();

    const loginRes = await app.request('/api/v1/auth/passkey/login/options', {
      method: 'POST',
    });
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody.challenge).toBeDefined();
  });

  it('should prevent replay of consumed caregiver magic link token', async () => {
    const adminToken = await signSessionJwt(
      {
        userId: '11111111-1111-1111-1111-111111111111',
        householdId: '22222222-2222-2222-2222-222222222222',
        role: 'admin',
      },
      jwtSecret
    );

    const inviteRes = await app.request('/api/v1/auth/caregiver/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        patientMemberId: '33333333-3333-3333-3333-333333333333',
        caregiverName: 'Nurse Replay Test',
        ttlHours: 4,
      }),
    });
    const { token } = await inviteRes.json();

    // First consumption succeeds
    const firstConsume = await app.request('/api/v1/auth/caregiver/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    expect(firstConsume.status).toBe(200);

    // Second consumption (replay) must be rejected
    const secondConsume = await app.request('/api/v1/auth/caregiver/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    expect(secondConsume.status).toBe(401);
  });
});
