import { HybridLogicalClock } from '@homedash/shared';
import type {
  SyncPushRequest,
  SyncPushResponse,
  SyncPullRequest,
  SyncPullResponse,
  SyncChangeRecord,
} from '@homedash/protocol';
import type { SyncPubSub } from './pubsub';

export const ALLOWED_SYNC_TABLES = new Set([
  'grocery_items',
  'meal_plans',
  'chores',
  'home_wiki_cards',
  'health_medications',
  'health_medication_logs',
  'health_allergies',
  'health_growth_records',
  'finance_accounts',
  'finance_transactions',
  'utility_bills',
  'vault_items',
  'asset_renewals',
]);

export const SENSITIVE_CAREGIVER_TABLES = new Set([
  'finance_accounts',
  'finance_transactions',
  'utility_bills',
  'vault_items',
]);

export interface RecordChangeInput {
  householdId: string;
  entityTable: string;
  entityId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordPayload: Record<string, any> | null;
  hlcTimestamp: string;
}

export interface SyncJournalStore {
  recordChange(input: RecordChangeInput): Promise<SyncChangeRecord>;
  getChanges(householdId: string, cursor: number, limit: number): Promise<{ changes: SyncChangeRecord[]; hasMore: boolean }>;
  getHighwaterMark(householdId: string): Promise<number>;
}

export class InMemorySyncJournalStore implements SyncJournalStore {
  private records: SyncChangeRecord[] = [];
  private currentId = 0;

  async recordChange(input: RecordChangeInput): Promise<SyncChangeRecord> {
    this.currentId += 1;
    const record: SyncChangeRecord = {
      id: this.currentId,
      entityTable: input.entityTable,
      entityId: input.entityId,
      operation: input.operation,
      recordPayload: input.recordPayload,
      hlcTimestamp: input.hlcTimestamp,
      createdAt: new Date().toISOString(),
    };
    this.records.push(record);
    return { ...record };
  }

  async getChanges(householdId: string, cursor: number, limit: number): Promise<{ changes: SyncChangeRecord[]; hasMore: boolean }> {
    const matching = this.records.filter((r) => r.id > cursor);
    const slice = matching.slice(0, limit);
    return {
      changes: slice.map((r) => ({ ...r })),
      hasMore: matching.length > limit,
    };
  }

  async getHighwaterMark(householdId: string): Promise<number> {
    return this.currentId;
  }

  clear(): void {
    this.records = [];
    this.currentId = 0;
  }
}

export function parseHlcString(raw: string) {
  const match = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)[_:]([0-9a-fA-F]+)[_:](.+)$/);
  if (match) {
    const millis = new Date(match[1]).getTime();
    const counter = parseInt(match[2], 16) || 0;
    const nodeId = match[3];
    if (!Number.isNaN(millis)) {
      return { millis, counter, nodeId };
    }
  }
  return { millis: Date.now(), counter: 0, nodeId: 'client' };
}

export interface SyncServiceOptions {
  journalStore: SyncJournalStore;
  pubsub?: SyncPubSub;
  serverNodeId?: string;
}

export class SyncService {
  private journalStore: SyncJournalStore;
  private pubsub?: SyncPubSub;
  private serverClock: HybridLogicalClock;

  constructor(options: SyncServiceOptions) {
    this.journalStore = options.journalStore;
    this.pubsub = options.pubsub;
    this.serverClock = new HybridLogicalClock(options.serverNodeId ?? 'server-core', Date.now(), 0);
  }

  async processPush(
    householdId: string,
    userId: string,
    userRole: string,
    request: SyncPushRequest
  ): Promise<SyncPushResponse> {
    if (request.householdId !== householdId) {
      throw new Error('Forbidden: householdId mismatch');
    }

    // Validate table permissions & whitelist
    for (const mutation of request.mutations) {
      if (!ALLOWED_SYNC_TABLES.has(mutation.entityTable)) {
        throw new Error(`Table not eligible for synchronization: ${mutation.entityTable}`);
      }

      if (userRole === 'caregiver_guest' && SENSITIVE_CAREGIVER_TABLES.has(mutation.entityTable)) {
        throw new Error('Forbidden: Caregivers cannot modify sensitive financial or vault records');
      }
    }

    let latestHlc = this.serverClock.getTimestamp();

    for (const mutation of request.mutations) {
      const clientHlc = parseHlcString(mutation.hlcTimestamp);
      latestHlc = this.serverClock.recv(clientHlc);

      await this.journalStore.recordChange({
        householdId,
        entityTable: mutation.entityTable,
        entityId: mutation.entityId,
        operation: mutation.operation,
        recordPayload: mutation.recordPayload ?? null,
        hlcTimestamp: mutation.hlcTimestamp,
      });
    }

    const highwaterMark = await this.journalStore.getHighwaterMark(householdId);
    const serverHlcStr = HybridLogicalClock.pack(latestHlc);

    // Broadcast invalidation event
    if (this.pubsub) {
      await this.pubsub.publishInvalidation(householdId, highwaterMark, request.clientId);
    }

    return {
      appliedCount: request.mutations.length,
      newHighwaterMark: highwaterMark,
      serverTimestamp: new Date().toISOString(),
      serverHlc: serverHlcStr,
    };
  }

  async processPull(
    householdId: string,
    userRole: string,
    request: SyncPullRequest
  ): Promise<SyncPullResponse> {
    if (request.householdId !== householdId) {
      throw new Error('Forbidden: householdId mismatch');
    }

    const { changes, hasMore } = await this.journalStore.getChanges(
      householdId,
      request.cursor,
      request.limit
    );

    // Filter out sensitive records if caregiver_guest
    let filteredChanges = changes;
    if (userRole === 'caregiver_guest') {
      filteredChanges = changes.filter((c) => !SENSITIVE_CAREGIVER_TABLES.has(c.entityTable));
    }

    const newCursor = changes.length > 0 ? Math.max(...changes.map((c) => c.id)) : request.cursor;
    const serverHlcStr = HybridLogicalClock.pack(this.serverClock.getTimestamp());

    return {
      changes: filteredChanges,
      newCursor,
      hasMore,
      serverHlc: serverHlcStr,
    };
  }
}
