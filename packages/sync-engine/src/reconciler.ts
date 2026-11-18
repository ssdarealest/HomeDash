import { HybridLogicalClock, type HLCTimestamp } from '@homedash/shared';
import type { SyncChangeRecord } from '@homedash/protocol';

export interface LocalRecord {
  data: Record<string, any>;
  hlcTimestamp: string;
  isDeleted: boolean;
}

export interface LocalEntityStore {
  getLocalRecord(table: string, id: string): Promise<LocalRecord | null>;
  applyRemoteUpsert(table: string, id: string, data: Record<string, any>, hlcTimestamp: string): Promise<void>;
  applyRemoteDelete(table: string, id: string, hlcTimestamp: string): Promise<void>;
}

export class InMemoryLocalEntityStore implements LocalEntityStore {
  private tables = new Map<string, Map<string, LocalRecord>>();

  private getTable(table: string): Map<string, LocalRecord> {
    let map = this.tables.get(table);
    if (!map) {
      map = new Map();
      this.tables.set(table, map);
    }
    return map;
  }

  async getLocalRecord(table: string, id: string): Promise<LocalRecord | null> {
    const record = this.getTable(table).get(id);
    return record ? { ...record, data: { ...record.data } } : null;
  }

  async applyRemoteUpsert(table: string, id: string, data: Record<string, any>, hlcTimestamp: string): Promise<void> {
    this.getTable(table).set(id, {
      data: { ...data },
      hlcTimestamp,
      isDeleted: false,
    });
  }

  async applyRemoteDelete(table: string, id: string, hlcTimestamp: string): Promise<void> {
    const existing = this.getTable(table).get(id);
    this.getTable(table).set(id, {
      data: existing ? { ...existing.data } : {},
      hlcTimestamp,
      isDeleted: true,
    });
  }

  clear(): void {
    this.tables.clear();
  }
}

export class ConflictReconciler {
  constructor(private store: LocalEntityStore) {}

  public parseHlc(raw: string): HLCTimestamp {
    try {
      if (raw.includes('_')) {
        return HybridLogicalClock.unpack(raw);
      }
      // Support alternate ISO:counter:nodeId colon separator
      const parts = raw.split(':');
      if (parts.length >= 3) {
        const iso = parts.slice(0, -2).join(':');
        const counterHex = parts[parts.length - 2];
        const nodeId = parts[parts.length - 1];
        const millis = new Date(iso).getTime();
        const counter = parseInt(counterHex, 16) || 0;
        return { millis, counter, nodeId };
      }
    } catch {
      // Fallback
    }
    return { millis: Date.parse(raw) || 0, counter: 0, nodeId: 'unknown' };
  }

  public compareHlc(aRaw: string, bRaw: string): number {
    const a = this.parseHlc(aRaw);
    const b = this.parseHlc(bRaw);
    return HybridLogicalClock.compare(a, b);
  }

  async reconcileChange(change: SyncChangeRecord): Promise<{ action: 'applied_remote' | 'retained_local'; entityId: string }> {
    const local = await this.store.getLocalRecord(change.entityTable, change.entityId);

    if (!local) {
      if (change.operation === 'DELETE') {
        await this.store.applyRemoteDelete(change.entityTable, change.entityId, change.hlcTimestamp);
      } else {
        await this.store.applyRemoteUpsert(change.entityTable, change.entityId, change.recordPayload ?? {}, change.hlcTimestamp);
      }
      return { action: 'applied_remote', entityId: change.entityId };
    }

    const comparison = this.compareHlc(change.hlcTimestamp, local.hlcTimestamp);

    if (comparison > 0) {
      // Remote mutation is newer
      if (change.operation === 'DELETE') {
        await this.store.applyRemoteDelete(change.entityTable, change.entityId, change.hlcTimestamp);
      } else {
        await this.store.applyRemoteUpsert(change.entityTable, change.entityId, change.recordPayload ?? {}, change.hlcTimestamp);
      }
      return { action: 'applied_remote', entityId: change.entityId };
    }

    // Local mutation is newer or identical with tie-breaker favoring local
    return { action: 'retained_local', entityId: change.entityId };
  }

  async reconcileBatch(changes: SyncChangeRecord[]): Promise<{ appliedCount: number; retainedLocalCount: number }> {
    let appliedCount = 0;
    let retainedLocalCount = 0;

    for (const change of changes) {
      const res = await this.reconcileChange(change);
      if (res.action === 'applied_remote') {
        appliedCount++;
      } else {
        retainedLocalCount++;
      }
    }

    return { appliedCount, retainedLocalCount };
  }
}
