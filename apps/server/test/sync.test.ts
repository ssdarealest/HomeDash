import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import {
  signSessionToken,
  SyncService,
  InMemorySyncJournalStore,
  SyncPubSub,
} from '@homedash/server-runtime';
import type { SyncPushRequest, SyncPullRequest } from '@homedash/protocol';

describe('Server Sync REST API', () => {
  const jwtSecret = 'test_jwt_secret_key_at_least_32_bytes_long!!';
  const householdId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  let app: ReturnType<typeof createApp>;
  let journalStore: InMemorySyncJournalStore;
  let pubsub: SyncPubSub;
  let syncService: SyncService;

  let adminToken: string;
  let caregiverToken: string;

  beforeEach(async () => {
    journalStore = new InMemorySyncJournalStore();
    pubsub = new SyncPubSub();
    syncService = new SyncService({
      journalStore,
      pubsub,
    });

    app = createApp({
      jwtSecret,
      syncService,
      pubsub,
    } as any);

    adminToken = await signSessionToken(
      {
        userId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        householdId,
        role: 'admin',
      },
      jwtSecret
    );

    caregiverToken = await signSessionToken(
      {
        userId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        householdId,
        role: 'caregiver_guest',
      },
      jwtSecret
    );
  });

  it('should accept valid push mutations and return 200 with applied count and serverHlc', async () => {
    const pushBody: SyncPushRequest = {
      householdId,
      clientId: 'device_alpha',
      mutations: [
        {
          entityTable: 'grocery_items',
          entityId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
          operation: 'INSERT',
          recordPayload: { name: 'Almond Flour', completed: false },
          hlcTimestamp: '2026-11-18T10:00:00.000Z_00000001_device_alpha',
        },
      ],
    };

    const res = await app.request('/api/v1/sync/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(pushBody),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.appliedCount).toBe(1);
    expect(data.newHighwaterMark).toBeGreaterThan(0);
    expect(data.serverHlc).toBeDefined();
  });

  it('should retrieve delta changes via POST /api/v1/sync/pull', async () => {
    // Populate journal with a change
    await journalStore.recordChange({
      householdId,
      entityTable: 'chores',
      entityId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
      operation: 'INSERT',
      recordPayload: { title: 'Vacuum living room' },
      hlcTimestamp: '2026-11-18T10:05:00.000Z_00000001_device_alpha',
    });

    const pullBody: SyncPullRequest = {
      householdId,
      cursor: 0,
      limit: 10,
    };

    const res = await app.request('/api/v1/sync/pull', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(pullBody),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.changes.length).toBe(1);
    expect(data.changes[0].entityTable).toBe('chores');
    expect(data.newCursor).toBe(1);
    expect(data.hasMore).toBe(false);
  });

  it('should reject caregiver_guest attempting to push financial records with 403', async () => {
    const pushBody: SyncPushRequest = {
      householdId,
      clientId: 'device_caregiver',
      mutations: [
        {
          entityTable: 'finance_transactions',
          entityId: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
          operation: 'INSERT',
          recordPayload: { amountCents: 10000 },
          hlcTimestamp: '2026-11-18T10:10:00.000Z_00000001_device_caregiver',
        },
      ],
    };

    const res = await app.request('/api/v1/sync/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${caregiverToken}`,
      },
      body: JSON.stringify(pushBody),
    });

    expect(res.status).toBe(403);
  });

  it('should filter out financial changes when caregiver pulls delta changes', async () => {
    await journalStore.recordChange({
      householdId,
      entityTable: 'chores',
      entityId: '11eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      operation: 'INSERT',
      recordPayload: { title: 'Feed cat' },
      hlcTimestamp: '2026-11-18T10:15:00.000Z_00000001_device_alpha',
    });
    await journalStore.recordChange({
      householdId,
      entityTable: 'finance_transactions',
      entityId: '22eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      operation: 'INSERT',
      recordPayload: { amountCents: 9999 },
      hlcTimestamp: '2026-11-18T10:16:00.000Z_00000001_device_alpha',
    });

    const pullBody: SyncPullRequest = {
      householdId,
      cursor: 0,
      limit: 10,
    };

    const res = await app.request('/api/v1/sync/pull', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${caregiverToken}`,
      },
      body: JSON.stringify(pullBody),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.changes.length).toBe(1);
    expect(data.changes[0].entityTable).toBe('chores');
  });

  it('should reject push mutations targeting unwhitelisted tables with 400', async () => {
    const pushBody: SyncPushRequest = {
      householdId,
      clientId: 'device_alpha',
      mutations: [
        {
          entityTable: 'audit_logs', // Not in collaborative sync whitelist
          entityId: '33eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
          operation: 'INSERT',
          recordPayload: { action: 'HACK' },
          hlcTimestamp: '2026-11-18T10:20:00.000Z_00000001_device_alpha',
        },
      ],
    };

    const res = await app.request('/api/v1/sync/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(pushBody),
    });

    expect(res.status).toBe(400);
  });
});
