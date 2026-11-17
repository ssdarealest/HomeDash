import { pgTable, uuid, varchar, text, boolean, integer, bigint, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { households, householdMembers } from './households';

export const aisleCategoryEnum = pgEnum('aisle_category', [
  'produce',
  'dairy',
  'meat_seafood',
  'bakery',
  'pantry',
  'frozen',
  'household',
]);

export const groceryItems = pgTable('grocery_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  quantity: varchar('quantity', { length: 50 }).default('1').notNull(),
  aisleCategory: aisleCategoryEnum('aisle_category').default('pantry').notNull(),
  isChecked: boolean('is_checked').default(false).notNull(),
  checkedByMemberId: uuid('checked_by_member_id').references(() => householdMembers.id),
  checkedAt: timestamp('checked_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mealPlans = pgTable('meal_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  plannedDate: date('planned_date').notNull(),
  mealType: varchar('meal_type', { length: 20 }).notNull(),
  recipeTitle: varchar('recipe_title', { length: 120 }).notNull(),
  notes: text('notes'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const chores = pgTable('chores', {
  id: uuid('id').defaultRandom().primaryKey(),
  householdId: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 120 }).notNull(),
  assignedMemberId: uuid('assigned_member_id').references(() => householdMembers.id, { onDelete: 'set null' }),
  recurrenceRule: varchar('recurrence_rule', { length: 50 }),
  rewardPoints: integer('reward_points').default(0).notNull(),
  allowanceCents: bigint('allowance_cents', { mode: 'number' }).default(0).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  verifiedByAdmin: boolean('verified_by_admin').default(false).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
