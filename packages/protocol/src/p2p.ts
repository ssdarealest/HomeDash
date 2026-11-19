import { z } from 'zod';

export const PeerAnnouncementSchema = z.object({
  householdId: z.string().uuid(),
  peerId: z.string().uuid(),
  deviceName: z.string().min(1).max(100),
  hlcTimestamp: z.string().min(1),
  port: z.number().int().min(1024).max(65535),
  signature: z.string().min(1),
  timestamp: z.string().datetime(),
});
export type PeerAnnouncement = z.infer<typeof PeerAnnouncementSchema>;

export const PeerHandshakeRequestSchema = z.object({
  householdId: z.string().uuid(),
  peerId: z.string().uuid(),
  nonce: z.string().min(8),
  signature: z.string().min(1),
  timestamp: z.string().datetime(),
});
export type PeerHandshakeRequest = z.infer<typeof PeerHandshakeRequestSchema>;

export const PeerHandshakeResponseSchema = z.object({
  accepted: z.boolean(),
  responderPeerId: z.string().uuid().optional(),
  sessionNonce: z.string().min(8),
  sessionSignature: z.string().min(1),
  reason: z.string().optional(),
});
export type PeerHandshakeResponse = z.infer<typeof PeerHandshakeResponseSchema>;

export const PeerMutationSchema = z.object({
  id: z.string().optional(),
  entityType: z.string().optional(),
  entityTable: z.string().optional(),
  entityId: z.string().min(1),
  operation: z.string().min(1),
  payload: z.record(z.any()).nullable().optional(),
  recordPayload: z.record(z.any()).nullable().optional(),
  hlcTimestamp: z.string().min(1),
});
export type PeerMutation = z.infer<typeof PeerMutationSchema>;

export const PeerSyncPayloadSchema = z.object({
  senderPeerId: z.string().uuid(),
  householdId: z.string().uuid(),
  baseHlc: z.string().min(1),
  targetHlc: z.string().min(1),
  mutations: z.array(PeerMutationSchema),
  signature: z.string().optional(),
});
export type PeerSyncPayload = z.infer<typeof PeerSyncPayloadSchema>;

export const PeerSyncAckSchema = z.object({
  status: z.enum(['ok', 'error', 'partial']),
  appliedCount: z.number().int().nonnegative(),
  newHlc: z.string().min(1),
  error: z.string().optional(),
});
export type PeerSyncAck = z.infer<typeof PeerSyncAckSchema>;
