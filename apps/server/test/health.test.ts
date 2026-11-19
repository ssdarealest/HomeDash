import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import { signSessionJwt, EscalationWorker, HealthService } from '@homedash/server-runtime';

describe('Health Service, Escalation Worker & Routes (Phase 5 Task 3)', () => {
  const jwtSecret = 'test_secret_health_phase5';
  let app: ReturnType<typeof createApp>;
  let healthService: HealthService;
  let adminToken: string;
  let caregiverToken: string;
  const householdId = '11111111-2222-4111-a111-111111111111';
  const patientMemberId = '22222222-3333-4222-a222-222222222222';
  const caregiverMemberId = '33333333-4444-4333-a333-333333333333';

  beforeEach(async () => {
    healthService = new HealthService();
    app = createApp({ jwtSecret, healthService });

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

  it('manages medications, tracks pill decrement, and warns on low threshold', async () => {
    // 1. Create a medication with 6 remaining pills and refill threshold of 5
    const createMedRes = await app.request('/api/v1/health/medications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        patientMemberId,
        name: 'Lisinopril',
        dosage: '10mg',
        scheduleCron: '0 8 * * *',
        remainingPills: 6,
        refillThreshold: 5,
        isActive: true,
      }),
    });
    expect(createMedRes.status).toBe(201);
    const med = await createMedRes.json();
    expect(med.name).toBe('Lisinopril');
    expect(med.remainingPills).toBe(6);

    // 2. Take medication dose
    const takeRes = await app.request(`/api/v1/health/medications/${med.id}/take`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${caregiverToken}`,
      },
      body: JSON.stringify({
        takenAt: new Date().toISOString(),
      }),
    });
    expect(takeRes.status).toBe(200);
    const takeResult = await takeRes.json();
    expect(takeResult.remainingPills).toBe(5);
    expect(takeResult.lowInventoryWarning).toBe(true);
    expect(takeResult.log.status).toBe('taken');
  });

  it('evaluates missed doses via EscalationWorker and respects active snooze', async () => {
    const alerts: any[] = [];
    const worker = new EscalationWorker({
      healthService,
      onEscalate: async (alert) => {
        alerts.push(alert);
      },
    });

    // Create medication with scheduled dose 40 minutes in past
    const pastDoseTime = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    const med = await healthService.createMedication({
      householdId,
      patientMemberId,
      name: 'Metformin',
      dosage: '500mg',
      scheduleCron: '0 9 * * *',
      remainingPills: 20,
      refillThreshold: 5,
      isActive: true,
    });

    // Manually register an unlogged expected past dose
    worker.registerExpectedDose({
      medicationId: med.id,
      householdId,
      scheduledAt: pastDoseTime,
    });

    // Run escalation evaluation
    const result1 = await worker.evaluateMissedDoses();
    expect(result1.escalatedCount).toBe(1);
    expect(alerts.length).toBe(1);
    expect(alerts[0].medicationName).toBe('Metformin');

    // Now test snooze suppression: if snoozed 5 minutes ago (active 15m window), should not escalate
    alerts.length = 0;
    const anotherPastDose = new Date(Date.now() - 35 * 60 * 1000).toISOString();
    const med2 = await healthService.createMedication({
      householdId,
      patientMemberId,
      name: 'Amlodipine',
      dosage: '5mg',
      scheduleCron: '0 10 * * *',
      remainingPills: 15,
      refillThreshold: 5,
      isActive: true,
    });

    worker.registerExpectedDose({
      medicationId: med2.id,
      householdId,
      scheduledAt: anotherPastDose,
    });

    // Snooze med2
    await healthService.snoozeMedication(med2.id, patientMemberId, 15);

    const result2 = await worker.evaluateMissedDoses();
    expect(result2.escalatedCount).toBe(0);
    expect(alerts.length).toBe(0);
  });

  it('handles caregiver shift swap and checkin', async () => {
    // 1. Create shift
    const createShiftRes = await app.request('/api/v1/health/shifts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        patientMemberId,
        assignedMemberId: caregiverMemberId,
        startTime: '2026-11-20T08:00:00.000Z',
        endTime: '2026-11-20T16:00:00.000Z',
        notes: 'Morning shift',
      }),
    });
    expect(createShiftRes.status).toBe(201);
    const shift = await createShiftRes.json();
    expect(shift.status).toBe('scheduled');

    // 2. Swap shift
    const newCaregiverId = '44444444-5555-4444-a444-444444444444';
    const swapRes = await app.request(`/api/v1/health/shifts/${shift.id}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${caregiverToken}`,
      },
      body: JSON.stringify({
        targetMemberId: newCaregiverId,
        notes: 'Swapped due to doctor appointment',
      }),
    });
    expect(swapRes.status).toBe(200);
    const swapped = await swapRes.json();
    expect(swapped.assignedMemberId).toBe(newCaregiverId);
    expect(swapped.status).toBe('swapped');
  });

  it('logs vitals and calculates aggregated trends', async () => {
    // Log two blood pressure readings
    await app.request('/api/v1/health/vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        memberId: patientMemberId,
        vitalType: 'blood_pressure',
        valuePrimary: 120,
        valueSecondary: 80,
        unit: 'mmHg',
        notes: 'Resting',
      }),
    });

    await app.request('/api/v1/health/vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        householdId,
        memberId: patientMemberId,
        vitalType: 'blood_pressure',
        valuePrimary: 130,
        valueSecondary: 86,
        unit: 'mmHg',
        notes: 'Post walk',
      }),
    });

    // Query trends
    const trendsRes = await app.request(
      `/api/v1/health/vitals/trends?householdId=${householdId}&memberId=${patientMemberId}&vitalType=blood_pressure`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    expect(trendsRes.status).toBe(200);
    const trends = await trendsRes.json();
    expect(trends.count).toBe(2);
    expect(trends.avgPrimary).toBe(125);
    expect(trends.maxPrimary).toBe(130);
    expect(trends.minPrimary).toBe(120);
  });
});
