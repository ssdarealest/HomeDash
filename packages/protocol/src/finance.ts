import { z } from 'zod';

export const AccountTypeSchema = z.enum(['shared_checking', 'personal_allowance', 'sinking_fund']);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const TransactionTypeSchema = z.enum(['income', 'expense', 'transfer']);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionSourceSchema = z.enum(['manual', 'android_push', 'bank_webhook', 'bill_ocr']);
export type TransactionSource = z.infer<typeof TransactionSourceSchema>;

export const FinanceAccountCreateSchema = z.object({
  householdId: z.string().uuid(),
  name: z.string().min(1).max(100),
  accountType: AccountTypeSchema.default('shared_checking'),
  currency: z.string().length(3).default('USD'),
  ownerMemberId: z.string().uuid().optional(),
});
export type FinanceAccountCreate = z.infer<typeof FinanceAccountCreateSchema>;

export const FinanceTransactionCreateSchema = z.object({
  householdId: z.string().uuid(),
  accountId: z.string().uuid(),
  amountCents: z.number().int(),
  transactionType: TransactionTypeSchema,
  category: z.string().min(1).max(60),
  description: z.string().optional(),
  source: TransactionSourceSchema.default('manual'),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type FinanceTransactionCreate = z.infer<typeof FinanceTransactionCreateSchema>;

export const AndroidPushNotificationSchema = z.object({
  packageName: z.string().min(1),
  rawText: z.string().min(1),
  timestamp: z.number().int().positive(),
  accountId: z.string().uuid().optional(),
});
export type AndroidPushNotification = z.infer<typeof AndroidPushNotificationSchema>;

export const BillTypeSchema = z.enum(['electricity', 'water', 'internet', 'mobile_plan', 'other']);
export type BillType = z.infer<typeof BillTypeSchema>;

export const UtilityBillCreateSchema = z.object({
  householdId: z.string().uuid(),
  providerName: z.string().min(1).max(120),
  billType: BillTypeSchema,
  amountCents: z.number().int().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  billingPeriodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  billingPeriodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type UtilityBillCreate = z.infer<typeof UtilityBillCreateSchema>;
