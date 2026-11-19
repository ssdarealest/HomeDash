import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import {
  HealthService,
  BotNotificationDispatcher,
} from '@homedash/server-runtime';

describe('Omnichannel Bot Webhook & Dispatcher (Phase 5 Task 6)', () => {
  const jwtSecret = 'test_secret_bot_phase5';
  const botSecretToken = 'telegram_webhook_secret_token_abc';
  let app: ReturnType<typeof createApp>;
  let healthService: HealthService;
  let botDispatcher: BotNotificationDispatcher;
  const householdId = '11111111-5555-4111-a111-111111111111';
  const memberId = '22222222-6666-4222-a222-222222222222';

  beforeEach(async () => {
    healthService = new HealthService();
    botDispatcher = new BotNotificationDispatcher();
    app = createApp({
      jwtSecret,
      healthService,
      botDispatcher,
      botSecretToken,
    });
  });

  it('generates compact callback tokens conforming to Telegram 64-byte limits', () => {
    const medId = '33333333-7777-4333-a333-333333333333';
    const tokens = botDispatcher.createActionTokens(householdId, medId, memberId, '2026-11-20T08:00:00.000Z');

    expect(tokens.takenToken.length).toBeLessThan(64);
    expect(tokens.snoozeToken.length).toBeLessThan(64);

    const resolvedTaken = botDispatcher.resolveToken(tokens.takenToken);
    expect(resolvedTaken).toBeDefined();
    expect(resolvedTaken?.action).toBe('taken');
    expect(resolvedTaken?.data.medicationId).toBe(medId);

    const resolvedSnooze = botDispatcher.resolveToken(tokens.snoozeToken);
    expect(resolvedSnooze).toBeDefined();
    expect(resolvedSnooze?.action).toBe('snooze');
  });

  it('processes incoming Telegram callback webhook to mark medication taken', async () => {
    // 1. Create medication
    const med = await healthService.createMedication({
      householdId,
      patientMemberId: memberId,
      name: 'Lisinopril',
      dosage: '10mg',
      scheduleCron: '0 8 * * *',
      remainingPills: 10,
    });

    // 2. Generate tokens
    const tokens = botDispatcher.createActionTokens(householdId, med.id, memberId, new Date().toISOString());

    // 3. Post simulated webhook callback query
    const webhookRes = await app.request('/api/v1/notifications/bot/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': botSecretToken,
      },
      body: JSON.stringify({
        updateId: 10001,
        callbackQuery: {
          id: 'cb-query-12345',
          data: tokens.takenToken,
          from: {
            id: 987654321,
            firstName: 'Grandma',
          },
        },
      }),
    });
    expect(webhookRes.status).toBe(200);
    const result = await webhookRes.json();
    expect(result.ok).toBe(true);
    expect(result.action).toBe('taken');

    // 4. Verify medication inventory decremented and log created
    const updatedMed = await healthService.getMedication(med.id);
    expect(updatedMed?.remainingPills).toBe(9);

    const logs = await healthService.getMedicationLogs(householdId, med.id);
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe('taken');
  });

  it('processes incoming Telegram callback webhook to snooze medication by 15m', async () => {
    const med = await healthService.createMedication({
      householdId,
      patientMemberId: memberId,
      name: 'Metformin',
      dosage: '500mg',
      scheduleCron: '0 9 * * *',
      remainingPills: 15,
    });

    const tokens = botDispatcher.createActionTokens(householdId, med.id, memberId, new Date().toISOString());

    const webhookRes = await app.request('/api/v1/notifications/bot/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': botSecretToken,
      },
      body: JSON.stringify({
        updateId: 10002,
        callbackQuery: {
          id: 'cb-query-67890',
          data: tokens.snoozeToken,
          from: {
            id: 987654321,
          },
        },
      }),
    });
    expect(webhookRes.status).toBe(200);
    const result = await webhookRes.json();
    expect(result.action).toBe('snooze');

    const logs = await healthService.getMedicationLogs(householdId, med.id);
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe('snoozed');
  });
});
