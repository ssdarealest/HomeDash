import { pgTable, bigserial, uuid, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { households } from './households';

export const syncChanges = pgTable('sync_changes', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  entityTable: varchar('entity_table', { length: 80 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  operation: varchar('operation', { length: 10 }).notNull(), // 'INSERT', 'UPDATE', 'DELETE'
  recordPayload: jsonb('record_payload'),
  hlcTimestamp: varchar('hlc_timestamp', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_sync_changes_cursor').on(table.householdId, table.id),
]);
