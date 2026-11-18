import type { SyncOperation, SyncMutation } from '@homedash/protocol';

export type OutboxStatus = 'pending' | 'in_flight' | 'synced' | 'failed';

export interface OutboxItem {
  id: string;
  householdId: string;
  entityTable: string;
  entityId: string;
  operation: SyncOperation;
  recordPayload: Record<string, any> | null;
  hlcTimestamp: string;
  status: OutboxStatus;
  retryCount: number;
  createdAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
}

export type OutboxEnqueueInput = Omit<
  OutboxItem,
  'id' | 'status' | 'retryCount' | 'createdAt' | 'lastAttemptAt' | 'errorMessage'
> & {
  id?: string;
};

export interface OutboxStore {
  enqueue(input: OutboxEnqueueInput): Promise<OutboxItem>;
  getPending(limit?: number): Promise<OutboxItem[]>;
  markInFlight(ids: string[]): Promise<void>;
  markSynced(ids: string[]): Promise<void>;
  markFailed(ids: string[], errorMessage?: string): Promise<void>;
  pruneSynced(olderThanMs?: number): Promise<number>;
  getStats(): Promise<{ pending: number; inFlight: number; failed: number; synced: number }>;
  clear(): Promise<void>;
}

export interface SyncState {
  householdId: string;
  clientId: string;
  lastSyncAt?: string;
  lastSyncedCursor: number;
  lastSyncedHlc?: string;
  status: 'idle' | 'pushing' | 'pulling' | 'error';
  errorMessage?: string;
}

export interface ReconcileResult {
  appliedCount: number;
  retainedLocalCount: number;
  conflictsResolved: number;
}
