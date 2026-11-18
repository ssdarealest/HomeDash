import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HybridLogicalClock } from '@homedash/shared';
import { InMemoryOutboxStore } from '../src/outbox';
import { ConflictReconciler, InMemoryLocalEntityStore } from '../src/reconciler';
import { SyncCoordinator, type SyncTransport } from '../src/coordinator';
import type {
  SyncPushRequest,
  SyncPushResponse,
  SyncPullRequest,
  SyncPullResponse,
} from '@homedash/protocol';

describe('Tier 3 Sync Coordinator', () => {
  let outbox: InMemoryOutboxStore;
  let localStore: InMemoryLocalEntityStore;
  let reconciler: ConflictReconciler;
  let hlc: HybridLogicalClock;
  let mockTransport: SyncTransport;
  let coordinator: SyncCoordinator;

  const householdId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const clientId = 'client_device_1';

  beforeEach(() => {
    outbox = new InMemoryOutboxStore();
    localStore = new InMemoryLocalEntityStore();
    reconciler = new ConflictReconciler(localStore);
    hlc = new HybridLogicalClock(clientId, 1000, 0);

    mockTransport = {
      push: vi.fn(async (req: SyncPushRequest): Promise<SyncPushResponse> => {
        return {
          appliedCount: req.mutations.length,
          newHighwaterMark: 10,
          serverTimestamp: new Date().toISOString(),
          serverHlc: HybridLogicalClock.pack({ millis: 2000, counter: 0, nodeId: 'server' }),
        };
      }),
      pull: vi.fn(async (req: SyncPullRequest): Promise<SyncPullResponse> => {
        return {
          changes: [
            {
              id: 1,
              entityTable: 'grocery_items',
              entityId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
              operation: 'INSERT',
              recordPayload: { name: 'Fresh Basil' },
              hlcTimestamp: HybridLogicalClock.pack({ millis: 1500, counter: 0, nodeId: 'remote_client' }),
              createdAt: new Date().toISOString(),
            },
          ],
          newCursor: 1,
          hasMore: false,
          serverHlc: HybridLogicalClock.pack({ millis: 2000, counter: 0, nodeId: 'server' }),
        };
      }),
    };

    coordinator = new SyncCoordinator({
      householdId,
      clientId,
      outbox,
      reconciler,
      transport: mockTransport,
      hlc,
    });
  });

  it('should push pending outbox mutations and mark them synced', async () => {
    await outbox.enqueue({
      householdId,
      entityTable: 'chores',
      entityId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      operation: 'INSERT',
      recordPayload: { title: 'Mow Lawn' },
      hlcTimestamp: HybridLogicalClock.pack(hlc.send()),
    });

    const pushResult = await coordinator.push();
    expect(pushResult.pushedCount).toBe(1);
    expect(mockTransport.push).toHaveBeenCalledTimes(1);

    const stats = await outbox.getStats();
    expect(stats.pending).toBe(0);
    expect(stats.synced).toBe(1);

    // Local HLC should have advanced to incorporate serverHlc (t=2000)
    expect(hlc.getTimestamp().millis).toBeGreaterThanOrEqual(2000);
  });

  it('should pull delta changes and reconcile them into local store', async () => {
    const pullResult = await coordinator.pull();
    expect(pullResult.pulledCount).toBe(1);
    expect(pullResult.newCursor).toBe(1);

    const localRecord = await localStore.getLocalRecord('grocery_items', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');
    expect(localRecord).not.toBeNull();
    expect(localRecord?.data.name).toBe('Fresh Basil');

    expect(coordinator.getState().lastSyncedCursor).toBe(1);
  });

  it('should execute full sync cycle (push then pull) and emit lifecycle events', async () => {
    const startSpy = vi.fn();
    const completeSpy = vi.fn();
    coordinator.on('sync:start', startSpy);
    coordinator.on('sync:complete', completeSpy);

    await outbox.enqueue({
      householdId,
      entityTable: 'meal_plans',
      entityId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      operation: 'UPDATE',
      recordPayload: { day: 'Monday', meal: 'Pasta' },
      hlcTimestamp: HybridLogicalClock.pack(hlc.send()),
    });

    const syncResult = await coordinator.sync();
    expect(syncResult.pushed).toBe(1);
    expect(syncResult.pulled).toBe(1);
    expect(syncResult.newCursor).toBe(1);

    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(completeSpy).toHaveBeenCalledTimes(1);
    expect(coordinator.getState().status).toBe('idle');
  });

  it('should handle push transport failure gracefully by marking outbox items failed', async () => {
    const errorSpy = vi.fn();
    coordinator.on('sync:error', errorSpy);

    mockTransport.push = vi.fn(async () => {
      throw new Error('500 Internal Server Error');
    });

    await outbox.enqueue({
      householdId,
      entityTable: 'chores',
      entityId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
      operation: 'INSERT',
      recordPayload: { title: 'Clean gutters' },
      hlcTimestamp: HybridLogicalClock.pack(hlc.send()),
    });

    await expect(coordinator.push()).rejects.toThrow('500 Internal Server Error');

    const stats = await outbox.getStats();
    expect(stats.failed).toBe(1);
    expect(errorSpy).toHaveBeenCalled();
    expect(coordinator.getState().status).toBe('error');
  });
});
