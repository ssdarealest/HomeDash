import { describe, it, expect } from 'vitest';
import {
  generateCaregiverMagicToken,
  verifyCaregiverMagicToken,
} from '../src/auth/magic-link';

describe('Caregiver Magic Link Auth', () => {
  const secret = 'caregiver-magic-link-hmac-secret-32-bytes-long!';

  it('should generate and verify valid time-bound caregiver token', async () => {
    const opts = {
      householdId: '22222222-2222-2222-2222-222222222222',
      patientMemberId: '33333333-3333-3333-3333-333333333333',
      caregiverName: 'Nurse Sarah',
      ttlHours: 8,
    };

    const token = await generateCaregiverMagicToken(opts, secret);
    expect(typeof token).toBe('string');
    expect(token).toContain('.');

    const claims = await verifyCaregiverMagicToken(token, secret);
    expect(claims).not.toBeNull();
    expect(claims?.householdId).toBe(opts.householdId);
    expect(claims?.patientMemberId).toBe(opts.patientMemberId);
    expect(claims?.caregiverName).toBe(opts.caregiverName);
    expect(claims?.role).toBe('caregiver_guest');
    expect(claims?.expiresAt).toBeGreaterThan(Date.now());
  });

  it('should reject tampered caregiver token signature', async () => {
    const opts = {
      householdId: '22222222-2222-2222-2222-222222222222',
      patientMemberId: '33333333-3333-3333-3333-333333333333',
      caregiverName: 'Nurse Sarah',
      ttlHours: 8,
    };

    const token = await generateCaregiverMagicToken(opts, secret);
    const [header, payload, sig] = token.split('.');
    const tampered = `${header}.${payload}.${sig.slice(0, -4)}abcd`;

    const claims = await verifyCaregiverMagicToken(tampered, secret);
    expect(claims).toBeNull();
  });

  it('should reject expired caregiver magic link token', async () => {
    const opts = {
      householdId: '22222222-2222-2222-2222-222222222222',
      patientMemberId: '33333333-3333-3333-3333-333333333333',
      caregiverName: 'Nurse Sarah',
      ttlHours: -1, // Expired 1 hour ago
    };

    const token = await generateCaregiverMagicToken(opts, secret);
    const claims = await verifyCaregiverMagicToken(token, secret);
    expect(claims).toBeNull();
  });
});
