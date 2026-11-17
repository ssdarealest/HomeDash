import { describe, it, expect } from 'vitest';
import { signSessionJwt, verifySessionJwt } from '../src/auth/jwt';

describe('Session JWT Auth', () => {
  const secret = 'super-secret-jwt-signing-key-32-bytes-minimum!';

  it('should sign and verify valid session JWT', async () => {
    const payload = {
      userId: '11111111-1111-1111-1111-111111111111',
      householdId: '22222222-2222-2222-2222-222222222222',
      role: 'admin' as const,
    };

    const token = await signSessionJwt(payload, secret, '1h');
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = await verifySessionJwt(token, secret);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.householdId).toBe(payload.householdId);
    expect(verified?.role).toBe(payload.role);
  });

  it('should reject JWT signed with different secret', async () => {
    const payload = {
      userId: '11111111-1111-1111-1111-111111111111',
      householdId: '22222222-2222-2222-2222-222222222222',
      role: 'senior' as const,
    };

    const token = await signSessionJwt(payload, secret, '1h');
    const wrongSecret = 'another-wrong-secret-key-that-does-not-match!';
    const verified = await verifySessionJwt(token, wrongSecret);
    expect(verified).toBeNull();
  });

  it('should reject expired JWT token', async () => {
    const payload = {
      userId: '11111111-1111-1111-1111-111111111111',
      householdId: '22222222-2222-2222-2222-222222222222',
      role: 'teen_child' as const,
    };

    // Sign with 0s expiry (immediately expired)
    const token = await signSessionJwt(payload, secret, '-10s');
    const verified = await verifySessionJwt(token, secret);
    expect(verified).toBeNull();
  });
});
