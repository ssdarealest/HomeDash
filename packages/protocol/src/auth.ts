import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'senior', 'teen_child', 'caregiver_guest']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  fullName: z.string().min(1).max(120),
  avatarUrl: z.string().url().optional(),
  publicKeyX25519: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const HouseholdMemberSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  userId: z.string().uuid(),
  role: UserRoleSchema,
  displayName: z.string().max(80).optional(),
  isEmergencyContact: z.boolean().default(false),
  validUntil: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type HouseholdMember = z.infer<typeof HouseholdMemberSchema>;
