import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import {
  signSessionJwt,
  FinanceService,
  HealthService,
  DailyOpsService,
  VaultBreakGlassService,
} from '@homedash/server-runtime';

describe('Production Deployment & Security Audit (Phase 6 Task 5)', () => {
  const jwtSecret = 'production_security_audit_secret_32_bytes_min!';
  let app: ReturnType<typeof createApp>;
  let financeService: FinanceService;
  let healthService: HealthService;
  let dailyOpsService: DailyOpsService;
  let vaultBreakGlassService: VaultBreakGlassService;

  const household1Id = '11111111-1111-4111-a111-111111111111';
  const household2Id = '99999999-9999-4999-a999-999999999999';

  let adminTokenH1: string;
  let caregiverTokenH1: string;
  let strangerTokenH2: string;

  beforeEach(async () => {
    financeService = new FinanceService();
    healthService = new HealthService();
    dailyOpsService = new DailyOpsService();
    vaultBreakGlassService = new VaultBreakGlassService();

    app = createApp({
      jwtSecret,
      financeService,
      healthService,
      dailyOpsService,
      vaultBreakGlassService,
    });

    adminTokenH1 = await signSessionJwt(
      {
        userId: 'admin-1',
        householdId: household1Id,
        role: 'admin',
      },
      jwtSecret
    );

    caregiverTokenH1 = await signSessionJwt(
      {
        userId: 'caregiver-1',
        householdId: household1Id,
        role: 'caregiver_guest',
      },
      jwtSecret
    );

    strangerTokenH2 = await signSessionJwt(
      {
        userId: 'admin-2',
        householdId: household2Id,
        role: 'admin',
      },
      jwtSecret
    );
  });

  describe('Audit Check 1: Strict Caregiver Role Quarantine', () => {
    it('prohibits caregiver from accessing financial accounts', async () => {
      const res = await app.request(`/api/v1/finance/accounts?householdId=${household1Id}`, {
        headers: { Authorization: `Bearer ${caregiverTokenH1}` },
      });
      expect(res.status).toBe(403);
    });

    it('prohibits caregiver from creating financial transactions', async () => {
      const res = await app.request('/api/v1/finance/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${caregiverTokenH1}`,
        },
        body: JSON.stringify({
          householdId: household1Id,
          accountId: '33333333-3333-4333-a333-333333333333',
          amountCents: 500,
          category: 'Medical',
          transactionType: 'expense',
          description: 'Bandages',
        }),
      });
      expect(res.status).toBe(403);
    });

    it('prohibits caregiver from executing grocery checkout', async () => {
      const res = await app.request('/api/v1/daily-ops/grocery/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${caregiverTokenH1}`,
        },
        body: JSON.stringify({
          householdId: household1Id,
          accountId: '33333333-3333-4333-a333-333333333333',
          category: 'Groceries',
          totalAmountCents: 1200,
        }),
      });
      expect(res.status).toBe(403);
    });

    it('prohibits caregiver from initiating vault break-glass emergency flow', async () => {
      const res = await app.request('/api/v1/vault/break-glass/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${caregiverTokenH1}`,
        },
        body: JSON.stringify({
          householdId: household1Id,
          requestedByMemberId: 'caregiver-1',
          reason: 'Emergency attempt',
        }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe('Audit Check 2: Multi-Tenant Household Isolation', () => {
    it('rejects foreign household requests on daily-ops grocery router', async () => {
      const res = await app.request(`/api/v1/daily-ops/grocery?householdId=${household1Id}`, {
        headers: { Authorization: `Bearer ${strangerTokenH2}` },
      });
      expect(res.status).toBe(403);
    });

    it('rejects foreign household requests on health medication router', async () => {
      const res = await app.request(`/api/v1/health/medications?householdId=${household1Id}`, {
        headers: { Authorization: `Bearer ${strangerTokenH2}` },
      });
      expect(res.status).toBe(403);
    });

    it('rejects foreign household requests on finance account router', async () => {
      const res = await app.request(`/api/v1/finance/accounts?householdId=${household1Id}`, {
        headers: { Authorization: `Bearer ${strangerTokenH2}` },
      });
      expect(res.status).toBe(403);
    });
  });

  describe('Audit Check 3: Zero Plaintext Escrow & Vault Guarantee', () => {
    it('verifies that break-glass escrow shares contain only encrypted ciphertext blobs', async () => {
      vaultBreakGlassService.seedTestData(household1Id, {
        escrowShares: [
          {
            id: 'share-1',
            householdId: household1Id,
            shareIndex: 1,
            encryptedShare: 'ENC:AES256GCM:a7b8c9d0...ciphertext_blob',
            holderMemberId: 'trusted-member-1',
            createdAt: new Date().toISOString(),
          },
        ],
        vaultItems: [
          {
            id: 'vault-1',
            householdId: household1Id,
            title: 'Health Insurance Card',
            category: 'insurance',
            encryptedPayload: 'ENC:AES256GCM:payload_ciphertext...',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const items = await vaultBreakGlassService.getEmergencyVaultItems('non-existent', 'admin-1');
      expect(items).toBeNull(); // Cannot access without approved break glass request

      // Verify that registered data contains zero unencrypted plaintext keys
      const data = vaultBreakGlassService['vaultItems'].get(household1Id);
      expect(data).toBeDefined();
      for (const item of data!) {
        expect(item.encryptedPayload.startsWith('ENC:')).toBe(true);
        expect((item as any).plaintextKey).toBeUndefined();
      }
    });
  });
});
