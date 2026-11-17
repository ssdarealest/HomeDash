import { z } from 'zod';

export const SyncOperationSchema = z.enum(['INSERT', 'UPDATE', 'DELETE']);
export type SyncOperation = z.infer<typeof SyncOperationSchema>;

export const SyncMutationSchema = z.object({
  entityTable: z.string().min(1).max(80),
  entityId: z.string().uuid(),
  operation: SyncOperationSchema,
  recordPayload: z.record(z.any()).nullable().optional(),
  hlcTimestamp: z.string().min(1),
});
export type SyncMutation = z.infer<typeof SyncMutationSchema>;

export const SyncPushRequestSchema = z.object({
  householdId: z.string().uuid(),
  mutations: z.array(SyncMutationSchema),
});
export type SyncPushRequest = z.infer<typeof SyncPushRequestSchema>;

export const SyncPushResponseSchema = z.object({
  appliedCount: z.number().int().nonnegative(),
  newHighwaterMark: z.number().int().nonnegative(),
  serverTimestamp: z.string().datetime(),
});
export type SyncPushResponse = z.infer<typeof SyncPushResponseSchema>;

export const SyncPullRequestSchema = z.object({
  householdId: z.string().uuid(),
  cursor: z.number().int().nonnegative().default(0),
  limit: z.number().int().min(1).max(1000).default(100),
});
export type SyncPullRequest = z.infer<typeof SyncPullRequestSchema>;
