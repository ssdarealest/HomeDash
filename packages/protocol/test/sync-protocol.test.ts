import { describe, it, expect } from 'vitest';
import {
  SyncPullRequestSchema,
  SyncPullResponseSchema,
  RealtimeSyncEventSchema,
  SyncPushRequestSchema,
  SyncMutationSchema,
} from '../src/sync';

describe('Sync Protocol Schemas', () => {
  it('should validate SyncPullRequestSchema', () => {
    const valid = {
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      cursor: 15,
      limit: 50,
    };
    const parsed = SyncPullRequestSchema.safeParse(valid);
    expect(parsed.success).toBe(true);

    const withDefaults = {
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    };
    const parsedDefaults = SyncPullRequestSchema.parse(withDefaults);
    expect(parsedDefaults.cursor).toBe(0);
    expect(parsedDefaults.limit).toBe(100);
  });

  it('should validate SyncPullResponseSchema with changes and highwater cursor', () => {
    const validResponse = {
      changes: [
        {
          id: 101,
          entityTable: 'chores',
          entityId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          operation: 'INSERT',
          recordPayload: { title: 'Take out compost', points: 10 },
          hlcTimestamp: '2026-11-18T10:00:00.000Z:0001:node1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 102,
          entityTable: 'chores',
          entityId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
          operation: 'DELETE',
          recordPayload: null,
          hlcTimestamp: '2026-11-18T10:05:00.000Z:0001:node2',
          createdAt: new Date().toISOString(),
        },
      ],
      newCursor: 102,
      hasMore: false,
      serverHlc: '2026-11-18T10:05:00.000Z:0002:server',
    };

    const parsed = SyncPullResponseSchema.safeParse(validResponse);
    expect(parsed.success).toBe(true);
  });

  it('should validate RealtimeSyncEventSchema for invalidation notifications', () => {
    const validEvent = {
      type: 'sync:invalidate',
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      highwaterMark: 105,
      sourceClientId: 'client-mobile-1',
      timestamp: new Date().toISOString(),
    };

    const parsed = RealtimeSyncEventSchema.safeParse(validEvent);
    expect(parsed.success).toBe(true);

    const invalidType = { ...validEvent, type: 'other:event' };
    expect(RealtimeSyncEventSchema.safeParse(invalidType).success).toBe(false);
  });

  it('should validate SyncPushRequestSchema with clientId and optional mutation id', () => {
    const validPush = {
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      clientId: 'device-iphone-14',
      mutations: [
        {
          id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
          entityTable: 'grocery_items',
          entityId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
          operation: 'UPDATE',
          recordPayload: { checked: true },
          hlcTimestamp: '2026-11-18T10:10:00.000Z:0001:device-iphone-14',
        },
      ],
    };

    const parsed = SyncPushRequestSchema.safeParse(validPush);
    expect(parsed.success).toBe(true);
  });
});
