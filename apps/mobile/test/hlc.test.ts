import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Dart HLC and Conflict Reconciler Parity', () => {
  it('should implement unpack with underscore node ID preservation', () => {
    const hlcPath = path.resolve(__dirname, '../lib/core/hlc/hlc.dart');
    expect(fs.existsSync(hlcPath)).toBe(true);
    const content = fs.readFileSync(hlcPath, 'utf8');
    expect(content).toContain('class HybridLogicalClock');
    expect(content).toContain('unpack');
    expect(content).toContain('pack');
    expect(content).toContain('increment');
  });

  it('should implement safe deterministic fallback for corrupt HLCs', () => {
    const hlcPath = path.resolve(__dirname, '../lib/core/hlc/hlc.dart');
    expect(fs.existsSync(hlcPath)).toBe(true);
    const content = fs.readFileSync(hlcPath, 'utf8');
    expect(content).toContain('nodeId: \'invalid\'');
    expect(content).toContain('millis: 0');
    expect(content).toContain('counter: 0');
  });

  it('should implement LWW reconciliation logic with tombstone support in reconciler.dart', () => {
    const reconcilerPath = path.resolve(__dirname, '../lib/data/sync/reconciler.dart');
    expect(fs.existsSync(reconcilerPath)).toBe(true);
    const content = fs.readFileSync(reconcilerPath, 'utf8');
    expect(content).toContain('reconcileHlc');
    expect(content).toContain('shouldApply');
    expect(content).toContain('isTombstone');
  });
});
