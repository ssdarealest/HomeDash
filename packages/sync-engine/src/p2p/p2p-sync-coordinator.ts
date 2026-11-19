import { createHmac, timingSafeEqual } from 'node:crypto';
import { HybridLogicalClock, type HLCTimestamp } from '@homedash/shared';
import type {
  PeerSyncPayload,
  PeerSyncAck,
  PeerMutation,
} from '@homedash/protocol';

export const SENSITIVE_CAREGIVER_TABLES = new Set([
  'finance_accounts',
  'finance_transactions',
  'utility_bills',
  'vault_items',
]);

export const MAX_FORWARD_CLOCK_DRIFT_MS = 60_000;

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
  recordPayload?: Record<string, any> | null;
}

export interface StoredRecord {
  entityTable: string;
  entityId: string;
  operation: string;
  recordPayload?: Record<string, any> | null;
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
        if (!isNaN(millis) && millis > 0) {
          return { millis, counter: isNaN(counter) ? 0 : counter, nodeId };
        }
      }
      return { millis: 0, counter: 0, nodeId: 'invalid' };
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

  async createSyncPayload(sinceHlc: string, targetPeerRole?: string): Promise<PeerSyncPayload> {
    let newerMutations = this.mutationLog.filter((m) => {
      return this.compareHlcStrings(m.hlcTimestamp, sinceHlc) > 0;
    });

    if (targetPeerRole === 'caregiver_guest') {
      newerMutations = newerMutations.filter((m) => {
        const table = m.entityTable || m.entityType || '';
        return !SENSITIVE_CAREGIVER_TABLES.has(table);
      });
    }

    const currentHlc = this.getCurrentHlcString();
    const payloadToSign = `${this.householdId}:${this.peerId}:${sinceHlc}:${currentHlc}:${newerMutations.length}`;
    const signature = createHmac('sha256', this.householdKey).update(payloadToSign).digest('hex');

    return {
      senderPeerId: this.peerId,
      householdId: this.householdId,
      baseHlc: sinceHlc,
      targetHlc: currentHlc,
      mutations: newerMutations,
      signature,
    };
  }

  async receiveSyncPayload(payload: PeerSyncPayload, senderPeerRole?: string): Promise<PeerSyncAck> {
    if (payload.householdId !== this.householdId) {
      return {
        status: 'error',
        appliedCount: 0,
        newHlc: this.getCurrentHlcString(),
        error: 'Household mismatch: forbidden',
      };
    }

    if (payload.signature) {
      const payloadToSign = `${payload.householdId}:${payload.senderPeerId}:${payload.baseHlc}:${payload.targetHlc}:${payload.mutations.length}`;
      const expectedSig = createHmac('sha256', this.householdKey).update(payloadToSign).digest('hex');
      const sigBuf = Buffer.from(payload.signature, 'hex');
      const expBuf = Buffer.from(expectedSig, 'hex');

      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
        return {
          status: 'error',
          appliedCount: 0,
          newHlc: this.getCurrentHlcString(),
          error: 'Invalid payload signature: authentication failed',
        };
      }
    }

    const nowMs = Date.now();
    let appliedCount = 0;

    for (const mutation of payload.mutations) {
      const table = mutation.entityTable || mutation.entityType || 'default';
      if (senderPeerRole === 'caregiver_guest' && SENSITIVE_CAREGIVER_TABLES.has(table)) {
        // Drop caregiver-mutated sensitive financial/vault tables
        continue;
      }

      const remoteHlcTs = this.parseHlc(mutation.hlcTimestamp);
      // Prevent clock poisoning from forward clock drift
      if (remoteHlcTs.millis > nowMs + MAX_FORWARD_CLOCK_DRIFT_MS) {
        continue;
      }

      if (remoteHlcTs.millis > 0) {
        this.hlc.recv(remoteHlcTs);
      }

      const key = `${table}:${mutation.entityId}`;
      const existing = this.localRecords.get(key);

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
    lastKnownRemoteHlc: string,
    remotePeerRole?: string
  ): Promise<{ sentCount: number; receivedCount: number; currentHlc: string }> {
    // 1. Push our deltas since remote's last known HLC
    const pushPayload = await this.createSyncPayload(lastKnownRemoteHlc, remotePeerRole);
    const pushAck = await transport.sendPayload(pushPayload);

    // 2. Pull remote deltas since our local HLC
    const pullPayload = await transport.requestPayload(this.getCurrentHlcString());
    const pullAck = await this.receiveSyncPayload(pullPayload, remotePeerRole);

    return {
      sentCount: pushAck.appliedCount,
      receivedCount: pullAck.appliedCount,
      currentHlc: this.getCurrentHlcString(),
    };
  }
}
