import { z } from 'zod';

export const AisleCategorySchema = z.enum([
  'produce',
  'dairy',
  'meat_seafood',
  'bakery',
  'pantry',
  'frozen',
  'household',
]);
export type AisleCategory = z.infer<typeof AisleCategorySchema>;

export const GroceryItemCreateSchema = z.object({
  householdId: z.string().uuid(),
  name: z.string().min(1).max(120),
  quantity: z.string().max(50).default('1'),
  aisleCategory: AisleCategorySchema.default('pantry'),
});
export type GroceryItemCreate = z.infer<typeof GroceryItemCreateSchema>;

export const GroceryItemCheckSchema = z.object({
  isChecked: z.boolean(),
  checkedByMemberId: z.string().uuid().optional(),
});
export type GroceryItemCheck = z.infer<typeof GroceryItemCheckSchema>;

export const GroceryCheckoutSchema = z.object({
  householdId: z.string().uuid(),
  accountId: z.string().uuid(),
  category: z.string().min(1).default('Groceries'),
  totalAmountCents: z.number().int().positive(),
  notes: z.string().optional(),
});
export type GroceryCheckout = z.infer<typeof GroceryCheckoutSchema>;

export const MealPlanCreateSchema = z.object({
  householdId: z.string().uuid(),
  plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  mealType: z.string().min(1).max(20),
  recipeTitle: z.string().min(1).max(120),
  notes: z.string().optional(),
});
export type MealPlanCreate = z.infer<typeof MealPlanCreateSchema>;

export const ChoreToggleSchema = z.object({
  isCompleted: z.boolean(),
});
export type ChoreToggle = z.infer<typeof ChoreToggleSchema>;

export const ChoreVerifySchema = z.object({
  verified: z.boolean(),
});
export type ChoreVerify = z.infer<typeof ChoreVerifySchema>;
