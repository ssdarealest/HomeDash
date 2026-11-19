import { HybridLogicalClock, type HLCTimestamp } from '@homedash/shared';
import type {
  PeerSyncPayload,
  PeerSyncAck,
  PeerMutation,
} from '@homedash/protocol';

export interface P2PSyncCoordinatorOptions {
  householdId: string;
  peerId: string;
  householdKey: string;
  initialHlc?: string;
}

export interface LocalMutationInput {
  entityTable: string;
  entityId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordPayload?: Record<string, any>;
}

export interface StoredRecord {
  entityTable: string;
  entityId: string;
  operation: string;
  recordPayload?: Record<string, any>;
  hlcTimestamp: string;
  updatedAt: string;
}

export interface RemoteSyncTransport {
  sendPayload: (payload: PeerSyncPayload) => Promise<PeerSyncAck>;
  requestPayload: (sinceHlc: string) => Promise<PeerSyncPayload>;
}

export class P2PSyncCoordinator {
  public readonly householdId: string;
  public readonly peerId: string;
  public readonly householdKey: string;
  private hlc: HybridLogicalClock;
  private localRecords: Map<string, StoredRecord> = new Map();
  private mutationLog: PeerMutation[] = [];

  constructor(opts: P2PSyncCoordinatorOptions) {
    this.householdId = opts.householdId;
    this.peerId = opts.peerId;
    this.householdKey = opts.householdKey;

    let initialMillis = Date.now();
    let initialCounter = 0;
    if (opts.initialHlc) {
      try {
        const unpacked = this.parseHlc(opts.initialHlc);
        initialMillis = unpacked.millis;
        initialCounter = unpacked.counter;
      } catch {
        // Fallback to current time
      }
    }
    this.hlc = new HybridLogicalClock(opts.peerId, initialMillis, initialCounter);
  }

  public getCurrentHlcString(): string {
    return HybridLogicalClock.pack(this.hlc.getTimestamp());
  }

  private parseHlc(raw: string): HLCTimestamp {
    try {
      return HybridLogicalClock.unpack(raw);
    } catch {
      // Fallback parser for dash-delimited HLC
      const parts = raw.split('-');
      if (parts.length >= 3) {
        const iso = parts.slice(0, 3).join('-');
        const millis = new Date(iso).getTime();
        const counter = parseInt(parts[3] || '0', 10);
        const nodeId = parts.slice(4).join('-') || this.peerId;
        return { millis: isNaN(millis) ? Date.now() : millis, counter: isNaN(counter) ? 0 : counter, nodeId };
      }
      return { millis: Date.now(), counter: 0, nodeId: this.peerId };
    }
  }

  private compareHlcStrings(a: string, b: string): number {
    const tsA = this.parseHlc(a);
    const tsB = this.parseHlc(b);
    return HybridLogicalClock.compare(tsA, tsB);
  }

  recordLocalMutation(input: LocalMutationInput): StoredRecord {
    const hlcTs = this.hlc.send();
    const hlcString = HybridLogicalClock.pack(hlcTs);
    const now = new Date().toISOString();

    const record: StoredRecord = {
      entityTable: input.entityTable,
      entityId: input.entityId,
      operation: input.operation,
      recordPayload: input.recordPayload,
      hlcTimestamp: hlcString,
      updatedAt: now,
    };

    const key = `${input.entityTable}:${input.entityId}`;
    this.localRecords.set(key, record);

    const mutation: PeerMutation = {
      id: crypto.randomUUID(),
      entityTable: input.entityTable,
      entityType: input.entityTable,
      entityId: input.entityId,
      operation: input.operation,
      recordPayload: input.recordPayload,
      payload: input.recordPayload,
      hlcTimestamp: hlcString,
    };
    this.mutationLog.push(mutation);

    return record;
  }

  getLocalRecord(entityTable: string, entityId: string): StoredRecord | undefined {
    return this.localRecords.get(`${entityTable}:${entityId}`);
  }

  async createSyncPayload(sinceHlc: string): Promise<PeerSyncPayload> {
    const newerMutations = this.mutationLog.filter((m) => {
      return this.compareHlcStrings(m.hlcTimestamp, sinceHlc) > 0;
    });

    const currentHlc = this.getCurrentHlcString();

    return {
      senderPeerId: this.peerId,
      householdId: this.householdId,
      baseHlc: sinceHlc,
      targetHlc: currentHlc,
      mutations: newerMutations,
    };
  }

  async receiveSyncPayload(payload: PeerSyncPayload): Promise<PeerSyncAck> {
    if (payload.householdId !== this.householdId) {
      return {
        status: 'error',
        appliedCount: 0,
        newHlc: this.getCurrentHlcString(),
        error: 'Household mismatch: forbidden',
      };
    }

    let appliedCount = 0;

    for (const mutation of payload.mutations) {
      const table = mutation.entityTable || mutation.entityType || 'default';
      const key = `${table}:${mutation.entityId}`;
      const existing = this.localRecords.get(key);

      // Advance our local HLC with incoming remote mutation timestamp
      const remoteHlcTs = this.parseHlc(mutation.hlcTimestamp);
      this.hlc.recv(remoteHlcTs);

      if (!existing || this.compareHlcStrings(mutation.hlcTimestamp, existing.hlcTimestamp) > 0) {
        this.localRecords.set(key, {
          entityTable: table,
          entityId: mutation.entityId,
          operation: mutation.operation,
          recordPayload: mutation.recordPayload || mutation.payload,
          hlcTimestamp: mutation.hlcTimestamp,
          updatedAt: new Date().toISOString(),
        });
        appliedCount++;
      }
    }

    return {
      status: 'ok',
      appliedCount,
      newHlc: this.getCurrentHlcString(),
    };
  }

  async performPeerSync(
    remotePeerId: string,
    transport: RemoteSyncTransport,
    lastKnownRemoteHlc: string
  ): Promise<{ sentCount: number; receivedCount: number; currentHlc: string }> {
    // 1. Push our deltas since remote's last known HLC
    const pushPayload = await this.createSyncPayload(lastKnownRemoteHlc);
    const pushAck = await transport.sendPayload(pushPayload);

    // 2. Pull remote deltas since our local HLC
    const pullPayload = await transport.requestPayload(this.getCurrentHlcString());
    const pullAck = await this.receiveSyncPayload(pullPayload);

    return {
      sentCount: pushAck.appliedCount,
      receivedCount: pullAck.appliedCount,
      currentHlc: this.getCurrentHlcString(),
    };
  }
}
