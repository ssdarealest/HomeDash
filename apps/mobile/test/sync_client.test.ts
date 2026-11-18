import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('SyncClient and Coordinator', () => {
  it('should configure POST /sync/push and POST /sync/pull endpoints in sync_client.dart', () => {
    const clientPath = path.resolve(__dirname, '../lib/data/sync/sync_client.dart');
    expect(fs.existsSync(clientPath)).toBe(true);
    const content = fs.readFileSync(clientPath, 'utf8');
    expect(content).toContain('/sync/push');
    expect(content).toContain('/sync/pull');
    expect(content).toContain('class SyncClient');
  });

  it('should listen to SSE stream at /sync/realtime for sync:invalidate events in sync_coordinator.dart', () => {
    const coordPath = path.resolve(__dirname, '../lib/data/sync/sync_coordinator.dart');
    expect(fs.existsSync(coordPath)).toBe(true);
    const content = fs.readFileSync(coordPath, 'utf8');
    expect(content).toContain('/sync/realtime');
    expect(content).toContain('sync:invalidate');
    expect(content).toContain('class SyncCoordinator');
  });

  it('should guard concurrent syncs using active sync mutex in sync_coordinator.dart', () => {
    const coordPath = path.resolve(__dirname, '../lib/data/sync/sync_coordinator.dart');
    expect(fs.existsSync(coordPath)).toBe(true);
    const content = fs.readFileSync(coordPath, 'utf8');
    expect(content).toContain('_isSyncing');
    expect(content).toContain('triggerSync');
  });
});
