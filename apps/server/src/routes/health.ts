import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  MedicationTakeSchema,
  MedicationSnoozeSchema,
  ShiftSwapSchema,
  VitalsLogCreateSchema,
  MedicalAllergyCreateSchema,
} from '@homedash/protocol';
import {
  authMiddleware,
  HealthService,
} from '@homedash/server-runtime';
import { z } from 'zod';

export interface HealthRouterOptions {
  healthService: HealthService;
  jwtSecret: string;
}

const MedicationCreateInputSchema = z.object({
  householdId: z.string().uuid(),
  patientMemberId: z.string().uuid(),
  name: z.string().min(1).max(120),
  dosage: z.string().min(1).max(80),
  scheduleCron: z.string().min(1).max(50),
  remainingPills: z.number().int().nonnegative().optional(),
  refillThreshold: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

const CaregiverShiftCreateInputSchema = z.object({
  householdId: z.string().uuid(),
  patientMemberId: z.string().uuid(),
  assignedMemberId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
});

export function createHealthRouter(opts: HealthRouterOptions) {
  const router = new Hono();
  const { healthService, jwtSecret } = opts;

  router.use('*', authMiddleware(jwtSecret));

  // --- Medications ---
  router.get('/medications', async (c) => {
    const session = c.get('session' as any);
    const householdId = c.req.query('householdId') || session?.householdId;
    if (!householdId) return c.json({ error: 'householdId is required' }, 400);
    const meds = await healthService.getMedications(householdId);
    return c.json(meds);
  });

  router.post(
    '/medications',
    zValidator('json', MedicationCreateInputSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const data = c.req.valid('json');
      const med = await healthService.createMedication(data);
      return c.json(med, 201);
    }
  );

  router.post(
    '/medications/:id/take',
    zValidator('json', MedicationTakeSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const id = c.req.param('id');
      const session = c.get('session' as any);
      const data = c.req.valid('json');
      const result = await healthService.takeMedication(id, session?.userId, data);
      if (!result) return c.json({ error: 'Medication not found' }, 404);
      return c.json(result);
    }
  );

  router.post(
    '/medications/:id/snooze',
    zValidator('json', MedicationSnoozeSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const id = c.req.param('id');
      const session = c.get('session' as any);
      const data = c.req.valid('json');
      const result = await healthService.snoozeMedication(id, session?.userId, data.snoozeMinutes);
      if (!result) return c.json({ error: 'Medication not found' }, 404);
      return c.json(result);
    }
  );

  router.get('/medications/logs', async (c) => {
    const session = c.get('session' as any);
    const householdId = c.req.query('householdId') || session?.householdId;
    const medicationId = c.req.query('medicationId');
    if (!householdId) return c.json({ error: 'householdId is required' }, 400);
    const logs = await healthService.getMedicationLogs(householdId, medicationId);
    return c.json(logs);
  });

  // --- Caregiver Shifts ---
  router.get('/shifts', async (c) => {
    const session = c.get('session' as any);
    const householdId = c.req.query('householdId') || session?.householdId;
    if (!householdId) return c.json({ error: 'householdId is required' }, 400);
    const shifts = await healthService.getShifts(householdId);
    return c.json(shifts);
  });

  router.post(
    '/shifts',
    zValidator('json', CaregiverShiftCreateInputSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const data = c.req.valid('json');
      const shift = await healthService.createShift(data);
      return c.json(shift, 201);
    }
  );

  router.post(
    '/shifts/:id/swap',
    zValidator('json', ShiftSwapSchema, (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const id = c.req.param('id');
      const { targetMemberId, notes } = c.req.valid('json');
      const result = await healthService.swapShift(id, targetMemberId, notes);
      if (!result) return c.json({ error: 'Shift not found' }, 404);
      return c.json(result);
    }
  );

  router.post('/shifts/:id/checkin', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const result = await healthService.checkinShift(id, body?.notes);
    if (!result) return c.json({ error: 'Shift not found' }, 404);
    return c.json(result);
  });

  // --- Vitals ---
  router.get('/vitals', async (c) => {
    const session = c.get('session' as any);
    const householdId = c.req.query('householdId') || session?.householdId;
    const memberId = c.req.query('memberId');
    const vitalType = c.req.query('vitalType');
    if (!householdId) return c.json({ error: 'householdId is required' }, 400);
    const records = await healthService.getVitals(householdId, memberId, vitalType);
    return c.json(records);
  });

  router.post(
    '/vitals',
    zValidator('json', VitalsLogCreateSchema.extend({ householdId: z.string().uuid() }), (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const data = c.req.valid('json');
      const record = await healthService.logVitals(data);
      return c.json(record, 201);
    }
  );

  router.get('/vitals/trends', async (c) => {
    const session = c.get('session' as any);
    const householdId = c.req.query('householdId') || session?.householdId;
    const memberId = c.req.query('memberId');
    const vitalType = c.req.query('vitalType');
    if (!householdId || !memberId || !vitalType) {
      return c.json({ error: 'householdId, memberId, and vitalType are required' }, 400);
    }
    const trends = await healthService.getVitalsTrends(householdId, memberId, vitalType);
    return c.json(trends);
  });

  // --- Allergies ---
  router.get('/allergies', async (c) => {
    const session = c.get('session' as any);
    const householdId = c.req.query('householdId') || session?.householdId;
    const memberId = c.req.query('memberId');
    if (!householdId) return c.json({ error: 'householdId is required' }, 400);
    const allergies = await healthService.getAllergies(householdId, memberId);
    return c.json(allergies);
  });

  router.post(
    '/allergies',
    zValidator('json', MedicalAllergyCreateSchema.extend({ householdId: z.string().uuid() }), (result, c) => {
      if (!result.success) return c.json({ error: 'Validation failed', issues: result.error.issues }, 400);
    }),
    async (c) => {
      const data = c.req.valid('json');
      const allergy = await healthService.createAllergy(data);
      return c.json(allergy, 201);
    }
  );

  return router;
}
