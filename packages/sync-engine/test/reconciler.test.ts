import { describe, it, expect, beforeEach } from 'vitest';
import { HybridLogicalClock } from '@homedash/shared';
import { ConflictReconciler, InMemoryLocalEntityStore } from '../src/reconciler';
import type { SyncChangeRecord } from '@homedash/protocol';

describe('Tier 3 Deterministic Conflict Reconciler', () => {
  let store: InMemoryLocalEntityStore;
  let reconciler: ConflictReconciler;

  beforeEach(() => {
    store = new InMemoryLocalEntityStore();
    reconciler = new ConflictReconciler(store);
  });

  const makeHlc = (millis: number, counter: number, nodeId: string) => {
    return HybridLogicalClock.pack({ millis, counter, nodeId });
  };

  it('should insert fresh remote record when local record does not exist', async () => {
    const remoteChange: SyncChangeRecord = {
      id: 1,
      entityTable: 'grocery_items',
      entityId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      operation: 'INSERT',
      recordPayload: { name: 'Sourdough Bread', completed: false },
      hlcTimestamp: makeHlc(1000, 0, 'remote_client'),
      createdAt: new Date().toISOString(),
    };

    const res = await reconciler.reconcileChange(remoteChange);
    expect(res.action).toBe('applied_remote');

    const local = await store.getLocalRecord('grocery_items', remoteChange.entityId);
    expect(local).not.toBeNull();
    expect(local?.data.name).toBe('Sourdough Bread');
    expect(local?.isDeleted).toBe(false);
  });

  it('should apply remote update when remote HLC is newer than local HLC', async () => {
    const entityId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    // Local record at t=1000
    await store.applyRemoteUpsert('chores', entityId, { title: 'Do Laundry', done: false }, makeHlc(1000, 0, 'local_client'));

    // Incoming remote update at t=2000
    const remoteChange: SyncChangeRecord = {
      id: 2,
      entityTable: 'chores',
      entityId,
      operation: 'UPDATE',
      recordPayload: { title: 'Do Laundry and Fold', done: true },
      hlcTimestamp: makeHlc(2000, 0, 'remote_client'),
      createdAt: new Date().toISOString(),
    };

    const res = await reconciler.reconcileChange(remoteChange);
    expect(res.action).toBe('applied_remote');

    const local = await store.getLocalRecord('chores', entityId);
    expect(local?.data.title).toBe('Do Laundry and Fold');
    expect(local?.data.done).toBe(true);
    expect(local?.hlcTimestamp).toBe(remoteChange.hlcTimestamp);
  });

  it('should retain local record when local HLC is newer than incoming remote HLC', async () => {
    const entityId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
    // Local record at t=3000
    await store.applyRemoteUpsert('chores', entityId, { title: 'Local Edit', done: true }, makeHlc(3000, 0, 'local_client'));

    // Stale remote update at t=2000
    const remoteChange: SyncChangeRecord = {
      id: 3,
      entityTable: 'chores',
      entityId,
      operation: 'UPDATE',
      recordPayload: { title: 'Stale Remote Edit', done: false },
      hlcTimestamp: makeHlc(2000, 0, 'remote_client'),
      createdAt: new Date().toISOString(),
    };

    const res = await reconciler.reconcileChange(remoteChange);
    expect(res.action).toBe('retained_local');

    const local = await store.getLocalRecord('chores', entityId);
    expect(local?.data.title).toBe('Local Edit');
    expect(local?.data.done).toBe(true);
  });

  it('should break ties deterministically on nodeId when millis and counter match', async () => {
    const entityId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
    // Local at t=2000 counter=1 with nodeId 'client_a'
    await store.applyRemoteUpsert('grocery_items', entityId, { name: 'Local A' }, makeHlc(2000, 1, 'client_a'));

    // Remote at t=2000 counter=1 with nodeId 'client_z' ('client_z' > 'client_a')
    const remoteWinner: SyncChangeRecord = {
      id: 4,
      entityTable: 'grocery_items',
      entityId,
      operation: 'UPDATE',
      recordPayload: { name: 'Remote Z Wins' },
      hlcTimestamp: makeHlc(2000, 1, 'client_z'),
      createdAt: new Date().toISOString(),
    };

    const resWinner = await reconciler.reconcileChange(remoteWinner);
    expect(resWinner.action).toBe('applied_remote');

    let local = await store.getLocalRecord('grocery_items', entityId);
    expect(local?.data.name).toBe('Remote Z Wins');

    // Remote loser at t=2000 counter=1 with nodeId 'client_0' ('client_0' < 'client_z')
    const remoteLoser: SyncChangeRecord = {
      id: 5,
      entityTable: 'grocery_items',
      entityId,
      operation: 'UPDATE',
      recordPayload: { name: 'Remote 0 Loses' },
      hlcTimestamp: makeHlc(2000, 1, 'client_0'),
      createdAt: new Date().toISOString(),
    };

    const resLoser = await reconciler.reconcileChange(remoteLoser);
    expect(resLoser.action).toBe('retained_local');

    local = await store.getLocalRecord('grocery_items', entityId);
    expect(local?.data.name).toBe('Remote Z Wins');
  });

  it('should reconcile soft delete tombstones accurately', async () => {
    const entityId = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
    // Active local item at t=1000
    await store.applyRemoteUpsert('grocery_items', entityId, { name: 'Carrots' }, makeHlc(1000, 0, 'client_a'));

    // Inbound DELETE at t=1500
    const remoteDelete: SyncChangeRecord = {
      id: 6,
      entityTable: 'grocery_items',
      entityId,
      operation: 'DELETE',
      recordPayload: null,
      hlcTimestamp: makeHlc(1500, 0, 'client_b'),
      createdAt: new Date().toISOString(),
    };

    const res = await reconciler.reconcileChange(remoteDelete);
    expect(res.action).toBe('applied_remote');

    const local = await store.getLocalRecord('grocery_items', entityId);
    expect(local?.isDeleted).toBe(true);

    // Newer local resurrect/update at t=2000 over tombstone
    await store.applyRemoteUpsert('grocery_items', entityId, { name: 'Organic Carrots' }, makeHlc(2000, 0, 'client_a'));
    const resurrected = await store.getLocalRecord('grocery_items', entityId);
    expect(resurrected?.isDeleted).toBe(false);
    expect(resurrected?.data.name).toBe('Organic Carrots');
  });
});
