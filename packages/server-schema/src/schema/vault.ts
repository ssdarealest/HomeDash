import { pgTable, uuid, varchar, text, integer, jsonb, date, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { households, users, householdMembers } from './households';

export const vaultCategoryEnum = pgEnum('vault_category', [
  'national_id',
  'insurance',
  'property_deed',
  'medical_directive',
  'emergency_credential',
]);

export const breakGlassStatusEnum = pgEnum('break_glass_status', [
  'pending_cooldown',
  'approved',
  'vetoed',
  'expired',
]);

export const householdVaultKeys = pgTable(
  'household_vault_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    encryptedKek: text('encrypted_kek').notNull(),
    kekSalt: varchar('kek_salt', { length: 64 }).notNull(),
    kekNonce: varchar('kek_nonce', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('unique_vault_key').on(t.householdId, t.userId),
  ]
);

export const vaultItems = pgTable('vault_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 150 }).notNull(),
  category: vaultCategoryEnum('category').notNull(),
  encryptedPayload: text('encrypted_payload').notNull(),
  payloadNonce: varchar('payload_nonce', { length: 64 }).notNull(),
  encryptedDek: text('encrypted_dek').notNull(),
  dekNonce: varchar('dek_nonce', { length: 64 }).notNull(),
  keyVersion: integer('key_version').default(1).notNull(),
  createdByMemberId: uuid('created_by_member_id').references(() => householdMembers.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vaultEscrowShares = pgTable(
  'vault_escrow_shares',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
    recipientUserId: uuid('recipient_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    encryptedKekShare: text('encrypted_kek_share').notNull(),
    ephemeralPublicKey: text('ephemeral_public_key').notNull(),
    nonce: varchar('nonce', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('unique_escrow_share').on(t.householdId, t.recipientUserId),
  ]
);

export const breakGlassRequests = pgTable('break_glass_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  requesterUserId: uuid('requester_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: breakGlassStatusEnum('status').default('pending_cooldown').notNull(),
  reason: text('reason').notNull(),
  cooldownExpiresAt: timestamp('cooldown_expires_at', { withTimezone: true }).notNull(),
  vetoedByUserId: uuid('vetoed_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  vetoReason: text('veto_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const assetRenewals = pgTable('asset_renewals', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  assetName: varchar('asset_name', { length: 120 }).notNull(),
  renewalDate: date('renewal_date').notNull(),
  notificationLeadDays: integer('notification_lead_days').default(30).notNull(),
  notes: text('notes'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const homeWikiCards = pgTable('home_wiki_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 150 }).notNull(),
  contentMarkdown: text('content_markdown').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
