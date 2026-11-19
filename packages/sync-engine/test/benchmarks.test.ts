import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '@homedash/shared';
import { P2PSyncCoordinator } from '../src';

describe('System Performance & Benchmarks (Phase 6 Task 5)', () => {
  it('reconciles 1,000 concurrent HLC mutations in under 100ms', () => {
    const peerCount = 10;
    const mutationsPerPeer = 100;
    const clocks = Array.from({ length: peerCount }, (_, i) => new HybridLogicalClock(`peer-${i}`));

    const startTime = performance.now();
    const timestamps: string[] = [];

    // Simulate 1,000 events across 10 distributed nodes
    for (let i = 0; i < mutationsPerPeer; i++) {
      for (let p = 0; p < peerCount; p++) {
        const ts = clocks[p].send();
        timestamps.push(HybridLogicalClock.pack(ts));
      }
    }

    // Sort/reconcile timestamps
    const unpacked = timestamps.map((raw) => HybridLogicalClock.unpack(raw));
    unpacked.sort((a, b) => HybridLogicalClock.compare(a, b));

    const durationMs = performance.now() - startTime;

    expect(unpacked.length).toBe(1000);
    expect(durationMs).toBeLessThan(100); // Strict performance budget

    // Assert strictly non-decreasing HLC ordering
    for (let i = 1; i < unpacked.length; i++) {
      const cmp = HybridLogicalClock.compare(unpacked[i - 1], unpacked[i]);
      expect(cmp).toBeLessThanOrEqual(0);
    }
  });

  it('executes P2P delta exchange of 500 records in under 50ms', async () => {
    const householdId = '11111111-1111-4111-a111-111111111111';
    const householdKey = 'benchmark_secret_key';
    const coord1 = new P2PSyncCoordinator({
      householdId,
      peerId: '22222222-2222-4222-a222-222222222222',
      householdKey,
    });
    const coord2 = new P2PSyncCoordinator({
      householdId,
      peerId: '33333333-3333-4333-a333-333333333333',
      householdKey,
    });

    // Populate 500 items in coord1
    for (let i = 0; i < 500; i++) {
      coord1.recordLocalMutation({
        entityTable: 'grocery_items',
        entityId: `item-${i}`,
        operation: 'INSERT',
        recordPayload: { index: i, title: `P2P Grocery ${i}` },
      });
    }

    const startSync = performance.now();

    const payload = await coord1.createSyncPayload('1970-01-01T00:00:00.000Z-0000-peer1');
    expect(payload.mutations.length).toBe(500);

    const ack = await coord2.receiveSyncPayload(payload);
    expect(ack.status).toBe('ok');
    expect(ack.appliedCount).toBe(500);

    const syncDuration = performance.now() - startSync;
    expect(syncDuration).toBeLessThan(50); // Under 50ms budget for 500 items
  });
});
