# Phase 6: Multi-Device P2P Sync & Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement offline-first local network P2P synchronization, desktop Glassmorphic Bento Grid dashboard, and production hardening with automated security audits and performance benchmarks.

**Architecture:** Pure TypeScript peer discovery and mutual challenge-response P2P coordinator built into `packages/sync-engine` interoperating with existing `HlcReconciler`; desktop/tablet responsive Material 3 + Glassmorphic Bento widgets in `apps/mobile`; and automated benchmark/audit test suites in `apps/server` and `packages/sync-engine`.

**Tech Stack:** TypeScript, Node.js Web Crypto, Zod, Flutter/Dart UI primitives, Vitest, Turborepo.

**Spec:** [docs/superpowers/specs/2026-11-19-phase-6-p2p-sync-production-hardening.md](file:///d:/.project/HomeDash/docs/superpowers/specs/2026-11-19-phase-6-p2p-sync-production-hardening.md)

## Global Constraints

- Downward-only 6-tier monorepo dependency hierarchy.
- Zero plaintext vault secrets or escrow private keys stored unencrypted.
- Caregiver and guest sessions strictly quarantined from financial ledgers and vault modules.
- Constant-time signature verification for all handshake and HMAC tokens.
- Absolutely NO EMOJIS anywhere in code, commits, PR titles/bodies, or documentation.

## Review Focus

- Peer discovery spoofing: reject any peer announcement whose signature or household ID fails validation.
- P2P outbox race conditions: ensure simultaneous bidirectional sync does not duplicate mutations or produce clock regressions.
- Broken glass and escrow leakage: verify no P2P sync ever transfers unapproved break-glass keys without explicit recipient entitlement.
- Memory leaks in discovery listeners: ensure stale peer entries are automatically reaped after heartbeat timeout.
- Viewport layout breakdown: ensure desktop Bento Grid gracefully cascades from 4 columns down to 1 column on narrow screens.

---

### Task 1: P2P Sync Protocol Schemas (`packages/protocol`)

**Files:**
- Create: `packages/protocol/src/p2p.ts`
- Modify: `packages/protocol/src/index.ts`
- Test: `packages/protocol/test/p2p-schemas.test.ts`

- [ ] Write unit tests for `PeerAnnouncementSchema`, `PeerHandshakeRequestSchema`, `PeerHandshakeResponseSchema`, and `PeerSyncPayloadSchema`.
- [ ] Implement Zod schemas in `packages/protocol/src/p2p.ts`.
- [ ] Export schemas from `packages/protocol/src/index.ts`.
- [ ] Run test suite `pnpm -F @homedash/protocol test` and ensure all tests pass.
- [ ] Commit: `feat(protocol): add peer-to-peer sync and discovery schemas`

---

### Task 2: P2P Peer Discovery, Handshake & Session Coordinator (`packages/sync-engine`)

**Files:**
- Create: `packages/sync-engine/src/p2p/peer-discovery.ts`
- Create: `packages/sync-engine/src/p2p/peer-session.ts`
- Create: `packages/sync-engine/src/p2p/index.ts`
- Modify: `packages/sync-engine/src/index.ts`
- Test: `packages/sync-engine/test/peer-discovery.test.ts`

- [ ] Write unit tests for peer announcement registration, heartbeat expiry, and mutual challenge-response authentication.
- [ ] Implement `PeerDiscoveryManager` with TTL-based peer tracking and household scoping.
- [ ] Implement `PeerSessionCoordinator` generating cryptographically secure nonces and validating HMAC-SHA256 signatures.
- [ ] Run test suite `pnpm -F @homedash/sync-engine test` and verify passing.
- [ ] Commit: `feat(sync-engine): implement P2P peer discovery and mutual authentication session coordinator`

---

### Task 3: Direct P2P Delta Reconciler & Sync Transport (`packages/sync-engine`)

**Files:**
- Create: `packages/sync-engine/src/p2p/p2p-sync-coordinator.ts`
- Modify: `packages/sync-engine/src/p2p/index.ts`
- Modify: `packages/sync-engine/src/index.ts`
- Test: `packages/sync-engine/test/p2p-sync-coordinator.test.ts`

- [ ] Write unit tests verifying bidirectional delta exchange between two peers and reconciliation via `HlcReconciler`.
- [ ] Implement `P2PSyncCoordinator` managing pull/push sync exchanges, mutation batching, and conflict resolution.
- [ ] Ensure non-household peers are rejected and invalid mutations are dropped.
- [ ] Run tests `pnpm -F @homedash/sync-engine test` and verify passing.
- [ ] Commit: `feat(sync-engine): implement direct P2P delta synchronizer and outbox reconciler`

---

### Task 4: Desktop & Web Glassmorphic Bento Grid UI Components (`apps/mobile`)

**Files:**
- Create: `apps/mobile/lib/presentation/bento/bento_grid_view.dart`
- Create: `apps/mobile/lib/presentation/bento/glassmorphic_card.dart`
- Create: `apps/mobile/lib/presentation/bento/bento_widgets.dart`
- Test: `apps/mobile/test/bento-glassmorphic.test.ts`

- [ ] Write test verifying Bento Grid responsive layout metrics, glassmorphic decoration parameters, and role-based widget visibility.
- [ ] Implement `GlassmorphicCard` with backdrop blur, subtle borders, and solid M3 theme switch.
- [ ] Implement `BentoGridView` adapting across 1 to 4 columns depending on available width.
- [ ] Implement bento widget cards for Cash Flow, Meds Timeline, Shifts, and Vault status.
- [ ] Run tests `pnpm -F @homedash/mobile test` and verify passing.
- [ ] Commit: `feat(mobile): implement desktop glassmorphic Bento Grid workspace and telemetry cards`

---

### Task 5: Production Deployment Hardening, Benchmarking & Security Audit (`apps/server`, `packages/sync-engine`)

**Files:**
- Create: `packages/sync-engine/test/benchmarks.test.ts`
- Create: `apps/server/test/production-audit.test.ts`
- Modify: `deploy/docker-compose.yml`

- [ ] Write benchmark tests for 1,000 concurrent HLC mutations and P2P delta reconciliation (<100ms budget).
- [ ] Write comprehensive security audit tests validating:
  - Zero plaintext vault leaks in server logs and memory.
  - Caregiver session quarantine across all finance, vault, and break-glass endpoints.
  - Constant-time signature verification on all webhook and handshake paths.
- [ ] Add explicit container healthcheck definitions to `deploy/docker-compose.yml`.
- [ ] Run tests `pnpm -F @homedash/server test` and `pnpm -F @homedash/sync-engine test`.
- [ ] Commit: `test(server): add production security audit, deployment healthchecks, and HLC performance benchmarks`

---

### Task 6: Monorepo Integration, Verification & Documentation Update

**Files:**
- Modify: `README.md`
- Track: Task checklist artifact

- [ ] Run full monorepo pipeline: `pnpm exec turbo run test typecheck`.
- [ ] Verify 24+ tasks pass with 0 errors across all 9 packages.
- [ ] Update `README.md` to reflect Phase 6 completion and full platform readiness.
- [ ] Commit: `docs: mark Phase 6 complete and finalize HomeDash architecture documentation`
