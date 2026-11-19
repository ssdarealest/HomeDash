import { z } from 'zod';

export const MedicationTakeSchema = z.object({
  takenAt: z.string().datetime().optional(),
  photoProofUrl: z.string().url().optional(),
});
export type MedicationTake = z.infer<typeof MedicationTakeSchema>;

export const MedicationSnoozeSchema = z.object({
  snoozeMinutes: z.number().int().min(1).max(120).default(15),
});
export type MedicationSnooze = z.infer<typeof MedicationSnoozeSchema>;

export const ShiftSwapSchema = z.object({
  targetMemberId: z.string().uuid(),
  notes: z.string().optional(),
});
export type ShiftSwap = z.infer<typeof ShiftSwapSchema>;

export const VitalTypeSchema = z.enum([
  'blood_pressure',
  'blood_glucose',
  'heart_rate',
  'temperature',
  'weight',
]);
export type VitalType = z.infer<typeof VitalTypeSchema>;

export const VitalsLogCreateSchema = z.object({
  memberId: z.string().uuid(),
  vitalType: VitalTypeSchema,
  valuePrimary: z.number(),
  valueSecondary: z.number().optional(),
  unit: z.string().min(1).max(20),
  notes: z.string().optional(),
  recordedAt: z.string().datetime().optional(),
});
export type VitalsLogCreate = z.infer<typeof VitalsLogCreateSchema>;

export const AllergySeveritySchema = z.enum(['mild', 'moderate', 'critical']);
export type AllergySeverity = z.infer<typeof AllergySeveritySchema>;

export const MedicalAllergyCreateSchema = z.object({
  memberId: z.string().uuid(),
  allergen: z.string().min(1).max(100),
  severity: AllergySeveritySchema.default('critical'),
  reactionDescription: z.string().optional(),
});
export type MedicalAllergyCreate = z.infer<typeof MedicalAllergyCreateSchema>;
