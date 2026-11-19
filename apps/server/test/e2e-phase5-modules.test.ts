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
import { createHmac } from 'node:crypto';

describe('Phase 5 Comprehensive End-to-End Functional Modules Integration', () => {
  const jwtSecret = 'e2e_jwt_secret_phase_5_test_at_least_32_bytes!';
  const companionSecret = 'e2e_companion_secret_test_key_12345';
  const botSecretToken = 'e2e_bot_webhook_token_secret_xyz';
  const householdId = 'e2e00000-1111-4000-8000-000000000001';
  const adminMemberId = 'e2e00000-2222-4000-8000-000000000002';
  const seniorMemberId = 'e2e00000-3333-4000-8000-000000000003';
  const childMemberId = 'e2e00000-4444-4000-8000-000000000004';
  const caregiverMemberId = 'e2e00000-5555-4000-8000-000000000005';

  let app: ReturnType<typeof createApp>;
  let dailyOpsService: DailyOpsService;
  let healthService: HealthService;
  let financeService: FinanceService;
  let androidIngestService: AndroidIngestService;
  let vaultService: VaultBreakGlassService;
  let botDispatcher: BotNotificationDispatcher;

  let adminToken: string;
  let seniorToken: string;
  let childToken: string;
  let caregiverToken: string;

  beforeEach(async () => {
    healthService = new HealthService();
    financeService = new FinanceService({
      getHouseholdCompanionSecret: async (hId) => (hId === householdId ? companionSecret : null),
    });
    dailyOpsService = new DailyOpsService({
      getAllergies: async (hId) => healthService.getAllergies(hId),
      logExpense: async (tx) => financeService.createTransaction(tx as any),
    });
    androidIngestService = new AndroidIngestService(financeService);
    vaultService = new VaultBreakGlassService();
    botDispatcher = new BotNotificationDispatcher();

    // Seed emergency vault data
    vaultService.seedTestData(householdId, {
      escrowShares: [
        {
          shareIndex: 1,
          encryptedKekShare: 'base64_emergency_share',
          ephemeralPublicKey: 'base64_ephem_key',
          nonce: 'base64_nonce',
        },
      ],
      vaultItems: [
        {
          id: 'v-item-1',
          householdId,
          title: 'Living Will & Trust Agreement',
          category: 'property_deed',
          encryptedPayload: 'enc_payload_ciphertext',
          payloadNonce: 'nonce_payload',
          encryptedDek: 'enc_dek_ciphertext',
          dekNonce: 'nonce_dek',
          keyVersion: 1,
        },
      ],
    });

    app = createApp({
      jwtSecret,
      dailyOpsService,
      healthService,
      financeService,
      androidIngestService,
      vaultBreakGlassService: vaultService,
      botDispatcher,
      botSecretToken,
    });

    adminToken = await signSessionJwt({ userId: adminMemberId, householdId, role: 'admin' }, jwtSecret);
    seniorToken = await signSessionJwt({ userId: seniorMemberId, householdId, role: 'senior' }, jwtSecret);
    childToken = await signSessionJwt({ userId: childMemberId, householdId, role: 'teen_child' }, jwtSecret);
    caregiverToken = await signSessionJwt({ userId: caregiverMemberId, householdId, role: 'caregiver_guest' }, jwtSecret);
  });

  it('verifies strict caregiver quarantine: allows care/grocery, blocks finance/vault', async () => {
    // Caregiver can list grocery items
    const groceryRes = await app.request(`/api/v1/daily-ops/grocery?householdId=${householdId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${caregiverToken}` },
    });
    expect(groceryRes.status).toBe(200);

    // Caregiver can list medications
    const medRes = await app.request(`/api/v1/health/medications?householdId=${householdId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${caregiverToken}` },
    });
    expect(medRes.status).toBe(200);

    // Caregiver is strictly blocked from finance accounts (403)
    const financeRes = await app.request(`/api/v1/finance/accounts?householdId=${householdId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${caregiverToken}` },
    });
    expect(financeRes.status).toBe(403);

    // Caregiver is strictly blocked from vault break glass initiate (403)
    const vaultRes = await app.request('/api/v1/vault/break-glass/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${caregiverToken}`,
      },
      body: JSON.stringify({ householdId }),
    });
    expect(vaultRes.status).toBe(403);
  });

  it('runs cross-module pipeline: grocery checkout -> finance transaction -> account balance', async () => {
    // 1. Create checking account with $500 balance
    const account = await financeService.createAccount({
      householdId,
      name: 'Family Checking',
      accountType: 'shared_checking',
      currency: 'USD',
    });
    await financeService.createTransaction({
      householdId,
      accountId: account.id,
      amountCents: 50000,
      transactionType: 'income',
      category: 'Initial Deposit',
      source: 'manual',
    });
    expect((await financeService.getAccount(account.id))?.balanceCents).toBe(50000);

    // 2. Add grocery item and mark it checked
    const item = await dailyOpsService.createGroceryItem({
      householdId,
      name: 'Fresh Salmon',
      quantity: '2 lbs',
      aisleCategory: 'meat_seafood',
    });
    await dailyOpsService.checkGroceryItem(item.id, true, adminMemberId);

    // 3. Checkout grocery list ($34.50 = 3450 cents)
    const checkoutRes = await app.request('/api/v1/daily-ops/grocery/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        accountId: account.id,
        category: 'Groceries',
        totalAmountCents: 3450,
        notes: 'Seafood market run',
      }),
    });
    expect(checkoutRes.status).toBe(200);
    const checkoutData = await checkoutRes.json();
    expect(checkoutData.expenseLogged).toBe(true);

    // 4. Verify finance account balance was decremented to $465.50 (46550 cents)
    const updatedAccount = await financeService.getAccount(account.id);
    expect(updatedAccount?.balanceCents).toBe(46550);
  });

  it('runs health & allergy cross-check: allergy registered -> meal plan alerts family', async () => {
    // 1. Register allergy: Senior is critically allergic to Shellfish
    await app.request('/api/v1/health/allergies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        memberId: seniorMemberId,
        allergen: 'Shellfish',
        severity: 'critical',
        reactionDescription: 'Severe throat swelling',
      }),
    });

    // 2. Plan a meal containing Shrimp
    const mealRes = await app.request('/api/v1/daily-ops/meal-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        plannedDate: '2026-11-25',
        mealType: 'dinner',
        recipeTitle: 'Garlic Butter Shellfish Paella',
        notes: 'Clams, mussels, and shrimp',
      }),
    });
    expect(mealRes.status).toBe(201);
    const mealData = await mealRes.json();
    expect(mealData.allergenWarnings.length).toBeGreaterThanOrEqual(1);
    expect(mealData.allergenWarnings[0].allergen).toBe('Shellfish');
    expect(mealData.allergenWarnings[0].severity).toBe('critical');
  });

  it('runs medication take, bot callback, and dynamic escalation alerts', async () => {
    // 1. Create medication with 3 pills remaining, threshold 2
    const med = await healthService.createMedication({
      householdId,
      patientMemberId: seniorMemberId,
      name: 'Atorvastatin',
      dosage: '20mg',
      scheduleCron: '0 21 * * *',
      remainingPills: 3,
      refillThreshold: 2,
    });

    // 2. Senior takes dose via mobile app -> pills decrement to 2, low inventory triggered
    const takeRes = await app.request(`/api/v1/health/medications/${med.id}/take`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${seniorToken}`,
      },
      body: JSON.stringify({}),
    });
    expect(takeRes.status).toBe(200);
    const takeData = await takeRes.json();
    expect(takeData.remainingPills).toBe(2);
    expect(takeData.lowInventoryWarning).toBe(true);

    // 3. Two-way bot webhook takes next dose
    const tokens = botDispatcher.createActionTokens(householdId, med.id, seniorMemberId, new Date().toISOString());
    const botRes = await app.request('/api/v1/notifications/bot/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': botSecretToken,
      },
      body: JSON.stringify({
        updateId: 99999,
        callbackQuery: {
          id: 'cb-999',
          data: tokens.takenToken,
          from: { id: 123456 },
        },
      }),
    });
    expect(botRes.status).toBe(200);
    expect((await healthService.getMedication(med.id))?.remainingPills).toBe(1);

    // 4. Escalation worker fires for unlogged missed dose
    const unloggedDoseTime = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    const med2 = await healthService.createMedication({
      householdId,
      patientMemberId: seniorMemberId,
      name: 'Insulin Glargine',
      dosage: '15 units',
      scheduleCron: '0 7 * * *',
      remainingPills: 10,
    });
    const escalatedAlerts: any[] = [];
    const worker = new EscalationWorker({
      healthService,
      onEscalate: async (alert) => {
        escalatedAlerts.push(alert);
      },
    });
    worker.registerExpectedDose({
      householdId,
      medicationId: med2.id,
      scheduledAt: unloggedDoseTime,
    });

    const evalResult = await worker.evaluateMissedDoses();
    expect(evalResult.escalatedCount).toBe(1);
    expect(escalatedAlerts[0].medicationName).toBe('Insulin Glargine');
  });

  it('runs Android push notification ingestion and utility bill spike alert', async () => {
    // 1. Setup checking account
    const checking = await financeService.createAccount({
      householdId,
      name: 'Checking',
      accountType: 'shared_checking',
      currency: 'USD',
    });

    // 2. Ingest Android companion bank notification
    const payload = {
      packageName: 'com.wf.wellsfargomobile',
      rawText: 'Wells Fargo: Alert - You spent $68.40 at Costco Wholesale',
      timestamp: 1763568900000,
      accountId: checking.id,
    };
    const rawBody = JSON.stringify(payload);
    const signature = createHmac('sha256', companionSecret).update(rawBody).digest('hex');

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
    expect(ingestResult.transaction.amountCents).toBe(6840);
    expect(ingestResult.transaction.category).toBe('Costco Wholesale');

    // 3. Log normal water bills ($50 each)
    await financeService.createUtilityBill({
      householdId,
      providerName: 'City Water District',
      billType: 'water',
      amountCents: 5000,
      dueDate: '2026-09-01',
    });
    await financeService.createUtilityBill({
      householdId,
      providerName: 'City Water District',
      billType: 'water',
      amountCents: 5000,
      dueDate: '2026-10-01',
    });

    // 4. Log spiked bill ($85, 70% increase)
    const billRes = await app.request('/api/v1/finance/bills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        providerName: 'City Water District',
        billType: 'water',
        amountCents: 8500,
        dueDate: '2026-11-01',
      }),
    });
    expect(billRes.status).toBe(201);
    const billResult = await billRes.json();
    expect(billResult.isSpike).toBe(true);
    expect(billResult.percentageIncrease).toBe(70);
  });

  it('runs emergency break-glass: initiate -> cooldown expiry -> emergency access granted', async () => {
    // 1. Senior initiates break-glass with instant cooldown
    const requestId = await vaultService.initiateBreakGlassDirect(householdId, seniorMemberId, 0);

    // 2. Query status -> approved
    const statusRes = await app.request(`/api/v1/vault/break-glass/status/${requestId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();
    expect(statusData.status).toBe('approved');

    // 3. Retrieve escrow shares
    const sharesRes = await app.request(`/api/v1/vault/break-glass/escrow-shares/${requestId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    expect(sharesRes.status).toBe(200);
    const sharesData = await sharesRes.json();
    expect(sharesData.escrowShares.length).toBe(1);

    // 4. Retrieve emergency vault documents
    const itemsRes = await app.request(`/api/v1/vault/break-glass/emergency-items/${requestId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${seniorToken}` },
    });
    expect(itemsRes.status).toBe(200);
    const itemsData = await itemsRes.json();
    expect(itemsData.vaultItems.length).toBe(1);
    expect(itemsData.vaultItems[0].title).toBe('Living Will & Trust Agreement');
  });
});
