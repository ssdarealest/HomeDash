import { pgTable, uuid, varchar, text, integer, boolean, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { households, householdMembers } from './households';

export const medicationStatusEnum = pgEnum('medication_status', ['taken', 'skipped', 'snoozed', 'missed_escalated']);
export const shiftStatusEnum = pgEnum('shift_status', ['scheduled', 'in_progress', 'completed', 'swapped', 'cancelled']);
export const vitalTypeEnum = pgEnum('vital_type', ['blood_pressure', 'blood_glucose', 'heart_rate', 'temperature', 'weight']);
export const allergySeverityEnum = pgEnum('allergy_severity', ['mild', 'moderate', 'critical']);

export const medications = pgTable('medications', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  patientMemberId: uuid('patient_member_id').references(() => householdMembers.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  dosage: varchar('dosage', { length: 80 }).notNull(),
  instructions: text('instructions'),
  scheduleCron: varchar('schedule_cron', { length: 50 }).notNull(),
  remainingPills: integer('remaining_pills').default(0).notNull(),
  refillThreshold: integer('refill_threshold').default(5).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const medicationLogs = pgTable('medication_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  medicationId: uuid('medication_id').references(() => medications.id, { onDelete: 'cascade' }).notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  takenAt: timestamp('taken_at', { withTimezone: true }),
  status: medicationStatusEnum('status').default('taken').notNull(),
  photoProofUrl: text('photo_proof_url'),
  recordedByMemberId: uuid('recorded_by_member_id').references(() => householdMembers.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const caregiverShifts = pgTable('caregiver_shifts', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  patientMemberId: uuid('patient_member_id').references(() => householdMembers.id, { onDelete: 'cascade' }).notNull(),
  assignedMemberId: uuid('assigned_member_id').references(() => householdMembers.id, { onDelete: 'cascade' }).notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  status: shiftStatusEnum('status').default('scheduled').notNull(),
  notes: text('notes'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vitalsLogs = pgTable('vitals_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  memberId: uuid('member_id').references(() => householdMembers.id, { onDelete: 'cascade' }).notNull(),
  vitalType: vitalTypeEnum('vital_type').notNull(),
  valuePrimary: numeric('value_primary', { precision: 6, scale: 2 }).notNull(),
  valueSecondary: numeric('value_secondary', { precision: 6, scale: 2 }),
  unit: varchar('unit', { length: 20 }).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  notes: text('notes'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const medicalAllergies = pgTable('medical_allergies', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  memberId: uuid('member_id').references(() => householdMembers.id, { onDelete: 'cascade' }).notNull(),
  allergen: varchar('allergen', { length: 100 }).notNull(),
  severity: allergySeverityEnum('severity').default('critical').notNull(),
  reactionDescription: text('reaction_description'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
