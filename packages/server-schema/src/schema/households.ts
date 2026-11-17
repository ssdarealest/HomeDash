import { pgTable, uuid, varchar, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'senior', 'teen_child', 'caregiver_guest']);

export const households = pgTable('households', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const householdModules = pgTable('household_modules', {
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).primaryKey(),
  financeEnabled: boolean('finance_enabled').default(true).notNull(),
  healthEnabled: boolean('health_enabled').default(true).notNull(),
  vaultEnabled: boolean('vault_enabled').default(true).notNull(),
  dailyOpsEnabled: boolean('daily_ops_enabled').default(true).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  phoneNumber: varchar('phone_number', { length: 30 }).unique(),
  fullName: varchar('full_name', { length: 120 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 2048 }),
  publicKeyX25519: varchar('public_key_x25519', { length: 256 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const householdMembers = pgTable('household_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: userRoleEnum('role').default('teen_child').notNull(),
  displayName: varchar('display_name', { length: 80 }),
  isEmergencyContact: boolean('is_emergency_contact').default(false).notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
