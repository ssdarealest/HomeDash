import { z } from 'zod';

export const VaultCategorySchema = z.enum([
  'national_id',
  'insurance',
  'property_deed',
  'medical_directive',
  'emergency_credential',
]);
export type VaultCategory = z.infer<typeof VaultCategorySchema>;

export const VaultItemCreateSchema = z.object({
  householdId: z.string().uuid(),
  title: z.string().min(1).max(150),
  category: VaultCategorySchema,
  encryptedPayload: z.string().base64(),
  payloadNonce: z.string().base64(),
  encryptedDek: z.string().base64(),
  dekNonce: z.string().base64(),
  keyVersion: z.number().int().default(1),
});
export type VaultItemCreate = z.infer<typeof VaultItemCreateSchema>;

export const VaultItemSchema = VaultItemCreateSchema.extend({
  id: z.string().uuid(),
  createdByMemberId: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type VaultItem = z.infer<typeof VaultItemSchema>;

export const BreakGlassInitiateSchema = z.object({
  householdId: z.string().uuid(),
});
export type BreakGlassInitiate = z.infer<typeof BreakGlassInitiateSchema>;

export const BreakGlassVetoSchema = z.object({
  requestId: z.string().uuid(),
  vetoToken: z.string().min(10),
});
export type BreakGlassVeto = z.infer<typeof BreakGlassVetoSchema>;
