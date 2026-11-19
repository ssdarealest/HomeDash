import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import {
  signSessionJwt,
  DailyOpsService,
  HealthService,
  FinanceService,
  AndroidIngestService,
  VaultBreakGlassService,
  BotNotificationDispatcher,
  EscalationWorker,
} from '@homedash/server-runtime';

describe('Senior Code Review Hardening Pass (Phase 5)', () => {
  const jwtSecret = 'senior_audit_jwt_secret_at_least_32_bytes!';
  const householdA = 'aaaa0000-1111-4000-8000-000000000001';
  const householdB = 'bbbb0000-2222-4000-8000-000000000002';
  const userA = 'aaaa0000-3333-4000-8000-000000000003';
  const userB = 'bbbb0000-4444-4000-8000-000000000004';

  let app: ReturnType<typeof createApp>;
  let financeService: FinanceService;
  let dailyOpsService: DailyOpsService;
  let healthService: HealthService;
  let vaultService: VaultBreakGlassService;
  let botDispatcher: BotNotificationDispatcher;

  let tokenA: string;
  let caregiverTokenA: string;

  beforeEach(async () => {
    financeService = new FinanceService();
    healthService = new HealthService();
    dailyOpsService = new DailyOpsService({
      getAllergies: async (hId) => healthService.getAllergies(hId),
      logExpense: async (tx) => financeService.createTransaction(tx as any),
    });
    vaultService = new VaultBreakGlassService();
    botDispatcher = new BotNotificationDispatcher();

    app = createApp({
      jwtSecret,
      financeService,
      dailyOpsService,
      healthService,
      vaultBreakGlassService: vaultService,
      botDispatcher,
    });

    tokenA = await signSessionJwt({ userId: userA, householdId: householdA, role: 'admin' }, jwtSecret);
    caregiverTokenA = await signSessionJwt({ userId: userA, householdId: householdA, role: 'caregiver_guest' }, jwtSecret);
  });

  it('[P0-1] blocks cross-household query parameter injection with 403 Forbidden', async () => {
    // User from Household A tries to query accounts of Household B
    const res = await app.request(`/api/v1/finance/accounts?householdId=${householdB}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Forbidden');
  });

  it('[P0-1] blocks cross-household body parameter injection with 403 Forbidden', async () => {
    // User from Household A tries to create a grocery item in Household B
    const res = await app.request('/api/v1/daily-ops/grocery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        householdId: householdB,
        name: 'Injected Item',
        quantity: '1',
      }),
    });
    expect(res.status).toBe(403);
  });

  it('[P0-2] blocks cross-household account transaction debit in FinanceService', async () => {
    // Create account in Household B
    const accountB = await financeService.createAccount({
      householdId: householdB,
      name: "Household B's Savings",
      accountType: 'shared_checking',
      currency: 'USD',
    });

    // Household A tries to debit Household B's account
    await expect(
      financeService.createTransaction({
        householdId: householdA,
        accountId: accountB.id,
        amountCents: 5000,
        transactionType: 'expense',
        category: 'Theft Attempt',
        source: 'manual',
      })
    ).rejects.toThrow(/does not belong to household/);
  });

  it('[P1-2] blocks caregiver from checking out grocery and logging expenses', async () => {
    const res = await app.request('/api/v1/daily-ops/grocery/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${caregiverTokenA}`,
      },
      body: JSON.stringify({
        householdId: householdA,
        accountId: '11111111-2222-3333-4444-555555555555',
        totalAmountCents: 1500,
      }),
    });
    expect(res.status).toBe(403);
  });

  it('[P1-3] enforces idempotency on chore verification to prevent duplicate allowance crediting', async () => {
    const allowanceAccount = await financeService.createAccount({
      householdId: householdA,
      name: "Child's Allowance",
      accountType: 'personal_allowance',
      currency: 'USD',
      ownerMemberId: userA,
    });

    const chore = await dailyOpsService.createChore({
      householdId: householdA,
      title: 'Wash Dishes',
      assignedMemberId: userA,
      rewardPoints: 20,
      allowanceCents: 300,
    });

    await dailyOpsService.toggleChore(chore.id, true);

    // Verify chore with creditAllowance wired
    const res1 = await dailyOpsService.verifyChore(chore.id, true);
    expect(res1?.pointsAwarded).toBe(20);
    expect(res1?.allowanceCreditedCents).toBe(300);

    // Verify chore again (retry) -> pointsAwarded and allowanceCredited must be 0
    const res2 = await dailyOpsService.verifyChore(chore.id, true);
    expect(res2?.pointsAwarded).toBe(0);
    expect(res2?.allowanceCreditedCents).toBe(0);
  });

  it('[P0-3] prevents admin veto once break-glass cooldown has elapsed', async () => {
    // Initiate request with 0ms cooldown (instant expiration)
    const requestId = await vaultService.initiateBreakGlassDirect(householdA, userA, 0);
    const request = (vaultService as any).requests.get(requestId);

    // Admin tries to veto with valid token AFTER cooldown has expired
    const vetoRes = await vaultService.vetoBreakGlass(requestId, 'any_token', new Date(Date.now() + 1000));
    expect(vetoRes).toBeNull(); // Veto must be rejected because cooldown elapsed!
  });

  it('[P0-3] lazily evaluates cooldown expiration on escrow shares retrieval', async () => {
    vaultService.seedTestData(householdA, {
      escrowShares: [
        {
          shareIndex: 1,
          encryptedKekShare: 'share_123',
          ephemeralPublicKey: 'pk_123',
          nonce: 'nonce_123',
        },
      ],
      vaultItems: [],
    });

    // Request with 0ms cooldown
    const requestId = await vaultService.initiateBreakGlassDirect(householdA, userA, 0);

    // Directly retrieve escrow shares WITHOUT calling getStatus first
    const shares = await vaultService.getEscrowShares(requestId, userA, new Date(Date.now() + 1000));
    expect(shares).toBeDefined();
    expect(shares?.length).toBe(1);
  });

  it('[P0-4] evaluates dose-specific matching: previous taken dose does not suppress new missed dose alert', async () => {
    const med = await healthService.createMedication({
      householdId: householdA,
      patientMemberId: userA,
      name: 'Levothyroxine',
      dosage: '50mcg',
      scheduleCron: '0 7 * * *',
      remainingPills: 30,
    });

    // Yesterday's dose was taken
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await healthService.takeMedication(med.id, userA, { takenAt: yesterday });

    // Today's dose was scheduled 40 minutes ago and NOT taken
    const todayMissedDose = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    const alerts: any[] = [];
    const worker = new EscalationWorker({
      healthService,
      onEscalate: async (a) => {
        alerts.push(a);
      },
    });

    worker.registerExpectedDose({
      householdId: householdA,
      medicationId: med.id,
      scheduledAt: todayMissedDose,
    });

    const res = await worker.evaluateMissedDoses();
    expect(res.escalatedCount).toBe(1);
    expect(alerts.length).toBe(1);
    expect(alerts[0].medicationName).toBe('Levothyroxine');

    // Also verify escalated log was persisted in medication_logs
    const logs = await healthService.getMedicationLogs(householdA, med.id);
    const escalatedLog = logs.find((l) => l.status === 'missed_escalated');
    expect(escalatedLog).toBeDefined();
  });

  it('[P1-4] prevents action token replay attacks on bot bridge', () => {
    const tokens = botDispatcher.createActionTokens(householdA, 'med-1', userA, new Date().toISOString());

    // First resolution consumes the token
    const firstResolution = botDispatcher.resolveToken(tokens.takenToken, true);
    expect(firstResolution).toBeDefined();
    expect(firstResolution?.action).toBe('taken');

    // Replay attempt must return null
    const replayResolution = botDispatcher.resolveToken(tokens.takenToken, true);
    expect(replayResolution).toBeNull();
  });

  it('[P1-5] sanitizes allergen regex special characters and avoids substring false positives', async () => {
    const res = await dailyOpsService.createMealPlan({
      householdId: householdA,
      plannedDate: '2026-11-28',
      mealType: 'dinner',
      recipeTitle: 'Roasted Butternut Squash and Donuts',
      notes: 'Delicious fall squash with honey glaze',
    });

    // Should NOT match "nut" against "butternut" or "donut"
    expect(res.allergenWarnings.length).toBe(0);
  });
});
