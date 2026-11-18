# Phase 3: Bidirectional Sync Engine & Real-Time Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bidirectional local-first synchronization engine and real-time invalidation protocol spanning Tier 3 (`@homedash/sync-engine`), Tier 4 (`@homedash/server-runtime`), and Tier 5 (`apps/server`) with Hybrid Logical Clock conflict resolution.

**Architecture:** Downward-only 6-tier monorepo architecture. Client SQLite mutations are recorded into an outbox, synced via HLC-driven Last-Write-Wins (LWW) push/pull REST APIs, recorded by PostgreSQL Change Data Capture (CDC) triggers, and fanned out in real-time to family devices through Valkey Pub/Sub and WebSocket/SSE.

**Tech Stack:** TypeScript 5.x, Vitest, Hono, Zod, Drizzle ORM, PostgreSQL 17, Valkey 8, SQLite, Hybrid Logical Clocks (`@homedash/shared`).

**Spec:** [docs/superpowers/specs/2026-11-18-phase-3-sync-engine-and-realtime-protocol.md](file:///d:/.project/HomeDash/docs/superpowers/specs/2026-11-18-phase-3-sync-engine-and-realtime-protocol.md)

## Global Constraints

- Downwards-only dependencies: Tier 3 (`packages/sync-engine`) depends only on Tiers 0, 1, 2. Never on Tier 4 or 5.
- Zero-knowledge encryption: Payload of `vault_items` must remain opaque encrypted ciphertext during sync.
- Caregiver isolation: Users with role `caregiver_guest` must be strictly blocked from pushing or pulling `finance_*` or `vault_*` records.
- Deterministic conflict resolution: HLC wall-clock > HLC counter > Node ID tie-breaker.
- Zero TypeScript errors (`turbo run typecheck`), 100% test passes (`turbo run test`).

## Review Focus

1. **CDC Trigger Column Alignment**: Ensure `fn_record_sync_change` inserts into `entity_table` and `entity_id` to match Drizzle schema.
2. **Caregiver Guest Evasion via Sync**: Verify that malicious push/pull requests for `finance_*` or `vault_*` by caregiver guests are rejected with 403.
3. **Concurrent Edit Tie-Breaker**: Verify deterministic reconciliation when two clients generate mutations at the exact same physical millisecond.
4. **Echo-Loop Suppression**: Real-time invalidation events must carry `sourceClientId` so the originating client does not trigger redundant pull loops.
5. **Reconnection & Cursor Resumption**: Pull requests with out-of-date or zero cursors must receive historical changes without gaps or unbounded memory spikes.

---

### Task 1: Protocol & Schema Refinements (`@homedash/protocol` & `@homedash/server-schema`)

**Files:**
- Modify: `packages/protocol/src/sync.ts`
- Modify: `packages/server-schema/src/rls.sql:230-245`
- Test: `packages/protocol/test/sync-protocol.test.ts`
- Test: `packages/server-schema/test/schema.test.ts`

- [ ] Write failing test in `packages/protocol/test/sync-protocol.test.ts` validating `SyncPullResponseSchema` and `RealtimeSyncEventSchema`.
- [ ] Add `SyncPullResponseSchema` and `RealtimeSyncEventSchema` to `packages/protocol/src/sync.ts`.
- [ ] Fix `fn_record_sync_change()` in `packages/server-schema/src/rls.sql` to insert into `(household_id, entity_table, entity_id, hlc_timestamp, operation, record_payload)`.
- [ ] Run `pnpm -F @homedash/protocol test` and `pnpm -F @homedash/server-schema test` to confirm all pass.
- [ ] Commit: `git commit -m "feat(protocol,schema): refine sync schemas and fix cdc trigger column names"`.

---

### Task 2: Tier 3 Package Scaffolding & Outbox Store (`@homedash/sync-engine`)

**Files:**
- Create: `packages/sync-engine/package.json`
- Create: `packages/sync-engine/tsconfig.json`
- Create: `packages/sync-engine/src/types.ts`
- Create: `packages/sync-engine/src/outbox.ts`
- Create: `packages/sync-engine/src/index.ts`
- Test: `packages/sync-engine/test/outbox.test.ts`

- [ ] Scaffold `packages/sync-engine` with dependencies on `@homedash/shared`, `@homedash/protocol`, and `@homedash/client-schema`.
- [ ] Write failing test `packages/sync-engine/test/outbox.test.ts` for outbox queuing, status updates (`pending` -> `in_flight` -> `synced`), and retry logic.
- [ ] Implement `OutboxManager` interface and `InMemoryOutboxStore` / `SQLiteOutboxStore` in `packages/sync-engine/src/outbox.ts`.
- [ ] Run `pnpm -F @homedash/sync-engine test` and verify tests pass.
- [ ] Commit: `git commit -m "feat(sync-engine): scaffold package and implement outbox store"`.

---

### Task 3: Tier 3 Deterministic Conflict Reconciler (`@homedash/sync-engine`)

**Files:**
- Create: `packages/sync-engine/src/reconciler.ts`
- Modify: `packages/sync-engine/src/index.ts`
- Test: `packages/sync-engine/test/reconciler.test.ts`

- [ ] Write failing tests in `packages/sync-engine/test/reconciler.test.ts` covering:
  - Remote win when `remoteHlc > localHlc`
  - Local retain when `localHlc > remoteHlc`
  - Deterministic tie-breaking on `nodeId` when HLC timestamps match
  - Soft-delete tombstone reconciliation
- [ ] Implement `ConflictReconciler` in `packages/sync-engine/src/reconciler.ts` utilizing `hlcCompare` from `@homedash/shared`.
- [ ] Run `pnpm -F @homedash/sync-engine test` and verify 100% pass.
- [ ] Commit: `git commit -m "feat(sync-engine): implement deterministic hlc conflict reconciler"`.

---

### Task 4: Tier 3 Sync Coordinator & Client (`@homedash/sync-engine`)

**Files:**
- Create: `packages/sync-engine/src/coordinator.ts`
- Modify: `packages/sync-engine/src/index.ts`
- Test: `packages/sync-engine/test/coordinator.test.ts`

- [ ] Write failing test in `packages/sync-engine/test/coordinator.test.ts` testing full `sync()` cycle:
  - Bundling outbox into push request
  - Applying pull response through reconciler
  - Advancing cursor and emitting lifecycle events (`sync:start`, `sync:complete`)
- [ ] Implement `SyncCoordinator` in `packages/sync-engine/src/coordinator.ts`.
- [ ] Run `pnpm -F @homedash/sync-engine test` and verify tests pass.
- [ ] Commit: `git commit -m "feat(sync-engine): implement sync coordinator and lifecycle client"`.

---

### Task 5: Tier 4 Server Sync Service & PubSub (`@homedash/server-runtime`)

**Files:**
- Create: `packages/server-runtime/src/sync/service.ts`
- Create: `packages/server-runtime/src/sync/pubsub.ts`
- Create: `packages/server-runtime/src/sync/index.ts`
- Modify: `packages/server-runtime/src/index.ts`
- Test: `packages/server-runtime/test/sync-service.test.ts`

- [ ] Write failing tests in `packages/server-runtime/test/sync-service.test.ts`:
  - `processPush()` validates whitelist and rejects caregiver finance mutations
  - `processPull()` respects cursor pagination and strips caregiver finance changes
  - Publishes invalidation event to Valkey PubSub
- [ ] Implement `SyncService` in `packages/server-runtime/src/sync/service.ts` and `SyncPubSub` in `packages/server-runtime/src/sync/pubsub.ts`.
- [ ] Run `pnpm -F @homedash/server-runtime test` and verify tests pass.
- [ ] Commit: `git commit -m "feat(server-runtime): implement sync service and valkey pubsub adapter"`.

---

### Task 6: Tier 5 Server Sync REST Endpoints & Realtime Channel (`apps/server`)

**Files:**
- Create: `apps/server/src/routes/sync.ts`
- Create: `apps/server/src/routes/realtime.ts`
- Modify: `apps/server/src/app.ts`
- Test: `apps/server/test/sync.test.ts`
- Test: `apps/server/test/realtime.test.ts`

- [ ] Write failing tests in `apps/server/test/sync.test.ts` for:
  - `POST /api/v1/sync/push` with valid auth and payload
  - `POST /api/v1/sync/pull` with pagination
  - 403 Forbidden on caregiver guest access to financial sync
- [ ] Write failing test in `apps/server/test/realtime.test.ts` for SSE/WebSocket connection and invalidation stream.
- [ ] Implement routes in `apps/server/src/routes/sync.ts` and `apps/server/src/routes/realtime.ts`, mount in `apps/server/src/app.ts`.
- [ ] Run `pnpm -F @homedash/server test` and verify tests pass.
- [ ] Commit: `git commit -m "feat(server): mount sync rest endpoints and realtime invalidation stream"`.

---

### Task 7: Multi-Device End-to-End Simulation & Whole-Suite Build

**Files:**
- Create: `apps/server/test/e2e-sync.test.ts`
- Modify: `turbo.json` (if outputs need adjustment)
- Test: Whole suite (`turbo run test typecheck`)

- [ ] Write multi-device simulation test in `apps/server/test/e2e-sync.test.ts`:
  - Client 1 creates chore while offline
  - Client 1 pushes chore to Server
  - Realtime invalidation triggers Client 2
  - Client 2 pulls and reconciles into local store
  - Concurrent conflict resolution test (both edit same chore, higher HLC wins)
- [ ] Run full project validation: `pnpm exec turbo run test typecheck`. Confirm all tasks succeed with zero errors.
- [ ] Run Senior Code Review pass and address any findings.
- [ ] Commit: `git commit -m "test(e2e): verify multi-device collaborative sync and hlc conflict resolution"`.
