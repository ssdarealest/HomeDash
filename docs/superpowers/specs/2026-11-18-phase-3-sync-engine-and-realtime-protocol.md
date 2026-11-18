# Phase 3: Bidirectional Sync Engine & Real-Time Protocol Specification

## 1. Executive Summary

HomeDash is a **local-first, offline-first operating system for families**. The system must operate with zero network latency, maintain full read/write availability during offline periods (e.g., underground parking, flights, rural trips), and automatically reconcile changes across multiple family members' devices once connectivity is restored.

Phase 3 builds the core data synchronization infrastructure spanning Tier 3 (`@homedash/sync-engine`), Tier 4 (`@homedash/server-runtime`), and Tier 5 (`apps/server`), driven by:
1. **Hybrid Logical Clocks (HLC)** for strict causal ordering without external NTP reliance.
2. **Deterministic Last-Write-Wins (LWW)** conflict resolution per record/field with deterministic node tie-breaking.
3. **Transactional Outbox Queue** on client SQLite databases to guarantee at-least-once delivery.
4. **PostgreSQL Change Data Capture (CDC)** via `sync_changes` journal table and `fn_record_sync_change` triggers.
5. **Real-Time Notification Pipeline** via Valkey Pub/Sub and WebSocket/SSE channels to invalidate stale caches and trigger background pull cycles.

---

## 2. Monorepo Layer Stratification

```
┌────────────────────────────────────────────────────────┐
│ Tier 5: Apps                                           │
│ apps/server (Hono Backend, /sync/*, /realtime WS/SSE)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 4: Server Runtime                                 │
│ packages/server-runtime (SyncService, Valkey PubSub)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 3: Client Sync Engine                             │
│ packages/sync-engine (OutboxManager, ConflictReconciler)
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 2: Schemas & Data Layer                           │
│ packages/server-schema (Postgres/sync_changes, RLS)    │
│ packages/client-schema (SQLite schema, local tables)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 1: Core Domain Contracts                          │
│ packages/protocol (SyncPush/Pull RPC Schemas)          │
│ packages/crypto (Envelope encryption)                  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 0: Foundation Primitives                          │
│ packages/shared (Hybrid Logical Clock, Result<T, E>)   │
└────────────────────────────────────────────────────────┘
```

Dependencies flow strictly **downwards**. `packages/sync-engine` never imports `packages/server-runtime` or `apps/server`.

---

## 3. Data Contracts & Protocol Definitions

### 3.1 Collaborative Entity Tables Whitelist

Only collaborative household entity tables participate in the sync protocol:
- `grocery_items`
- `meal_plans`
- `chores`
- `home_wiki_cards`
- `health_medications`
- `health_medication_logs`
- `health_allergies`
- `health_growth_records`
- `finance_accounts` (Blocked for `caregiver_guest`)
- `finance_transactions` (Blocked for `caregiver_guest`)
- `utility_bills` (Blocked for `caregiver_guest`)
- `vault_items` (Blocked for `caregiver_guest`)
- `asset_renewals`

### 3.2 Protocol Schemas (`@homedash/protocol`)

```typescript
// packages/protocol/src/sync.ts

export const SyncOperationSchema = z.enum(['INSERT', 'UPDATE', 'DELETE']);
export type SyncOperation = z.infer<typeof SyncOperationSchema>;

export const SyncMutationSchema = z.object({
  id: z.string().uuid().optional(),
  entityTable: z.string().min(1).max(80),
  entityId: z.string().uuid(),
  operation: SyncOperationSchema,
  recordPayload: z.record(z.any()).nullable().optional(),
  hlcTimestamp: z.string().min(1),
});

export const SyncPushRequestSchema = z.object({
  householdId: z.string().uuid(),
  clientId: z.string().min(1),
  mutations: z.array(SyncMutationSchema),
});

export const SyncPushResponseSchema = z.object({
  appliedCount: z.number().int().nonnegative(),
  newHighwaterMark: z.number().int().nonnegative(),
  serverTimestamp: z.string().datetime(),
  serverHlc: z.string().min(1),
});

export const SyncPullRequestSchema = z.object({
  householdId: z.string().uuid(),
  cursor: z.number().int().nonnegative().default(0),
  limit: z.number().int().min(1).max(1000).default(100),
});

export const SyncPullResponseSchema = z.object({
  changes: z.array(z.object({
    id: z.number().int().nonnegative(),
    entityTable: z.string(),
    entityId: z.string().uuid(),
    operation: SyncOperationSchema,
    recordPayload: z.record(z.any()).nullable(),
    hlcTimestamp: z.string(),
    createdAt: z.string(),
  })),
  newCursor: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  serverHlc: z.string(),
});

export const RealtimeSyncEventSchema = z.object({
  type: z.literal('sync:invalidate'),
  householdId: z.string().uuid(),
  highwaterMark: z.number().int().nonnegative(),
  sourceClientId: z.string().optional(),
  timestamp: z.string().datetime(),
});
```

---

## 4. Conflict Resolution & Reconciliation Algorithm

### 4.1 Hybrid Logical Clock (HLC) Ordering

Every mutation carries an HLC string in format:
`"<ISO-8601-wall-time>:<counter-hex>:<node-id>"` (e.g. `"2026-11-18T10:00:00.000Z:0001:client-xyz"`).

Given two HLCs $H_1$ and $H_2$:
1. $H_1 > H_2$ if $H_1.\text{time} > H_2.\text{time}$.
2. If $H_1.\text{time} == H_2.\text{time}$, $H_1 > H_2$ if $H_1.\text{count} > H_2.\text{count}$.
3. If $H_1.\text{time} == H_2.\text{time}$ and $H_1.\text{count} == H_2.\text{count}$, tie-breaker is deterministic lexical comparison of node ID: $H_1.\text{nodeId} > H_2.\text{nodeId}$.

### 4.2 Conflict Reconciler Matrix

| Local State | Inbound Remote State | Rule / Action |
|---|---|---|
| Clean (synced, no outbox) | Incoming `INSERT`/`UPDATE` | **Apply Remote**: Update local SQLite record with remote payload, set `sync_state = 0`, update record `hlc_timestamp = remoteHlc`. |
| Clean (synced, no outbox) | Incoming `DELETE` | **Apply Tombstone**: Mark `is_deleted = 1`, set `sync_state = 0`, record `hlc_timestamp = remoteHlc`. |
| Dirty (`sync_state != 0`) | Incoming `UPDATE` / `DELETE` | **Compare HLCs**:<br>• If `remoteHlc > localHlc`: Remote wins. Replace local record, set `sync_state = 0`, remove item from outbox.<br>• If `localHlc > remoteHlc`: Local wins. Keep local record, retain in outbox for subsequent push.<br>• If `localHlc == remoteHlc`: Tie break on `nodeId`. |

---

## 5. Client Sync Engine Architecture (`@homedash/sync-engine`)

### 5.1 Outbox Queue (`OutboxManager`)
- Persists pending mutations to SQLite table `_local_sync_outbox` or local memory:
  - `id`: UUID
  - `entity_table`: String
  - `entity_id`: UUID
  - `operation`: INSERT / UPDATE / DELETE
  - `record_payload`: JSON
  - `hlc_timestamp`: String
  - `status`: `pending` | `in_flight` | `failed`
  - `retry_count`: Integer
- On `push()`, fetches all `pending` items, sets status to `in_flight`, bundles into `SyncPushRequest`.
- On push success, removes acknowledged entries from `_local_sync_outbox`.
- On network failure, resets `in_flight` back to `pending` with exponential backoff increment.

### 5.2 Sync Coordinator (`SyncCoordinator`)
- Manages sync lifecycle:
  - `IDLE` -> `PUSHING` -> `PULLING` -> `IDLE`
- Automatic retry on reconnection.
- Listens to incoming real-time notifications (`sync:invalidate`) to trigger non-blocking background pull cycles.

---

## 6. Server Sync Engine Architecture (`@homedash/server-runtime` & `apps/server`)

### 6.1 Server Push Endpoint (`POST /api/v1/sync/push`)
1. **Authentication & RLS Guard**:
   - Validates Bearer JWT token.
   - Extracts `householdId`, `userId`, `userRole`.
   - `rlsContextMiddleware` sets `app.current_household_id = householdId`.
2. **Caregiver Guest Isolation**:
   - If `userRole === 'caregiver_guest'`, rejecting any mutation targeting `finance_*` or `vault_*` with `403 Forbidden`.
3. **Transaction Batch Apply**:
   - For each mutation:
     - Check existing target row in PostgreSQL.
     - If incoming `hlc_timestamp > current_row.hlc_timestamp`:
       - Perform upsert or soft delete.
       - The PostgreSQL trigger `fn_record_sync_change` captures change into `sync_changes`.
4. **Valkey Invalidation Broadcast**:
   - Publishes `RealtimeSyncEvent` to Valkey channel `household:${householdId}:sync`.
5. **Response**:
   - Returns applied count, server HLC timestamp, and updated cursor.

### 6.2 Server Pull Endpoint (`POST /api/v1/sync/pull`)
1. **Authentication & RLS Guard**:
   - Parameterized query against `sync_changes` table:
     `SELECT * FROM sync_changes WHERE household_id = $1 AND id > $2 ORDER BY id ASC LIMIT $3`.
2. **Caregiver Guest Filter**:
   - Strips any change rows targeting `finance_*` or `vault_*` if caller is `caregiver_guest`.
3. **Response**:
   - Returns list of change entries, latest cursor, and `hasMore` pagination boolean.

### 6.3 Real-Time WebSocket / SSE Channel (`/api/v1/realtime`)
1. **Handshake**:
   - Client authenticates via query `?token=<jwt>` or Authorization header.
2. **Channel Subscription**:
   - Server subscribes to Valkey channel `household:${householdId}:sync`.
   - Forward invalidation signals to connected clients in the household:
     ```json
     {
       "type": "sync:invalidate",
       "householdId": "...",
       "highwaterMark": 42,
       "sourceClientId": "client-A",
       "timestamp": "2026-11-18T10:00:00.000Z"
     }
     ```
3. **Loop Suppression**:
   - Clients matching `sourceClientId` ignore the invalidation event, preventing echo-loops.

---

## 7. Security & Privacy Guarantees

1. **Row-Level Security**:
   - All server queries against collaborative tables and `sync_changes` strictly enforce `household_id = current_setting('app.current_household_id')`.
2. **Caregiver Guest Quarantining**:
   - Caregivers attempting to push or pull financial records (`finance_accounts`, `finance_transactions`, `utility_bills`) or encrypted vault documents (`vault_items`) receive strict `403 Forbidden` errors and are omitted from change logs.
3. **Zero-Knowledge Encryption Preservation**:
   - `vault_items` payloads remain encrypted client-side (`encrypted_payload`, `payload_nonce`, `encrypted_dek`, `dek_nonce`). The sync engine transports opaque ciphertext blobs without possessing key material.

---

## 8. Verification Plan & Test Matrix

- **Unit Tests**:
  - `packages/sync-engine/test/outbox.test.ts`: Outbox queuing, in-flight state handling, batching, pruning.
  - `packages/sync-engine/test/reconciler.test.ts`: HLC Last-Write-Wins matrix, concurrent edit tie-breakers, deletion tombstones.
  - `packages/sync-engine/test/coordinator.test.ts`: Full push/pull coordinator lifecycle, error recovery.
  - `packages/server-runtime/test/sync-service.test.ts`: Server push/pull business logic, CDC querying, caregiver protection.
  - `apps/server/test/sync.test.ts`: Integration HTTP tests for `/api/v1/sync/push`, `/api/v1/sync/pull`, and `/api/v1/realtime`.
- **Quality Gates**:
  - `turbo run test typecheck`: 100% pass across all monorepo packages.
  - Zero TypeScript compile errors.
