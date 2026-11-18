import type { HybridLogicalClock } from '@homedash/shared';
import type {
  SyncPushRequest,
  SyncPushResponse,
  SyncPullRequest,
  SyncPullResponse,
  SyncMutation,
} from '@homedash/protocol';
import type { OutboxStore, SyncState } from './types';
import type { ConflictReconciler } from './reconciler';

export interface SyncTransport {
  push(request: SyncPushRequest): Promise<SyncPushResponse>;
  pull(request: SyncPullRequest): Promise<SyncPullResponse>;
}

export interface SyncCoordinatorOptions {
  householdId: string;
  clientId: string;
  outbox: OutboxStore;
  reconciler: ConflictReconciler;
  transport: SyncTransport;
  hlc: HybridLogicalClock;
  initialCursor?: number;
}

export type SyncEventType = 'sync:start' | 'sync:complete' | 'sync:error';

export class SyncCoordinator {
  private householdId: string;
  private clientId: string;
  private outbox: OutboxStore;
  private reconciler: ConflictReconciler;
  private transport: SyncTransport;
  private hlc: HybridLogicalClock;
  private state: SyncState;
  private listeners = new Map<SyncEventType, Set<(data: any) => void>>();
  private activeSync?: Promise<{ pushed: number; pulled: number; newCursor: number }>;

  constructor(options: SyncCoordinatorOptions) {
    this.householdId = options.householdId;
    this.clientId = options.clientId;
    this.outbox = options.outbox;
    this.reconciler = options.reconciler;
    this.transport = options.transport;
    this.hlc = options.hlc;

    this.state = {
      householdId: options.householdId,
      clientId: options.clientId,
      lastSyncedCursor: options.initialCursor ?? 0,
      status: 'idle',
    };
  }

  public on(event: SyncEventType, listener: (data: any) => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => set?.delete(listener);
  }

  private emit(event: SyncEventType, data: any): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const listener of set) {
        try {
          listener(data);
        } catch {
          // Ignore listener error
        }
      }
    }
  }

  public getState(): SyncState {
    return { ...this.state };
  }

  async push(batchSize = 100): Promise<{ pushedCount: number; serverHlc?: string }> {
    this.state.status = 'pushing';
    const pending = await this.outbox.getPending(batchSize);
    if (pending.length === 0) {
      this.state.status = 'idle';
      return { pushedCount: 0 };
    }

    const ids = pending.map((p) => p.id);
    await this.outbox.markInFlight(ids);

    const mutations: SyncMutation[] = pending.map((p) => ({
      id: p.id,
      entityTable: p.entityTable,
      entityId: p.entityId,
      operation: p.operation,
      recordPayload: p.recordPayload,
      hlcTimestamp: p.hlcTimestamp,
    }));

    try {
      const response = await this.transport.push({
        householdId: this.householdId,
        clientId: this.clientId,
        mutations,
      });

      if (response.serverHlc) {
        this.hlc.recv(this.reconciler.parseHlc(response.serverHlc));
      }

      await this.outbox.markSynced(ids);
      this.state.status = 'idle';
      this.state.errorMessage = undefined;

      return {
        pushedCount: response.appliedCount,
        serverHlc: response.serverHlc,
      };
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      await this.outbox.markFailed(ids, errorMsg);
      this.state.status = 'error';
      this.state.errorMessage = errorMsg;
      this.emit('sync:error', { phase: 'push', error: errorMsg });
      throw err;
    }
  }

  async pull(limit = 100): Promise<{ pulledCount: number; newCursor: number; hasMore: boolean }> {
    this.state.status = 'pulling';
    try {
      const response = await this.transport.pull({
        householdId: this.householdId,
        cursor: this.state.lastSyncedCursor,
        limit,
      });

      if (response.changes.length > 0) {
        await this.reconciler.reconcileBatch(response.changes);
      }

      this.state.lastSyncedCursor = response.newCursor;
      this.state.lastSyncedHlc = response.serverHlc;
      this.state.lastSyncAt = new Date().toISOString();
      this.state.status = 'idle';
      this.state.errorMessage = undefined;

      if (response.serverHlc) {
        this.hlc.recv(this.reconciler.parseHlc(response.serverHlc));
      }

      return {
        pulledCount: response.changes.length,
        newCursor: response.newCursor,
        hasMore: response.hasMore,
      };
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      this.state.status = 'error';
      this.state.errorMessage = errorMsg;
      this.emit('sync:error', { phase: 'pull', error: errorMsg });
      throw err;
    }
  }

  async sync(): Promise<{ pushed: number; pulled: number; newCursor: number }> {
    if (this.activeSync) {
      return this.activeSync;
    }

    this.activeSync = this.executeSyncCycle().finally(() => {
      this.activeSync = undefined;
    });

    return this.activeSync;
  }

  private async executeSyncCycle(): Promise<{ pushed: number; pulled: number; newCursor: number }> {
    this.emit('sync:start', { timestamp: new Date().toISOString() });
    try {
      const pushRes = await this.push();
      const pullRes = await this.pull();

      const result = {
        pushed: pushRes.pushedCount,
        pulled: pullRes.pulledCount,
        newCursor: pullRes.newCursor,
      };

      this.emit('sync:complete', result);
      return result;
    } catch (err) {
      // Error already emitted by push or pull
      throw err;
    } finally {
      if (this.state.status !== 'error') {
        this.state.status = 'idle';
      }
    }
  }
}
