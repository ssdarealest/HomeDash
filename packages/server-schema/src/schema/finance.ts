import { pgTable, uuid, varchar, bigint, date, text, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { households, householdMembers } from './households';

export const accountTypeEnum = pgEnum('account_type', ['shared_checking', 'personal_allowance', 'sinking_fund']);
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense', 'transfer']);
export const transactionSourceEnum = pgEnum('transaction_source', ['manual', 'android_push', 'bank_webhook', 'bill_ocr']);
export const billTypeEnum = pgEnum('bill_type', ['electricity', 'water', 'internet', 'mobile_plan', 'other']);
export const billStatusEnum = pgEnum('bill_status', ['detected', 'pending_review', 'approved', 'paid']);

export const financeAccounts = pgTable('finance_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  accountType: accountTypeEnum('account_type').default('shared_checking').notNull(),
  balanceCents: bigint('balance_cents', { mode: 'number' }).default(0).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  ownerMemberId: uuid('owner_member_id').references(() => householdMembers.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const financeTransactions = pgTable('finance_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  accountId: uuid('account_id').references(() => financeAccounts.id, { onDelete: 'cascade' }).notNull(),
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  transactionType: transactionTypeEnum('transaction_type').notNull(),
  category: varchar('category', { length: 60 }).notNull(),
  description: text('description'),
  transactionDate: date('transaction_date').defaultNow().notNull(),
  source: transactionSourceEnum('source').default('manual').notNull(),
  receiptUrl: text('receipt_url'),
  createdByMemberId: uuid('created_by_member_id').references(() => householdMembers.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const utilityBills = pgTable('utility_bills', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  providerName: varchar('provider_name', { length: 120 }).notNull(),
  billType: billTypeEnum('bill_type').notNull(),
  billingPeriodStart: date('billing_period_start'),
  billingPeriodEnd: date('billing_period_end'),
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  dueDate: date('due_date').notNull(),
  status: billStatusEnum('status').default('detected').notNull(),
  rawInvoiceUrl: text('raw_invoice_url'),
  ocrMetadata: jsonb('ocr_metadata').default({}),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
