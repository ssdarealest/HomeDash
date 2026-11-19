import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import {
  signSessionJwt,
  VaultBreakGlassService,
} from '@homedash/server-runtime';

describe('Zero-Knowledge Vault Break-Glass Workflow (Phase 5 Task 5)', () => {
  const jwtSecret = 'test_secret_break_glass_phase5';
  let app: ReturnType<typeof createApp>;
  let vaultService: VaultBreakGlassService;
  let adminToken: string;
  let memberToken: string;
  const householdId = '11111111-4444-4111-a111-111111111111';
  const memberId = '22222222-5555-4222-a222-222222222222';
  const adminId = '33333333-6666-4333-a333-333333333333';

  beforeEach(async () => {
    vaultService = new VaultBreakGlassService();
    // Seed test escrow share and encrypted item
    vaultService.seedTestData(householdId, {
      escrowShares: [
        {
          shareIndex: 1,
          encryptedKekShare: 'base64_kek_share_data',
          ephemeralPublicKey: 'base64_ephem_pk',
          nonce: 'base64_nonce_24b',
        },
      ],
      vaultItems: [
        {
          id: 'vault-item-1',
          householdId,
          title: 'Emergency Medical Directives & Power of Attorney',
          category: 'medical_directive',
          encryptedPayload: 'ciphertext_base64_blob',
          payloadNonce: 'nonce_payload_base64',
          encryptedDek: 'ciphertext_dek_base64',
          dekNonce: 'nonce_dek_base64',
          keyVersion: 1,
        },
      ],
    });

    app = createApp({ jwtSecret, vaultBreakGlassService: vaultService });

    adminToken = await signSessionJwt(
      {
        userId: adminId,
        householdId,
        role: 'admin',
      },
      jwtSecret
    );

    memberToken = await signSessionJwt(
      {
        userId: memberId,
        householdId,
        role: 'senior',
      },
      jwtSecret
    );
  });

  it('handles break-glass initiation, admin veto cancellation, and rejection status', async () => {
    // 1. Initiate break-glass
    const initRes = await app.request('/api/v1/vault/break-glass/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ householdId }),
    });
    expect(initRes.status).toBe(200);
    const initData = await initRes.json();
    expect(initData.status).toBe('pending_cooldown');
    expect(initData.requestId).toBeDefined();
    expect(initData.vetoToken).toBeDefined();

    // 2. Admin vetoes with valid token
    const vetoRes = await app.request('/api/v1/vault/break-glass/veto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        requestId: initData.requestId,
        vetoToken: initData.vetoToken,
      }),
    });
    expect(vetoRes.status).toBe(200);
    const vetoData = await vetoRes.json();
    expect(vetoData.status).toBe('vetoed');

    // 3. Status is confirmed vetoed and cannot be approved
    const statusRes = await app.request(`/api/v1/vault/break-glass/status/${initData.requestId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();
    expect(statusData.status).toBe('vetoed');
  });

  it('transitions to approved upon cooldown expiration and serves escrow shares and emergency items', async () => {
    // 1. Initiate with zero cooldown (instant simulation)
    const requestId = await vaultService.initiateBreakGlassDirect(householdId, memberId, 0);

    // 2. Query status -> should evaluate cooldown expiration and transition to 'approved'
    const statusRes = await app.request(`/api/v1/vault/break-glass/status/${requestId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();
    expect(statusData.status).toBe('approved');

    // 3. Retrieve escrow shares
    const sharesRes = await app.request(`/api/v1/vault/break-glass/escrow-shares/${requestId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(sharesRes.status).toBe(200);
    const sharesData = await sharesRes.json();
    expect(sharesData.escrowShares.length).toBe(1);
    expect(sharesData.escrowShares[0].encryptedKekShare).toBe('base64_kek_share_data');

    // 4. Retrieve emergency vault items
    const itemsRes = await app.request(`/api/v1/vault/break-glass/emergency-items/${requestId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(itemsRes.status).toBe(200);
    const itemsData = await itemsRes.json();
    expect(itemsData.vaultItems.length).toBe(1);
    expect(itemsData.vaultItems[0].title).toContain('Emergency Medical Directives');
  });
});
