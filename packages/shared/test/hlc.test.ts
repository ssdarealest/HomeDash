import { describe, it, expect } from 'vitest';
import { HybridLogicalClock } from '../src/hlc';

describe('Hybrid Logical Clock (HLC)', () => {
  it('should initialize with current time and counter 0', () => {
    const hlc = new HybridLogicalClock('node-a');
    const timestamp = hlc.send();
    expect(timestamp.nodeId).toBe('node-a');
    expect(timestamp.counter).toBe(0);
    expect(timestamp.millis).toBeGreaterThan(0);
  });

  it('should ensure monotonicity even if physical clock does not advance', () => {
    const hlc = new HybridLogicalClock('node-a');
    const t1 = hlc.send();
    const t2 = hlc.send();

    expect(HybridLogicalClock.compare(t1, t2)).toBeLessThan(0);
    if (t1.millis === t2.millis) {
      expect(t2.counter).toBe(t1.counter + 1);
    }
  });

  it('should pack and unpack cleanly into canonical sortable string', () => {
    const hlc = new HybridLogicalClock('node-1');
    const t1 = hlc.send();
    const packed = HybridLogicalClock.pack(t1);
    const unpacked = HybridLogicalClock.unpack(packed);

    expect(unpacked.millis).toBe(t1.millis);
    expect(unpacked.counter).toBe(t1.counter);
    expect(unpacked.nodeId).toBe(t1.nodeId);
  });

  it('should advance local clock when receiving remote timestamp in the future', () => {
    const clockA = new HybridLogicalClock('node-a');

    // Simulate clockB being ahead
    const futureRemote = {
      millis: Date.now() + 50000,
      counter: 5,
      nodeId: 'node-b',
    };

    const merged = clockA.recv(futureRemote);
    expect(merged.millis).toBe(futureRemote.millis);
    expect(merged.counter).toBe(6);
    expect(merged.nodeId).toBe('node-a');
  });

  it('should handle physical clock jumping backwards without losing monotonicity', () => {
    const futureTime = Date.now() + 100000;
    const hlc = new HybridLogicalClock('node-drift');
    // Simulate HLC having advanced into the future (e.g. from a remote sync event)
    hlc.recv({ millis: futureTime, counter: 10, nodeId: 'node-future' });

    // Now physical clock is behind hlc.millis
    const tNext = hlc.send();
    expect(tNext.millis).toBe(futureTime);
    expect(tNext.counter).toBe(12);
    expect(tNext.nodeId).toBe('node-drift');
  });
});
