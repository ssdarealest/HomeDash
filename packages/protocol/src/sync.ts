import { z } from 'zod';

export const SyncOperationSchema = z.enum(['INSERT', 'UPDATE', 'DELETE']);
export type SyncOperation = z.infer<typeof SyncOperationSchema>;

export const SyncMutationSchema = z.object({
  id: z.string().uuid().optional(),
  entityTable: z.string().min(1).max(80),
  entityId: z.string().uuid(),
  operation: SyncOperationSchema,
  recordPayload: z.record(z.any()).nullable().optional(),
  hlcTimestamp: z.string().min(1),
});
export type SyncMutation = z.infer<typeof SyncMutationSchema>;

export const SyncPushRequestSchema = z.object({
  householdId: z.string().uuid(),
  clientId: z.string().min(1).default('default'),
  mutations: z.array(SyncMutationSchema),
});
export type SyncPushRequest = z.infer<typeof SyncPushRequestSchema>;

export const SyncPushResponseSchema = z.object({
  appliedCount: z.number().int().nonnegative(),
  newHighwaterMark: z.number().int().nonnegative(),
  serverTimestamp: z.string().datetime(),
  serverHlc: z.string().min(1),
});
export type SyncPushResponse = z.infer<typeof SyncPushResponseSchema>;

export const SyncPullRequestSchema = z.object({
  householdId: z.string().uuid(),
  cursor: z.number().int().nonnegative().default(0),
  limit: z.number().int().min(1).max(1000).default(100),
});
export type SyncPullRequest = z.infer<typeof SyncPullRequestSchema>;

export const SyncChangeRecordSchema = z.object({
  id: z.number().int().nonnegative(),
  entityTable: z.string(),
  entityId: z.string().uuid(),
  operation: SyncOperationSchema,
  recordPayload: z.record(z.any()).nullable(),
  hlcTimestamp: z.string(),
  createdAt: z.string(),
});
export type SyncChangeRecord = z.infer<typeof SyncChangeRecordSchema>;

export const SyncPullResponseSchema = z.object({
  changes: z.array(SyncChangeRecordSchema),
  newCursor: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  serverHlc: z.string(),
});
export type SyncPullResponse = z.infer<typeof SyncPullResponseSchema>;

export const RealtimeSyncEventSchema = z.object({
  type: z.literal('sync:invalidate'),
  householdId: z.string().uuid(),
  highwaterMark: z.number().int().nonnegative(),
  sourceClientId: z.string().optional(),
  timestamp: z.string().datetime(),
});
export type RealtimeSyncEvent = z.infer<typeof RealtimeSyncEventSchema>;
