# Phase 1: Monorepo Foundation & Database Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the enterprise 6-tier monorepo structure, centralized dependency catalogs, shared cryptographic libraries, Drizzle PostgreSQL schemas with RLS and sync change journal, client SQLite sync schemas, and initial backend Hono application skeleton.

**Architecture:** A tiered monorepo using `pnpm workspaces`, `pnpm Catalogs`, and `Turborepo` enforcing unidirectional downwards-only dependency flow. Shared contracts in `packages/protocol` export OpenAPI specs consumed by Dart and TypeScript; `packages/crypto` provides zero-knowledge envelope encryption and asymmetric escrow; `packages/server-schema` implements multi-tenant PostgreSQL 17+ tables with CDC sync journaling.

**Tech Stack:** Bun, TypeScript 5.8+, Hono 4+, Drizzle ORM, PostgreSQL 17, pnpm 10+, Turborepo, Vitest.

**Spec:** [2026-11-17-phase-1-architecture-and-database-schema-design.md](file:///d:/.project/HomeDash/docs/superpowers/specs/2026-11-17-phase-1-architecture-and-database-schema-design.md)

---

## Global Constraints

- **Dependency Versions:** Centralized in `pnpm-workspace.yaml` catalog; individual `package.json` files must declare `"catalog:"`.
- **TypeScript Resolution:** Root `tsconfig.json` enforces `moduleResolution: "Bundler"`, `isolatedModules: true`, `target: "ES2022"`.
- **Multi-Tenancy:** Every PostgreSQL table must have `household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE`.
- **Soft Deletes:** All syncable entity tables must include `deleted_at TIMESTAMPTZ` for tombstone propagation.
- **Client SQLite Sync Columns:** Must include `sync_state INT DEFAULT 1`, `hlc_timestamp TEXT NOT NULL`, and `is_deleted INT DEFAULT 0`.
- **Zero-Knowledge Principle:** Raw master passphrases and unencrypted Document Encryption Keys (DEKs) are never sent to or stored on the server.

---

## Review Focus

1. **HLC Clock Drift / Monotonicity:** A client clock moving backwards must never produce an HLC timestamp smaller than its previous timestamp.
2. **PostgreSQL RLS Tenant Leakage:** A query executed without setting `app.current_household_id` must return zero rows, not leak records across households.
3. **Escrow Key Roundtrip (Zero-Knowledge):** An escrowed KEK share encrypted for an emergency contact must be decryptable exclusively with the contact's X25519 private key, not by the server or third parties.
4. **Tombstone Sync Propagation:** Deleted items must record an entry in `sync_changes` with `operation = 'DELETE'` and `record_payload = NULL` so offline clients remove the item upon reconnecting.
5. **Argon2id Session Derivation:** Deriving the user's personal KEK must consume test vectors deterministically and complete without unhandled promises or memory exhaustion.

---

## Task Decomposition

### Task 1: Root Monorepo Scaffolding & Toolchain Configuration

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Interfaces:**
- Consumes: None (Root level)
- Produces: Monorepo workspace configuration for `apps/*`, `packages/*`, and `services/*`.

- [ ] **Step 1: Write root `package.json` and `.gitignore`**
Define root workspace scripts (`build`, `test`, `lint`, `typecheck`, `dev`) and ignore `node_modules`, `dist`, `.turbo`, coverage.

- [ ] **Step 2: Create `pnpm-workspace.yaml` with centralized dependency catalog**
Configure workspace globs and root catalog pinning `hono`, `drizzle-orm`, `zod`, `vitest`, `typescript`, etc.

- [ ] **Step 3: Create `turbo.json` and `tsconfig.json`**
Configure Turborepo pipeline tasks with topological dependencies (`^build`), and root TypeScript configuration with Bundler resolution.

- [ ] **Step 4: Verify monorepo toolchain configuration**
Run: `pnpm -v` and `npx turbo --version`
Expected: Successfully displays versions without syntax errors in workspace files.

- [ ] **Step 5: Commit**
```bash
git add package.json pnpm-workspace.yaml turbo.json tsconfig.json .gitignore
git commit -m "chore: scaffold tiered monorepo workspace with pnpm and turborepo"
```

---

### Task 2: Tier 0 Shared Primitives & Hybrid Logical Clock (`packages/shared`)

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/hlc.ts`
- Create: `packages/shared/src/result.ts`
- Create: `packages/shared/fixtures/crypto-vectors.json`
- Test: `packages/shared/test/hlc.test.ts`

**Interfaces:**
- Consumes: Standard JavaScript `Date` and `crypto.randomUUID`
- Produces: `class HybridLogicalClock { pack(): string; unpack(raw: string): HLC; send(): HLC; recv(remote: HLC): HLC }`, `type Result<T, E>`, and shared crypto test vector fixture.

- [ ] **Step 1: Write the failing HLC unit test**
Create `packages/shared/test/hlc.test.ts` verifying clock monotonicity, remote clock merging, string serialization, and ordering comparison.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm -F @homedash/shared exec vitest run`
Expected: FAIL with module/class not defined.

- [ ] **Step 3: Implement `hlc.ts` and `result.ts` in `packages/shared/src/`**
Implement the Hybrid Logical Clock algorithm guaranteeing monotonically increasing timestamps even under local physical clock drift. Export `Ok`, `Err`, `Result<T, E>`.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm -F @homedash/shared exec vitest run`
Expected: PASS with 100% assertions passing.

- [ ] **Step 5: Commit**
```bash
git add packages/shared
git commit -m "feat(shared): implement Hybrid Logical Clock and core functional primitives"
```

---

### Task 3: Tier 1 Cryptographic Primitives & Envelope Encryption (`packages/crypto`)

**Files:**
- Create: `packages/crypto/package.json`
- Create: `packages/crypto/tsconfig.json`
- Create: `packages/crypto/src/index.ts`
- Create: `packages/crypto/src/argon2.ts`
- Create: `packages/crypto/src/envelope.ts`
- Create: `packages/crypto/src/escrow.ts`
- Test: `packages/crypto/test/crypto.test.ts`

**Interfaces:**
- Consumes: `@homedash/shared` (Result types and crypto fixtures)
- Produces:
  - `derivePersonalKek(passphrase: string, salt: Uint8Array): Promise<Uint8Array>`
  - `sealVaultItem(payload: Uint8Array, householdKek: Uint8Array): { encryptedPayload: string, payloadNonce: string, encryptedDek: string, dekNonce: string }`
  - `unsealVaultItem(sealed: SealedItem, householdKek: Uint8Array): Uint8Array`
  - `sealEscrowShare(householdKek: Uint8Array, recipientPublicKeyX25519: Uint8Array): EscrowShare`
  - `unsealEscrowShare(share: EscrowShare, recipientPrivateKeyX25519: Uint8Array): Uint8Array`

- [ ] **Step 1: Write failing crypto tests**
Create `packages/crypto/test/crypto.test.ts` testing Argon2id key derivation, DEK envelope wrapping/unwrapping, and X25519 ECDH asymmetric escrow share sealing and recovery.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm -F @homedash/crypto exec vitest run`
Expected: FAIL with functions not defined.

- [ ] **Step 3: Implement crypto primitives in `packages/crypto/src/`**
Implement authenticated envelope encryption using Web Crypto / `@noble/ciphers` (`XChaCha20-Poly1305` and `Argon2id`), plus `@noble/curves` for `X25519` key exchange.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm -F @homedash/crypto exec vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/crypto
git commit -m "feat(crypto): implement zero-knowledge envelope encryption and asymmetric escrow"
```

---

### Task 4: Tier 1 Shared Protocol & OpenAPI Contract (`packages/protocol`)

**Files:**
- Create: `packages/protocol/package.json`
- Create: `packages/protocol/tsconfig.json`
- Create: `packages/protocol/src/index.ts`
- Create: `packages/protocol/src/auth.ts`
- Create: `packages/protocol/src/sync.ts`
- Create: `packages/protocol/src/vault.ts`
- Create: `packages/protocol/src/openapi.ts`
- Test: `packages/protocol/test/protocol.test.ts`

**Interfaces:**
- Consumes: `zod`, `@hono/zod-openapi`
- Produces: Shared Zod request/response validation schemas for Auth, Vault, Break-Glass, Sync Push/Pull, and OpenAPI schema generation helper.

- [ ] **Step 1: Write failing protocol tests**
Test validation of Break-Glass request initiation payloads, Sync Push mutation packets, and OpenAPI JSON document generation.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm -F @homedash/protocol exec vitest run`
Expected: FAIL.

- [ ] **Step 3: Implement schemas and OpenAPI definitions**
Define schemas in `packages/protocol/src/` with strict input checking, error mappings, and OpenAPI metadata.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm -F @homedash/protocol exec vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/protocol
git commit -m "feat(protocol): add type-safe RPC contracts and OpenAPI schema generator"
```

---

### Task 5: Tier 1 PostgreSQL Server Schema & Drizzle ORM (`packages/server-schema`)

**Files:**
- Create: `packages/server-schema/package.json`
- Create: `packages/server-schema/tsconfig.json`
- Create: `packages/server-schema/drizzle.config.ts`
- Create: `packages/server-schema/src/index.ts`
- Create: `packages/server-schema/src/schema/households.ts`
- Create: `packages/server-schema/src/schema/finance.ts`
- Create: `packages/server-schema/src/schema/health.ts`
- Create: `packages/server-schema/src/schema/vault.ts`
- Create: `packages/server-schema/src/schema/daily-ops.ts`
- Create: `packages/server-schema/src/schema/sync.ts`
- Create: `packages/server-schema/src/schema/audit.ts`
- Create: `packages/server-schema/src/rls.sql`
- Test: `packages/server-schema/test/schema.test.ts`

**Interfaces:**
- Consumes: `drizzle-orm`, `drizzle-orm/pg-core`
- Produces: Drizzle tables, multi-tenant relations, foreign keys, `sync_changes` table, and SQL RLS policies.

- [ ] **Step 1: Write failing schema tests**
Create `packages/server-schema/test/schema.test.ts` testing schema export integrity, foreign key references, and Drizzle table definitions.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm -F @homedash/server-schema exec vitest run`
Expected: FAIL.

- [ ] **Step 3: Implement Drizzle table schemas and relations**
Implement all tables defined in Phase 1 spec (Households, Finance, Health, Vault, Daily Ops, Sync Changes, Audit Logs) in `packages/server-schema/src/schema/`.

- [ ] **Step 4: Verify schema generation and compilation**
Run: `pnpm -F @homedash/server-schema exec vitest run`
Expected: PASS with all tables properly exported.

- [ ] **Step 5: Commit**
```bash
git add packages/server-schema
git commit -m "feat(server-schema): add complete Drizzle PostgreSQL schema and RLS definitions"
```

---

### Task 6: Tier 1 Client SQLite Sync Schema (`packages/client-schema`)

**Files:**
- Create: `packages/client-schema/package.json`
- Create: `packages/client-schema/tsconfig.json`
- Create: `packages/client-schema/src/index.ts`
- Create: `packages/client-schema/src/schema.sql`
- Test: `packages/client-schema/test/client-schema.test.ts`

**Interfaces:**
- Consumes: None (Raw SQL DDL / Drift compatible definitions)
- Produces: Local SQLite DDL definitions with `sync_state`, `hlc_timestamp`, and `is_deleted` columns.

- [ ] **Step 1: Write failing client schema test**
Verify SQL DDL executes cleanly against an in-memory SQLite database (`better-sqlite3`).

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm -F @homedash/client-schema exec vitest run`
Expected: FAIL.

- [ ] **Step 3: Implement client SQLite schema DDL**
Create `packages/client-schema/src/schema.sql` mirroring syncable server entities with tracking columns.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm -F @homedash/client-schema exec vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/client-schema
git commit -m "feat(client-schema): implement local-first SQLite schema with sync tracking"
```

---

### Task 7: Tier 5 Backend Server Application Skeleton (`apps/server`)

**Files:**
- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`
- Create: `apps/server/src/index.ts`
- Create: `apps/server/src/app.ts`
- Test: `apps/server/test/app.test.ts`

**Interfaces:**
- Consumes: `hono`, `@homedash/protocol`, `@homedash/server-schema`
- Produces: Deployable HTTP & WebSocket server instance.

- [ ] **Step 1: Write failing Hono route test**
Create `apps/server/test/app.test.ts` verifying `/health` returns `{ status: "ok", timestamp: ... }` and `/openapi.json` returns valid OpenAPI documentation.

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm -F @homedash/server exec vitest run`
Expected: FAIL.

- [ ] **Step 3: Implement Hono application in `apps/server/src/app.ts`**
Configure Hono app with CORS, logger, error handling, health endpoint, and protocol routes.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm -F @homedash/server exec vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add apps/server
git commit -m "feat(server): scaffold Hono backend application with health and OpenAPI routes"
```

---

### Task 8: Tier 5 Flutter Mobile Workspace Polyglot Shim (`apps/mobile`)

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/README.md`

**Interfaces:**
- Consumes: Turborepo task pipeline
- Produces: Polyglot workspace bridge for Flutter commands (`build`, `test`, `codegen`).

- [ ] **Step 1: Create `apps/mobile/package.json` shim**
Define `package.json` with Turborepo task scripts forwarding to Flutter commands.

- [ ] **Step 2: Verify root Turborepo graph includes all packages**
Run: `npx turbo run build --dry=json`
Expected: Task graph displays all 8 workspace packages and applications correctly linked.

- [ ] **Step 3: Commit**
```bash
git add apps/mobile
git commit -m "chore(mobile): add polyglot Turborepo workspace shim for Flutter"
```

---

## Execution Handoff

Plan complete and saved to [2026-11-17-phase-1-monorepo-and-schema.md](file:///d:/.project/HomeDash/docs/superpowers/plans/2026-11-17-phase-1-monorepo-and-schema.md). Please review the plan. Which execution approach would you prefer?

- **Subagent-driven** - A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** - I implement every task myself in this session, the way this harness runs work, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

**For this plan I recommend Native**, because the Phase 1 tasks are foundational configuration and schema definitions that follow directly from each other in one coherent sequence. Does the plan capture what you want, and which approach should we use?
