import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import {
  signSessionJwt,
  FinanceService,
  AndroidIngestService,
} from '@homedash/server-runtime';
import { createHmac } from 'node:crypto';

describe('Finance Service, Android Ingestion & Utility Bill Spike (Phase 5 Task 4)', () => {
  const jwtSecret = 'test_secret_finance_phase5';
  const companionSecret = 'companion_secret_test_12345';
  let app: ReturnType<typeof createApp>;
  let financeService: FinanceService;
  let adminToken: string;
  let caregiverToken: string;
  const householdId = '11111111-3333-4111-a111-111111111111';

  beforeEach(async () => {
    financeService = new FinanceService({
      getHouseholdCompanionSecret: async (hId) => (hId === householdId ? companionSecret : null),
    });
    app = createApp({ jwtSecret, financeService });

    adminToken = await signSessionJwt(
      {
        userId: 'admin-user-id',
        householdId,
        role: 'admin',
      },
      jwtSecret
    );

    caregiverToken = await signSessionJwt(
      {
        userId: 'caregiver-user-id',
        householdId,
        role: 'caregiver_guest',
      },
      jwtSecret
    );
  });

  it('strictly quarantines caregiver guests from /api/v1/finance with 403 Forbidden', async () => {
    const res = await app.request('/api/v1/finance/accounts', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${caregiverToken}`,
      },
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Forbidden');
  });

  it('manages accounts, transactions, and sinking funds progress', async () => {
    // 1. Create shared checking account
    const checkingRes = await app.request('/api/v1/finance/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        name: 'Household Primary Checking',
        accountType: 'shared_checking',
        currency: 'USD',
      }),
    });
    expect(checkingRes.status).toBe(201);
    const checking = await checkingRes.json();
    expect(checking.name).toBe('Household Primary Checking');
    expect(checking.balanceCents).toBe(0);

    // 2. Create sinking fund account
    const fundRes = await app.request('/api/v1/finance/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        name: 'Emergency Medical Reserve',
        accountType: 'sinking_fund',
        currency: 'USD',
      }),
    });
    expect(fundRes.status).toBe(201);
    const fund = await fundRes.json();

    // 3. Log income to checking
    const incomeRes = await app.request('/api/v1/finance/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        accountId: checking.id,
        amountCents: 500000, // $5,000.00
        transactionType: 'income',
        category: 'Salary',
        description: 'Biweekly paycheck',
        source: 'manual',
      }),
    });
    expect(incomeRes.status).toBe(201);

    // 4. Log transfer to sinking fund
    await app.request('/api/v1/finance/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        accountId: fund.id,
        amountCents: 100000, // $1,000.00
        transactionType: 'income',
        category: 'Sinking Fund Deposit',
        description: 'Monthly emergency fund contribution',
        source: 'manual',
      }),
    });

    // 5. Query sinking funds summary
    const summaryRes = await app.request(`/api/v1/finance/sinking-funds?householdId=${householdId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(summaryRes.status).toBe(200);
    const summary = await summaryRes.json();
    expect(summary.totalSavedCents).toBe(100000);
    expect(summary.funds.length).toBe(1);
    expect(summary.funds[0].name).toBe('Emergency Medical Reserve');
  });

  it('detects utility bill spikes exceeding 1.25x historical average', async () => {
    // 1. Log two normal electricity bills ($100 each)
    await app.request('/api/v1/finance/bills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        providerName: 'City Power',
        billType: 'electricity',
        amountCents: 10000,
        dueDate: '2026-09-15',
      }),
    });

    await app.request('/api/v1/finance/bills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        providerName: 'City Power',
        billType: 'electricity',
        amountCents: 10000,
        dueDate: '2026-10-15',
      }),
    });

    // 2. Log spiked electricity bill ($145 - 45% spike, exceeds 25% threshold)
    const spikeRes = await app.request('/api/v1/finance/bills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        providerName: 'City Power',
        billType: 'electricity',
        amountCents: 14500,
        dueDate: '2026-11-15',
      }),
    });
    expect(spikeRes.status).toBe(201);
    const result = await spikeRes.json();
    expect(result.isSpike).toBe(true);
    expect(result.percentageIncrease).toBe(45);
    expect(result.historicalAverageCents).toBe(10000);
  });

  it('ingests Android companion bank push notifications with HMAC and idempotency', async () => {
    // Pre-create shared checking account
    const account = await financeService.createAccount({
      householdId,
      name: 'Primary Checking',
      accountType: 'shared_checking',
      currency: 'USD',
    });

    const payload = {
      packageName: 'com.chase.sig.android',
      rawText: "Chase: You spent $42.50 at Trader Joe's",
      timestamp: 1763568000000,
      accountId: account.id,
    };
    const rawBody = JSON.stringify(payload);
    const signature = createHmac('sha256', companionSecret).update(rawBody).digest('hex');

    // 1. Ingest valid push notification
    const ingestRes = await app.request('/api/v1/ingest/android-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HomeDash-Household-Id': householdId,
        'X-HomeDash-Signature': signature,
      },
      body: rawBody,
    });
    expect(ingestRes.status).toBe(200);
    const ingestResult = await ingestRes.json();
    expect(ingestResult.status).toBe('ingested');
    expect(ingestResult.transaction.amountCents).toBe(4250);
    expect(ingestResult.transaction.category).toBe("Trader Joe's");

    // 2. Replay duplicate push notification -> should be ignored idempotently
    const replayRes = await app.request('/api/v1/ingest/android-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HomeDash-Household-Id': householdId,
        'X-HomeDash-Signature': signature,
      },
      body: rawBody,
    });
    expect(replayRes.status).toBe(200);
    const replayResult = await replayRes.json();
    expect(replayResult.status).toBe('duplicate_ignored');

    // 3. Reject invalid signature with 401
    const invalidRes = await app.request('/api/v1/ingest/android-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HomeDash-Household-Id': householdId,
        'X-HomeDash-Signature': 'invalid_signature_hex_digest_here',
      },
      body: rawBody,
    });
    expect(invalidRes.status).toBe(401);
  });
});
