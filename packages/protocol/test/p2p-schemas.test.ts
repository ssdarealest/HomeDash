import { describe, it, expect } from 'vitest';
import {
  PeerAnnouncementSchema,
  PeerHandshakeRequestSchema,
  PeerHandshakeResponseSchema,
  PeerSyncPayloadSchema,
  PeerSyncAckSchema,
} from '../src/p2p';

describe('P2P Protocol Schemas (Phase 6 Task 1)', () => {
  const householdId = '11111111-1111-4111-a111-111111111111';
  const peerId = '22222222-2222-4222-a222-222222222222';
  const validTimestamp = new Date().toISOString();

  it('validates a valid PeerAnnouncement', () => {
    const valid = {
      householdId,
      peerId,
      deviceName: 'Alyosha iPad Pro',
      hlcTimestamp: '2026-11-19T10:00:00.000Z-0001-peer1',
      port: 8443,
      signature: 'valid_hmac_hex_sig',
      timestamp: validTimestamp,
    };
    const result = PeerAnnouncementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid port in PeerAnnouncement', () => {
    const invalid = {
      householdId,
      peerId,
      deviceName: 'Living Room Hub',
      hlcTimestamp: '2026-11-19T10:00:00.000Z-0001-peer1',
      port: 80, // Less than 1024
      signature: 'valid_hmac_hex_sig',
      timestamp: validTimestamp,
    };
    const result = PeerAnnouncementSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates a PeerHandshakeRequest and Response', () => {
    const req = {
      householdId,
      peerId,
      nonce: '1234567890abcdef',
      signature: 'req_sig',
      timestamp: validTimestamp,
    };
    expect(PeerHandshakeRequestSchema.safeParse(req).success).toBe(true);

    const res = {
      accepted: true,
      sessionNonce: 'fedcba0987654321',
      sessionSignature: 'res_sig',
    };
    expect(PeerHandshakeResponseSchema.safeParse(res).success).toBe(true);
  });

  it('validates PeerSyncPayload with mutations', () => {
    const payload = {
      senderPeerId: peerId,
      householdId,
      baseHlc: '2026-11-19T09:00:00.000Z-0000-peer1',
      targetHlc: '2026-11-19T10:00:00.000Z-0001-peer1',
      mutations: [
        {
          id: '33333333-3333-4333-a333-333333333333',
          entityType: 'grocery_item',
          entityId: 'item-1',
          operation: 'create',
          payload: { name: 'Apples' },
          hlcTimestamp: '2026-11-19T09:30:00.000Z-0001-peer1',
        },
      ],
    };
    const result = PeerSyncPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('validates PeerSyncAck', () => {
    const ack = {
      status: 'ok',
      appliedCount: 1,
      newHlc: '2026-11-19T10:00:00.000Z-0001-peer1',
    };
    expect(PeerSyncAckSchema.safeParse(ack).success).toBe(true);
  });
});
