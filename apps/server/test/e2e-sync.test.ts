import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import {
  signSessionToken,
  SyncService,
  InMemorySyncJournalStore,
  SyncPubSub,
} from '@homedash/server-runtime';
import {
  InMemoryOutboxStore,
  InMemoryLocalEntityStore,
  ConflictReconciler,
  SyncCoordinator,
  type SyncTransport,
} from '@homedash/sync-engine';
import { HybridLogicalClock } from '@homedash/shared';
import type {
  SyncPushRequest,
  SyncPushResponse,
  SyncPullRequest,
  SyncPullResponse,
} from '@homedash/protocol';

describe('End-to-End Multi-Device Collaborative Sync Simulation', () => {
  const jwtSecret = 'e2e_jwt_test_secret_key_at_least_32_bytes_long!!';
  const householdId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  let app: ReturnType<typeof createApp>;
  let journalStore: InMemorySyncJournalStore;
  let pubsub: SyncPubSub;
  let syncService: SyncService;

  let clientA: {
    outbox: InMemoryOutboxStore;
    store: InMemoryLocalEntityStore;
    reconciler: ConflictReconciler;
    hlc: HybridLogicalClock;
    coordinator: SyncCoordinator;
    token: string;
  };

  let clientB: {
    outbox: InMemoryOutboxStore;
    store: InMemoryLocalEntityStore;
    reconciler: ConflictReconciler;
    hlc: HybridLogicalClock;
    coordinator: SyncCoordinator;
    token: string;
  };

  let caregiverClient: {
    outbox: InMemoryOutboxStore;
    store: InMemoryLocalEntityStore;
    reconciler: ConflictReconciler;
    hlc: HybridLogicalClock;
    coordinator: SyncCoordinator;
    token: string;
  };

  function createHttpTransport(token: string): SyncTransport {
    return {
      push: async (req: SyncPushRequest): Promise<SyncPushResponse> => {
        const res = await app.request('/api/v1/sync/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(req),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Push failed' }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
      },
      pull: async (req: SyncPullRequest): Promise<SyncPullResponse> => {
        const res = await app.request('/api/v1/sync/pull', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(req),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Pull failed' }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
      },
    };
  }

  beforeEach(async () => {
    journalStore = new InMemorySyncJournalStore();
    pubsub = new SyncPubSub();
    syncService = new SyncService({
      journalStore,
      pubsub,
      serverNodeId: 'server-primary',
    });

    app = createApp({
      jwtSecret,
      syncService,
      pubsub,
    } as any);

    // Setup Client A (Parent iPhone)
    const tokenA = await signSessionToken(
      {
        userId: '11111111-1111-1111-1111-111111111111',
        householdId,
        role: 'admin',
      },
      jwtSecret
    );
    const outboxA = new InMemoryOutboxStore();
    const storeA = new InMemoryLocalEntityStore();
    const reconcilerA = new ConflictReconciler(storeA);
    const hlcA = new HybridLogicalClock('device_parent_iphone', 1000, 0);
    const coordinatorA = new SyncCoordinator({
      householdId,
      clientId: 'device_parent_iphone',
      outbox: outboxA,
      reconciler: reconcilerA,
      transport: createHttpTransport(tokenA),
      hlc: hlcA,
    });
    clientA = { outbox: outboxA, store: storeA, reconciler: reconcilerA, hlc: hlcA, coordinator: coordinatorA, token: tokenA };

    // Setup Client B (Family iPad)
    const tokenB = await signSessionToken(
      {
        userId: '22222222-2222-2222-2222-222222222222',
        householdId,
        role: 'teen_child',
      },
      jwtSecret
    );
    const outboxB = new InMemoryOutboxStore();
    const storeB = new InMemoryLocalEntityStore();
    const reconcilerB = new ConflictReconciler(storeB);
    const hlcB = new HybridLogicalClock('device_family_ipad', 1000, 0);
    const coordinatorB = new SyncCoordinator({
      householdId,
      clientId: 'device_family_ipad',
      outbox: outboxB,
      reconciler: reconcilerB,
      transport: createHttpTransport(tokenB),
      hlc: hlcB,
    });
    clientB = { outbox: outboxB, store: storeB, reconciler: reconcilerB, hlc: hlcB, coordinator: coordinatorB, token: tokenB };

    // Setup Caregiver Client
    const tokenCaregiver = await signSessionToken(
      {
        userId: '33333333-3333-3333-3333-333333333333',
        householdId,
        role: 'caregiver_guest',
      },
      jwtSecret
    );
    const outboxCaregiver = new InMemoryOutboxStore();
    const storeCaregiver = new InMemoryLocalEntityStore();
    const reconcilerCaregiver = new ConflictReconciler(storeCaregiver);
    const hlcCaregiver = new HybridLogicalClock('device_caregiver_guest', 1000, 0);
    const coordinatorCaregiver = new SyncCoordinator({
      householdId,
      clientId: 'device_caregiver_guest',
      outbox: outboxCaregiver,
      reconciler: reconcilerCaregiver,
      transport: createHttpTransport(tokenCaregiver),
      hlc: hlcCaregiver,
    });
    caregiverClient = {
      outbox: outboxCaregiver,
      store: storeCaregiver,
      reconciler: reconcilerCaregiver,
      hlc: hlcCaregiver,
      coordinator: coordinatorCaregiver,
      token: tokenCaregiver,
    };
  });

  it('Scenario 1: Collaborative offline-first grocery list creation and multi-device propagation', async () => {
    const groceryId = 'aaaa0000-bbbb-cccc-dddd-eeee11112222';

    // 1. Client A creates grocery item offline
    const tsA = HybridLogicalClock.pack(clientA.hlc.send());
    await clientA.store.applyRemoteUpsert('grocery_items', groceryId, { name: 'Greek Yogurt', quantity: 2 }, tsA);
    await clientA.outbox.enqueue({
      householdId,
      entityTable: 'grocery_items',
      entityId: groceryId,
      operation: 'INSERT',
      recordPayload: { name: 'Greek Yogurt', quantity: 2 },
      hlcTimestamp: tsA,
    });

    // Client B does not have it yet
    expect(await clientB.store.getLocalRecord('grocery_items', groceryId)).toBeNull();

    // 2. Client A comes online and syncs
    let invalidationFired = false;
    pubsub.subscribe(householdId, (event) => {
      if (event.type === 'sync:invalidate' && event.sourceClientId === 'device_parent_iphone') {
        invalidationFired = true;
      }
    });

    const pushResultA = await clientA.coordinator.push();
    expect(pushResultA.pushedCount).toBe(1);
    expect(invalidationFired).toBe(true);

    // 3. Client B reacts to invalidation event and pulls delta changes
    const pullResultB = await clientB.coordinator.pull();
    expect(pullResultB.pulledCount).toBe(1);

    // 4. Verify Client B now has the identical grocery item
    const recordB = await clientB.store.getLocalRecord('grocery_items', groceryId);
    expect(recordB).not.toBeNull();
    expect(recordB?.data.name).toBe('Greek Yogurt');
    expect(recordB?.data.quantity).toBe(2);
  });

  it('Scenario 2: Concurrent conflict resolution where higher HLC deterministically wins on all devices', async () => {
    const choreId = 'cccc0000-bbbb-cccc-dddd-eeee33334444';

    // 1. Client A edits chore offline at t=1500
    const tsA = HybridLogicalClock.pack({ millis: 1500, counter: 0, nodeId: 'device_parent_iphone' });
    await clientA.store.applyRemoteUpsert('chores', choreId, { title: 'Clean Kitchen (Client A)' }, tsA);
    await clientA.outbox.enqueue({
      householdId,
      entityTable: 'chores',
      entityId: choreId,
      operation: 'UPDATE',
      recordPayload: { title: 'Clean Kitchen (Client A)' },
      hlcTimestamp: tsA,
    });

    // 2. Client B edits same chore offline at t=2500 (newer)
    const tsB = HybridLogicalClock.pack({ millis: 2500, counter: 0, nodeId: 'device_family_ipad' });
    await clientB.store.applyRemoteUpsert('chores', choreId, { title: 'Clean Kitchen & Oven (Client B Wins)' }, tsB);
    await clientB.outbox.enqueue({
      householdId,
      entityTable: 'chores',
      entityId: choreId,
      operation: 'UPDATE',
      recordPayload: { title: 'Clean Kitchen & Oven (Client B Wins)' },
      hlcTimestamp: tsB,
    });

    // 3. Client A syncs first
    await clientA.coordinator.push();

    // 4. Client B syncs second
    await clientB.coordinator.push();

    // 5. Client A pulls updates
    await clientA.coordinator.pull();

    // 6. Both clients must have converged on Client B's newer title
    const recordA = await clientA.store.getLocalRecord('chores', choreId);
    const recordB = await clientB.store.getLocalRecord('chores', choreId);

    expect(recordA?.data.title).toBe('Clean Kitchen & Oven (Client B Wins)');
    expect(recordB?.data.title).toBe('Clean Kitchen & Oven (Client B Wins)');
  });

  it('Scenario 3: Deterministic tie-breaking on nodeId when wall time and counter are identical', async () => {
    const choreId = 'dddd0000-bbbb-cccc-dddd-eeee55556666';

    // Same millis (2000) and same counter (0), but 'device_parent_iphone' > 'device_family_ipad'
    const tsA = HybridLogicalClock.pack({ millis: 2000, counter: 0, nodeId: 'device_parent_iphone' });
    const tsB = HybridLogicalClock.pack({ millis: 2000, counter: 0, nodeId: 'device_family_ipad' });

    // Client B syncs first with its change
    await clientB.outbox.enqueue({
      householdId,
      entityTable: 'chores',
      entityId: choreId,
      operation: 'INSERT',
      recordPayload: { title: 'Chore from iPad' },
      hlcTimestamp: tsB,
    });
    await clientB.coordinator.push();

    // Client A syncs second with its change (higher nodeId alphabetically)
    await clientA.outbox.enqueue({
      householdId,
      entityTable: 'chores',
      entityId: choreId,
      operation: 'UPDATE',
      recordPayload: { title: 'Chore from iPhone (TIE WINNER)' },
      hlcTimestamp: tsA,
    });
    await clientA.coordinator.push();

    // Client B pulls
    await clientB.coordinator.pull();

    const recordB = await clientB.store.getLocalRecord('chores', choreId);
    expect(recordB?.data.title).toBe('Chore from iPhone (TIE WINNER)');
  });

  it('Scenario 4: Caregiver Guest isolation strictly enforced across push and pull sync', async () => {
    const financeTxId = 'ffff0000-bbbb-cccc-dddd-eeee77778888';
    const choreId = 'eeee0000-bbbb-cccc-dddd-eeee99990000';

    // 1. Caregiver attempts to push financial mutation -> blocked with Forbidden
    const caregiverTs = HybridLogicalClock.pack(caregiverClient.hlc.send());
    await caregiverClient.outbox.enqueue({
      householdId,
      entityTable: 'finance_transactions',
      entityId: financeTxId,
      operation: 'INSERT',
      recordPayload: { amountCents: 50000 },
      hlcTimestamp: caregiverTs,
    });

    await expect(caregiverClient.coordinator.push()).rejects.toThrow();

    // 2. Admin pushes 1 chore AND 1 finance transaction
    const adminTs = HybridLogicalClock.pack(clientA.hlc.send());
    await clientA.outbox.enqueue({
      householdId,
      entityTable: 'chores',
      entityId: choreId,
      operation: 'INSERT',
      recordPayload: { title: 'Feed goldfish' },
      hlcTimestamp: adminTs,
    });
    await clientA.outbox.enqueue({
      householdId,
      entityTable: 'finance_transactions',
      entityId: financeTxId,
      operation: 'INSERT',
      recordPayload: { amountCents: 12000, description: 'Electricity bill' },
      hlcTimestamp: adminTs,
    });

    await clientA.coordinator.push();

    // 3. Caregiver pulls changes
    const caregiverPullRes = await caregiverClient.coordinator.pull();

    // Caregiver must only receive the chore, NEVER the financial transaction!
    expect(caregiverPullRes.pulledCount).toBe(1);
    const caregiverChore = await caregiverClient.store.getLocalRecord('chores', choreId);
    expect(caregiverChore).not.toBeNull();
    expect(caregiverChore?.data.title).toBe('Feed goldfish');

    const caregiverFinance = await caregiverClient.store.getLocalRecord('finance_transactions', financeTxId);
    expect(caregiverFinance).toBeNull();
  });
});
