import { describe, it, expect, beforeEach } from 'vitest';
import {
  P2PSyncCoordinator,
  HlcReconciler,
} from '../src';
import type { PeerSyncPayload } from '@homedash/protocol';

describe('Direct P2P Delta Reconciler & Sync Transport (Phase 6 Task 3)', () => {
  const householdId = '11111111-1111-4111-a111-111111111111';
  const otherHouseholdId = '99999999-9999-4999-a999-999999999999';
  const householdKey = 'household_shared_secret_key_123';
  const peer1Id = '22222222-2222-4222-a222-222222222222';
  const peer2Id = '33333333-3333-4333-a333-333333333333';

  let coordinator1: P2PSyncCoordinator;
  let coordinator2: P2PSyncCoordinator;

  beforeEach(() => {
    coordinator1 = new P2PSyncCoordinator({
      householdId,
      peerId: peer1Id,
      householdKey,
      initialHlc: '2026-11-19T10:00:00.000Z-0000-peer1',
    });
    coordinator2 = new P2PSyncCoordinator({
      householdId,
      peerId: peer2Id,
      householdKey,
      initialHlc: '2026-11-19T10:00:00.000Z-0000-peer2',
    });
  });

  it('records local mutations and packs them into a sync payload', async () => {
    coordinator1.recordLocalMutation({
      entityTable: 'grocery_items',
      entityId: 'item-101',
      operation: 'INSERT',
      recordPayload: { name: 'Almond Milk', quantity: 2 },
    });

    const payload = await coordinator1.createSyncPayload('2026-11-19T09:00:00.000Z-0000-peer1');
    expect(payload.householdId).toBe(householdId);
    expect(payload.senderPeerId).toBe(peer1Id);
    expect(payload.mutations.length).toBe(1);
    expect(payload.mutations[0].entityId).toBe('item-101');
  });

  it('reconciles incoming peer payload and applies newer mutations', async () => {
    // Peer 1 creates item
    coordinator1.recordLocalMutation({
      entityTable: 'grocery_items',
      entityId: 'item-102',
      operation: 'INSERT',
      recordPayload: { name: 'Eggs', quantity: 12 },
    });
    const payloadFrom1 = await coordinator1.createSyncPayload('2026-11-19T09:00:00.000Z-0000-peer1');

    // Peer 2 receives payload from Peer 1
    const ack = await coordinator2.receiveSyncPayload(payloadFrom1);
    expect(ack.status).toBe('ok');
    expect(ack.appliedCount).toBe(1);

    const peer2Item = coordinator2.getLocalRecord('grocery_items', 'item-102');
    expect(peer2Item).toBeDefined();
    expect(peer2Item?.recordPayload?.name).toBe('Eggs');
  });

  it('rejects sync payload from a mismatched household', async () => {
    const maliciousPayload: PeerSyncPayload = {
      householdId: otherHouseholdId,
      senderPeerId: peer1Id,
      baseHlc: '2026-11-19T10:00:00.000Z-0000-peer1',
      targetHlc: '2026-11-19T10:05:00.000Z-0001-peer1',
      mutations: [
        {
          entityTable: 'grocery_items',
          entityId: 'item-hacked',
          operation: 'INSERT',
          payload: { name: 'Injected Item' },
          hlcTimestamp: '2026-11-19T10:05:00.000Z-0001-peer1',
        },
      ],
    };

    const ack = await coordinator2.receiveSyncPayload(maliciousPayload);
    expect(ack.status).toBe('error');
    expect(ack.appliedCount).toBe(0);
    expect(coordinator2.getLocalRecord('grocery_items', 'item-hacked')).toBeUndefined();
  });

  it('executes bidirectional P2P sync between two peers', async () => {
    // Peer 1 adds chore
    coordinator1.recordLocalMutation({
      entityTable: 'chores',
      entityId: 'chore-1',
      operation: 'INSERT',
      recordPayload: { title: 'Wash dishes' },
    });

    // Peer 2 adds medication log
    coordinator2.recordLocalMutation({
      entityTable: 'medication_logs',
      entityId: 'log-1',
      operation: 'INSERT',
      recordPayload: { status: 'taken', medicationId: 'med-5' },
    });

    // Perform bidirectional sync: Peer 1 pushes to and pulls from Peer 2
    const syncResult = await coordinator1.performPeerSync(
      peer2Id,
      {
        sendPayload: (p) => coordinator2.receiveSyncPayload(p),
        requestPayload: (since) => coordinator2.createSyncPayload(since),
      },
      '2026-11-19T00:00:00.000Z-0000-peer2'
    );

    expect(syncResult.sentCount).toBe(1);
    expect(syncResult.receivedCount).toBe(1);

    // Both peers now have both records
    expect(coordinator2.getLocalRecord('chores', 'chore-1')).toBeDefined();
    expect(coordinator1.getLocalRecord('medication_logs', 'log-1')).toBeDefined();
  });

  it('rejects sync payloads with tampered HMAC signatures', async () => {
    coordinator1.recordLocalMutation({
      entityTable: 'grocery_items',
      entityId: 'item-tamper',
      operation: 'INSERT',
      recordPayload: { name: 'Milk' },
    });

    const payload = await coordinator1.createSyncPayload('2026-11-19T00:00:00.000Z-0000-peer1');
    expect(payload.signature).toBeDefined();

    // Tamper with payload
    const forgedPayload = {
      ...payload,
      signature: 'deadbeef1234567890abcdefdeadbeef1234567890abcdefdeadbeef12345678',
    };

    const ack = await coordinator2.receiveSyncPayload(forgedPayload);
    expect(ack.status).toBe('error');
    expect(ack.error).toContain('Invalid payload signature');
    expect(coordinator2.getLocalRecord('grocery_items', 'item-tamper')).toBeUndefined();
  });

  it('enforces caregiver guest quarantine in P2P payload generation and ingestion', async () => {
    coordinator1.recordLocalMutation({
      entityTable: 'finance_accounts',
      entityId: 'fin-secret',
      operation: 'INSERT',
      recordPayload: { balanceCents: 500000 },
    });
    coordinator1.recordLocalMutation({
      entityTable: 'chores',
      entityId: 'chore-public',
      operation: 'INSERT',
      recordPayload: { title: 'Water plants' },
    });

    // 1. Sending to caregiver strips finance/vault
    const caregiverPayload = await coordinator1.createSyncPayload(
      '2026-11-19T00:00:00.000Z-0000-peer1',
      'caregiver_guest'
    );
    expect(caregiverPayload.mutations.length).toBe(1);
    expect(caregiverPayload.mutations[0].entityTable).toBe('chores');

    // 2. Receiving from caregiver drops any finance/vault mutations
    const injectedCaregiverPayload = await coordinator1.createSyncPayload(
      '2026-11-19T00:00:00.000Z-0000-peer1'
    );
    expect(injectedCaregiverPayload.mutations.length).toBe(2);

    const caregiverAck = await coordinator2.receiveSyncPayload(
      injectedCaregiverPayload,
      'caregiver_guest'
    );
    expect(caregiverAck.status).toBe('ok');
    // Only chores should be applied, finance_accounts must be dropped
    expect(coordinator2.getLocalRecord('chores', 'chore-public')).toBeDefined();
    expect(coordinator2.getLocalRecord('finance_accounts', 'fin-secret')).toBeUndefined();
  });

  it('prevents remote clock poisoning from future forward drift', async () => {
    const farFutureHlc = new Date(Date.now() + 10 * 60 * 1000).toISOString() + '-0001-peer1';
    const futurePayload: PeerSyncPayload = {
      householdId,
      senderPeerId: peer1Id,
      baseHlc: '2026-11-19T00:00:00.000Z-0000-peer1',
      targetHlc: farFutureHlc,
      mutations: [
        {
          entityTable: 'grocery_items',
          entityId: 'item-poison',
          operation: 'INSERT',
          recordPayload: { name: 'Poison Apple' },
          hlcTimestamp: farFutureHlc,
        },
      ],
    };

    const initialHlc = coordinator2.getCurrentHlcString();
    const ack = await coordinator2.receiveSyncPayload(futurePayload);
    expect(ack.status).toBe('ok');
    expect(coordinator2.getLocalRecord('grocery_items', 'item-poison')).toBeUndefined();
    // Clock was not poisoned into the far future
    expect(coordinator2.getCurrentHlcString()).toBe(initialHlc);
  });
});
