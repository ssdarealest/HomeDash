import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryOutboxStore } from '../src/outbox';
import type { OutboxStore } from '../src/types';

describe('Tier 3 Outbox Store', () => {
  let store: OutboxStore;

  beforeEach(() => {
    store = new InMemoryOutboxStore();
  });

  it('should enqueue mutations with pending status, default id and retryCount 0', async () => {
    const item = await store.enqueue({
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      entityTable: 'grocery_items',
      entityId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      operation: 'INSERT',
      recordPayload: { name: 'Almond Milk', completed: false },
      hlcTimestamp: '2026-11-18T10:00:00.000Z:0001:client1',
    });

    expect(item.id).toBeDefined();
    expect(item.status).toBe('pending');
    expect(item.retryCount).toBe(0);
    expect(item.createdAt).toBeDefined();

    const stats = await store.getStats();
    expect(stats.pending).toBe(1);
    expect(stats.inFlight).toBe(0);
  });

  it('should retrieve pending items in FIFO order with limit', async () => {
    for (let i = 1; i <= 5; i++) {
      await store.enqueue({
        householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        entityTable: 'chores',
        entityId: `b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a0${i}`,
        operation: 'INSERT',
        recordPayload: { title: `Chore ${i}` },
        hlcTimestamp: `2026-11-18T10:0${i}:00.000Z:0001:client1`,
      });
    }

    const pending = await store.getPending(3);
    expect(pending.length).toBe(3);
    expect(pending[0].entityId).toBe('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01');
    expect(pending[2].entityId).toBe('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03');
  });

  it('should transition status from pending to in_flight and then synced', async () => {
    const item = await store.enqueue({
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      entityTable: 'meal_plans',
      entityId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      operation: 'UPDATE',
      recordPayload: { mealName: 'Vegetable Soup' },
      hlcTimestamp: '2026-11-18T10:10:00.000Z:0001:client1',
    });

    await store.markInFlight([item.id]);
    let stats = await store.getStats();
    expect(stats.pending).toBe(0);
    expect(stats.inFlight).toBe(1);

    await store.markSynced([item.id]);
    stats = await store.getStats();
    expect(stats.inFlight).toBe(0);
    expect(stats.synced).toBe(1);

    // Synced items should not appear in getPending()
    const pending = await store.getPending();
    expect(pending.length).toBe(0);
  });

  it('should transition to failed on network error and increment retry count', async () => {
    const item = await store.enqueue({
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      entityTable: 'chores',
      entityId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      operation: 'DELETE',
      recordPayload: null,
      hlcTimestamp: '2026-11-18T10:15:00.000Z:0001:client1',
    });

    await store.markInFlight([item.id]);
    await store.markFailed([item.id], '503 Service Unavailable');

    const stats = await store.getStats();
    expect(stats.failed).toBe(1);
    expect(stats.inFlight).toBe(0);

    // Failed items should be retryable (returned in getPending)
    const pending = await store.getPending();
    expect(pending.length).toBe(1);
    expect(pending[0].retryCount).toBe(1);
    expect(pending[0].errorMessage).toBe('503 Service Unavailable');
  });

  it('should prune synced items older than cutoff threshold', async () => {
    const item1 = await store.enqueue({
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      entityTable: 'grocery_items',
      entityId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
      operation: 'INSERT',
      recordPayload: { name: 'Apples' },
      hlcTimestamp: '2026-11-18T10:20:00.000Z:0001:client1',
    });

    await store.markSynced([item1.id]);
    let stats = await store.getStats();
    expect(stats.synced).toBe(1);

    // Prune items older than 0ms (all currently synced)
    const pruned = await store.pruneSynced(0);
    expect(pruned).toBe(1);

    stats = await store.getStats();
    expect(stats.synced).toBe(0);
  });
});
