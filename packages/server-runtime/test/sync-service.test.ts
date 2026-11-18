import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncService, InMemorySyncJournalStore } from '../src/sync/service';
import { SyncPubSub } from '../src/sync/pubsub';
import type { SyncPushRequest, SyncPullRequest } from '@homedash/protocol';

describe('Tier 4 Server Sync Service', () => {
  let pubsub: SyncPubSub;
  let journalStore: InMemorySyncJournalStore;
  let syncService: SyncService;

  const householdId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const adminUserId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const caregiverUserId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  beforeEach(() => {
    pubsub = new SyncPubSub();
    journalStore = new InMemorySyncJournalStore();
    syncService = new SyncService({
      journalStore,
      pubsub,
    });
  });

  it('should process push mutations for allowed tables and publish invalidation', async () => {
    const invalidationSpy = vi.fn();
    pubsub.subscribe(householdId, invalidationSpy);

    const pushReq: SyncPushRequest = {
      householdId,
      clientId: 'mobile_client_1',
      mutations: [
        {
          entityTable: 'grocery_items',
          entityId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
          operation: 'INSERT',
          recordPayload: { name: 'Eggs', quantity: 12 },
          hlcTimestamp: '2026-11-18T10:00:00.000Z:0001:mobile_client_1',
        },
      ],
    };

    const res = await syncService.processPush(householdId, adminUserId, 'admin', pushReq);
    expect(res.appliedCount).toBe(1);
    expect(res.newHighwaterMark).toBeGreaterThan(0);
    expect(res.serverHlc).toBeDefined();

    expect(invalidationSpy).toHaveBeenCalledTimes(1);
    const event = invalidationSpy.mock.calls[0][0];
    expect(event.type).toBe('sync:invalidate');
    expect(event.householdId).toBe(householdId);
    expect(event.sourceClientId).toBe('mobile_client_1');
  });

  it('should strictly reject caregiver_guest attempting to push financial records with 403', async () => {
    const pushReq: SyncPushRequest = {
      householdId,
      clientId: 'caregiver_phone',
      mutations: [
        {
          entityTable: 'finance_transactions',
          entityId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
          operation: 'INSERT',
          recordPayload: { amountCents: 5000, description: 'Illegal transaction' },
          hlcTimestamp: '2026-11-18T10:00:00.000Z:0001:caregiver_phone',
        },
      ],
    };

    await expect(
      syncService.processPush(householdId, caregiverUserId, 'caregiver_guest', pushReq)
    ).rejects.toThrow('Forbidden');
  });

  it('should reject push mutations targeting unwhitelisted tables with 400', async () => {
    const pushReq: SyncPushRequest = {
      householdId,
      clientId: 'mobile_client_1',
      mutations: [
        {
          entityTable: 'users', // Not in collaborative sync whitelist
          entityId: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
          operation: 'UPDATE',
          recordPayload: { email: 'hacker@example.com' },
          hlcTimestamp: '2026-11-18T10:00:00.000Z:0001:mobile_client_1',
        },
      ],
    };

    await expect(
      syncService.processPush(householdId, adminUserId, 'admin', pushReq)
    ).rejects.toThrow('Table not eligible for synchronization');
  });

  it('should process pull requests and return paginated delta changes', async () => {
    // Populate journal with 3 changes
    await journalStore.recordChange({
      householdId,
      entityTable: 'chores',
      entityId: '11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      operation: 'INSERT',
      recordPayload: { title: 'Water Plants' },
      hlcTimestamp: '2026-11-18T10:00:00.000Z:0001:node1',
    });
    await journalStore.recordChange({
      householdId,
      entityTable: 'grocery_items',
      entityId: '22eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      operation: 'INSERT',
      recordPayload: { name: 'Coffee beans' },
      hlcTimestamp: '2026-11-18T10:01:00.000Z:0001:node1',
    });

    const pullReq: SyncPullRequest = {
      householdId,
      cursor: 0,
      limit: 10,
    };

    const pullRes = await syncService.processPull(householdId, 'admin', pullReq);
    expect(pullRes.changes.length).toBe(2);
    expect(pullRes.newCursor).toBe(2);
    expect(pullRes.hasMore).toBe(false);
  });

  it('should strip financial change records from pull response when role is caregiver_guest', async () => {
    // 1 chore change + 1 finance change
    await journalStore.recordChange({
      householdId,
      entityTable: 'chores',
      entityId: '33eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      operation: 'INSERT',
      recordPayload: { title: 'Dust shelves' },
      hlcTimestamp: '2026-11-18T10:02:00.000Z:0001:node1',
    });
    await journalStore.recordChange({
      householdId,
      entityTable: 'finance_transactions',
      entityId: '44eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      operation: 'INSERT',
      recordPayload: { amountCents: 15000 },
      hlcTimestamp: '2026-11-18T10:03:00.000Z:0001:node1',
    });

    const pullReq: SyncPullRequest = {
      householdId,
      cursor: 0,
      limit: 10,
    };

    const pullRes = await syncService.processPull(householdId, 'caregiver_guest', pullReq);
    // Caregiver should only see the chore change, NOT the finance transaction!
    expect(pullRes.changes.length).toBe(1);
    expect(pullRes.changes[0].entityTable).toBe('chores');
  });
});
