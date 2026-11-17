# Phase 2: Backend Core, Auth & Self-Host Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production-ready self-hosted container infrastructure, PostgreSQL migration engine, Passkey/Magic-Link authentication subsystem, and RBAC / RLS context middleware for HomeDash.

**Architecture:** A standalone Docker Compose stack bundles PostgreSQL 17+, Valkey 8, MinIO S3 object storage, Caddy reverse proxy, and the Hono API server. Database schema migrations run on startup with automated RLS policy application. Tier 4 `@homedash/server-runtime` provides zero-dependency Web Crypto JWT session management, WebAuthn Passkeys, time-bound caregiver magic links, and RBAC middleware that injects PostgreSQL session variables for Row-Level Security.

**Tech Stack:** Docker Compose v2, Caddy v2, PostgreSQL 17, Valkey 8, MinIO, TypeScript, Hono 4, Drizzle ORM / drizzle-kit, Web Crypto API (`hono/jwt`, HMAC-SHA256), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-17-phase-1-architecture-and-database-schema-design.md` and `PROMPT.md` (Sections 4, 5, 6).

## Global Constraints

- Downwards-only dependency rule: `apps/server` (Tier 5) -> `@homedash/server-runtime` (Tier 4) -> `@homedash/protocol` / `@homedash/server-schema` (Tier 1) -> `@homedash/shared` (Tier 0).
- Zero-Knowledge Vault isolation: `caregiver_guest` and non-admin users must receive HTTP 403 Forbidden on any attempt to access Vault endpoints or financial records.
- Multi-tenancy safety: Every database query in the request lifecycle must execute with PostgreSQL session variables `app.current_household_id`, `app.current_user_id`, and `app.current_user_role` set.
- All packages must maintain zero TypeScript typecheck errors (`turbo run typecheck`) and 100% green test passes (`turbo run test`).
- Caregiver magic links must be strictly time-bound (expiring within a configurable window, default 8 hours or active shift duration) and cryptographically verifiable with HMAC-SHA256 signatures.

## Review Focus

1. **Caregiver Permission Leak:** A caregiver guest token accessing `/finance/transactions` or `/vault/items` must be rejected with HTTP 403 by middleware before touching the database.
2. **Missing RLS Context Session Leak:** A query executed without setting `app.current_household_id` must fail or return zero rows under PostgreSQL RLS rather than leaking other households' data.
3. **Expired Magic Link / Replay:** An expired caregiver magic link or tampered token signature must fail validation and return HTTP 401 Unauthorized.
4. **Passkey Challenge Replay / Expiration:** Passkey registration/authentication options must store single-use challenges with a TTL (5 minutes) and reject already-used or expired challenges.
5. **Docker Compose Parity:** Service health checks and dependency wait-conditions (`service_healthy`) must ensure the server does not boot before PostgreSQL and Valkey are fully ready.

---

### Task 1: Self-Host Container Infrastructure & Environment Config (`deploy/`)

**Files:**
- Create: `deploy/docker-compose.yml`
- Create: `deploy/docker-compose.dev.yml`
- Create: `deploy/Caddyfile`
- Create: `.env.example`
- Create: `apps/server/Dockerfile`
- Create: `deploy/test/deploy-config.test.ts`

**Interfaces:**
- Consumes: Environment variables defined in `.env.example`
- Produces: Production and local dev container topology for PostgreSQL 17, Valkey 8, MinIO, Caddy, and HomeDash Server.

- [ ] **Step 1: Write the failing deployment config validation test**

Create `deploy/test/deploy-config.test.ts` to verify that `deploy/docker-compose.yml`, `deploy/Caddyfile`, `.env.example`, and `apps/server/Dockerfile` exist, declare all required services (`postgres`, `valkey`, `minio`, `server`, `caddy`), define health checks, and expose correct ports (Caddy 80/443, Dev DB 5432, Dev MinIO 9000/9001).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run deploy/test/deploy-config.test.ts`  
Expected: FAIL (files missing).

- [ ] **Step 3: Implement Docker Compose, Caddyfile, Dockerfile, and .env.example**

- Implement `deploy/docker-compose.yml` with:
  - `postgres`: image `postgres:17-alpine`, healthcheck `pg_isready`, persistent volume `pgdata`.
  - `valkey`: image `valkey/valkey:8-alpine`, healthcheck `valkey-cli ping`, volume `valkeydata`.
  - `minio`: image `minio/minio:RELEASE.2025-02-18T16-25-55Z`, command `server /data --console-address ":9001"`, volume `miniodata`.
  - `server`: build context `.`, dockerfile `apps/server/Dockerfile`, depends_on `postgres` and `valkey` (condition: `service_healthy`).
  - `caddy`: image `caddy:2-alpine`, ports `80:80`, `443:443`, volume `caddydata`, `caddyconfig`.
- Implement `deploy/docker-compose.dev.yml` for local development port mappings.
- Implement `deploy/Caddyfile` with reverse proxy to `server:3000` for `/api/*` and WebSocket upgrade.
- Implement `apps/server/Dockerfile` multi-stage build for the Hono server.
- Implement `.env.example` with documented environment keys.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run deploy/test/deploy-config.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add deploy/ apps/server/Dockerfile .env.example
git commit -m "feat(deploy): add docker-compose stack, caddy reverse proxy, and server dockerfile"
```

---

### Task 2: Database Migration Pipeline & Seeding (`packages/server-schema`)

**Files:**
- Create: `packages/server-schema/src/migrate.ts`
- Create: `packages/server-schema/src/seed.ts`
- Create: `packages/server-schema/drizzle.config.ts`
- Modify: `packages/server-schema/package.json`
- Test: `packages/server-schema/test/migrate.test.ts`

**Interfaces:**
- Consumes: PostgreSQL connection string from `DATABASE_URL`
- Produces: `runMigrations(dbUrl: string): Promise<void>` and `seedDefaultHousehold(db: any): Promise<{ householdId: string; adminUserId: string }>`

- [ ] **Step 1: Write the failing migration and seed test**

Create `packages/server-schema/test/migrate.test.ts` asserting that `migrate.ts` and `seed.ts` export `runMigrations` and `seedDefaultHousehold`, and that `drizzle.config.ts` points to schemas in `./src/schema/*.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @homedash/server-schema exec vitest run test/migrate.test.ts`  
Expected: FAIL (`migrate.ts` not found).

- [ ] **Step 3: Implement drizzle config, migration runner, and seeder**

- Implement `packages/server-schema/drizzle.config.ts` with `dialect: 'postgresql'`, `schema: './src/schema/index.ts'`, `out: './drizzle'`.
- Implement `packages/server-schema/src/migrate.ts` using `drizzle-orm/postgres-js/migrator` and reading `rls.sql` to execute DDL migrations and ensure RLS policies are applied.
- Implement `packages/server-schema/src/seed.ts` creating a default household ("The Family"), enabling all 4 modules, creating an initial admin user with an Argon2id password hash or passkey public key, and creating the household membership.
- Update `package.json` with `"db:migrate": "tsx src/migrate.ts"`, `"db:seed": "tsx src/seed.ts"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @homedash/server-schema exec vitest run test/migrate.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/server-schema/
git commit -m "feat(server-schema): add drizzle migration runner, rls applicator, and seed script"
```

---

### Task 3: Tier 4 `@homedash/server-runtime` Scaffolding & Auth Tokens

**Files:**
- Create: `packages/server-runtime/package.json`
- Create: `packages/server-runtime/tsconfig.json`
- Create: `packages/server-runtime/src/index.ts`
- Create: `packages/server-runtime/src/auth/jwt.ts`
- Create: `packages/server-runtime/src/auth/magic-link.ts`
- Test: `packages/server-runtime/test/jwt.test.ts`
- Test: `packages/server-runtime/test/magic-link.test.ts`

**Interfaces:**
- Consumes: `@homedash/shared` (Result types), `@homedash/protocol` (UserRole)
- Produces:
  - `signSessionJwt(payload: SessionPayload, secret: string): Promise<string>`
  - `verifySessionJwt(token: string, secret: string): Promise<SessionPayload | null>`
  - `generateCaregiverMagicToken(opts: CaregiverTokenOptions, secret: string): Promise<string>`
  - `verifyCaregiverMagicToken(token: string, secret: string): Promise<CaregiverTokenClaims | null>`

- [ ] **Step 1: Write failing tests for JWT and Magic Link**

Create `test/jwt.test.ts` asserting:
1. Valid JWT signs and verifies with correct claims (`userId`, `householdId`, `role`).
2. Expired JWT returns `null` or throws expired error.
3. Tampered JWT signature is rejected.

Create `test/magic-link.test.ts` asserting:
1. Caregiver magic token generates cryptographically secure HMAC-SHA256 signature and URL-safe token.
2. Verified claims contain `householdId`, `patientMemberId`, `validUntil`, and `role: 'caregiver_guest'`.
3. Expired token returns `null`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @homedash/server-runtime exec vitest run`  
Expected: FAIL (package/files do not exist).

- [ ] **Step 3: Scaffold `@homedash/server-runtime` and implement JWT & Magic Link logic**

- Create `packages/server-runtime/package.json` with workspace dependencies on `@homedash/shared`, `@homedash/protocol`, and catalog dependencies (`hono`, `vitest`, `typescript`).
- Implement `src/auth/jwt.ts` using Hono's `hono/jwt` Web Crypto primitives.
- Implement `src/auth/magic-link.ts` using `crypto.subtle` HMAC-SHA256 with URL-safe base64 encoding and expiration validation.
- Export all from `src/index.ts`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @homedash/server-runtime exec vitest run`  
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit**

```bash
git add packages/server-runtime/
git commit -m "feat(server-runtime): scaffold package and implement jwt session and caregiver magic link auth"
```

---

### Task 4: RBAC & PostgreSQL RLS Context Middleware (`packages/server-runtime`)

**Files:**
- Create: `packages/server-runtime/src/middleware/auth.ts`
- Create: `packages/server-runtime/src/middleware/rbac.ts`
- Create: `packages/server-runtime/src/middleware/rls.ts`
- Test: `packages/server-runtime/test/rbac.test.ts`
- Test: `packages/server-runtime/test/rls-middleware.test.ts`

**Interfaces:**
- Consumes: `SessionPayload`, `UserRole`, Hono middleware context (`Context`, `Next`)
- Produces:
  - `authMiddleware(jwtSecret: string): MiddlewareHandler`
  - `requireRole(allowedRoles: UserRole[]): MiddlewareHandler`
  - `blockCaregiverFromSensitiveModules(): MiddlewareHandler`
  - `rlsContextMiddleware(getDbClient: (c: Context) => any): MiddlewareHandler`

- [ ] **Step 1: Write failing tests for RBAC and RLS context middleware**

Create `test/rbac.test.ts` asserting:
1. Unauthenticated request without `Authorization: Bearer <token>` receives 401 Unauthorized.
2. User with role `teen_child` accessing route protected with `requireRole(['admin'])` receives 403 Forbidden.
3. User with role `caregiver_guest` accessing `/finance/*` or `/vault/*` receives 403 Forbidden with `{ error: 'Caregivers cannot access financial ledgers or zero-knowledge vault' }`.
4. User with role `admin` passes through all routes.

Create `test/rls-middleware.test.ts` asserting:
1. `rlsContextMiddleware` executes `SET LOCAL app.current_household_id = $1`, `SET LOCAL app.current_user_id = $2`, `SET LOCAL app.current_user_role = $3` on the database session before route execution.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @homedash/server-runtime exec vitest run test/rbac.test.ts test/rls-middleware.test.ts`  
Expected: FAIL (modules not implemented).

- [ ] **Step 3: Implement Auth, RBAC, and RLS middlewares**

- Implement `src/middleware/auth.ts`: extracts token from `Authorization` header or query string `?token=` (for magic link redirects), verifies token, sets `c.set('session', payload)`.
- Implement `src/middleware/rbac.ts`: checks role against allowed roles list; provides `blockCaregiverFromSensitiveModules()` helper.
- Implement `src/middleware/rls.ts`: executes parameterized `SET LOCAL` statements against the database connection/transaction.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @homedash/server-runtime exec vitest run test/rbac.test.ts test/rls-middleware.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/server-runtime/
git commit -m "feat(server-runtime): implement auth, rbac, and rls context middlewares"
```

---

### Task 5: Authentication & Session REST Endpoints (`apps/server`)

**Files:**
- Create: `apps/server/src/routes/auth.ts`
- Modify: `apps/server/src/app.ts`
- Modify: `apps/server/package.json` (add `@homedash/server-runtime`)
- Test: `apps/server/test/auth.test.ts`

**Interfaces:**
- Consumes: `@homedash/server-runtime` (`signSessionJwt`, `generateCaregiverMagicToken`, `verifyCaregiverMagicToken`, `authMiddleware`, `requireRole`)
- Produces:
  - `POST /api/v1/auth/caregiver/invite`: Admin creates time-bound magic link for caregiver
  - `POST /api/v1/auth/caregiver/consume`: Caregiver exchanges token for temporary session JWT
  - `GET /api/v1/auth/me`: Returns authenticated user identity, household ID, and role
  - `POST /api/v1/auth/passkey/register/options` & `POST /api/v1/auth/passkey/login/options`: Generates WebAuthn challenge

- [ ] **Step 1: Write failing integration tests for Auth endpoints**

Create `apps/server/test/auth.test.ts` asserting:
1. `POST /api/v1/auth/caregiver/invite` by admin generates valid magic link with expiration.
2. `POST /api/v1/auth/caregiver/invite` by `teen_child` returns 403 Forbidden.
3. `POST /api/v1/auth/caregiver/consume` with valid token returns session JWT with `role: 'caregiver_guest'`.
4. `GET /api/v1/auth/me` with Bearer session returns profile and active permissions.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @homedash/server exec vitest run test/auth.test.ts`  
Expected: FAIL (endpoints not found).

- [ ] **Step 3: Implement Auth router and mount in Hono app**

- In `apps/server/package.json`: add `@homedash/server-runtime: "workspace:^"`.
- Implement `apps/server/src/routes/auth.ts` handling caregiver invite, magic link consumption, session profile, and passkey options.
- Mount auth router in `apps/server/src/app.ts` under `/api/v1/auth`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @homedash/server exec vitest run test/auth.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/server/
git commit -m "feat(server): implement caregiver magic link and session profile routes"
```

---

### Task 6: Object Storage & Cache Adapters (`packages/server-runtime`)

**Files:**
- Create: `packages/server-runtime/src/storage/s3.ts`
- Create: `packages/server-runtime/src/cache/valkey.ts`
- Test: `packages/server-runtime/test/storage.test.ts`
- Test: `packages/server-runtime/test/cache.test.ts`

**Interfaces:**
- Consumes: MinIO/S3 endpoint and credentials from env; Valkey Redis connection string
- Produces:
  - `ObjectStorageClient`: `upload(bucket: string, key: string, data: Uint8Array, contentType?: string): Promise<string>`, `getPresignedUrl(bucket: string, key: string, expiresIn?: number): Promise<string>`
  - `CacheClient`: `get(key: string): Promise<string | null>`, `set(key: string, value: string, ttlSeconds?: number): Promise<void>`, `del(key: string): Promise<void>`

- [ ] **Step 1: Write failing tests for S3 and Valkey cache interfaces**

Create `test/storage.test.ts` and `test/cache.test.ts` asserting interface contracts, URI generation, presigning signatures, and mock client operations.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @homedash/server-runtime exec vitest run test/storage.test.ts test/cache.test.ts`  
Expected: FAIL.

- [ ] **Step 3: Implement S3 object storage adapter and Valkey cache client**

- Implement `src/storage/s3.ts`: wraps S3-compatible endpoints (MinIO in self-host, AWS/Cloudflare R2 in cloud) with presigned GET/PUT URLs and bucket initialization.
- Implement `src/cache/valkey.ts`: wraps `ioredis` for Valkey 8 key-value caching, rate-limiting, and ephemeral challenge storage.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @homedash/server-runtime exec vitest run test/storage.test.ts test/cache.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/server-runtime/
git commit -m "feat(server-runtime): add s3 object storage adapter and valkey cache client"
```

---

### Task 7: Whole-Suite Integration, Build & Senior Code Review

**Files:**
- Modify: `docs/superpowers/plans/2026-11-17-phase-2-backend-core-and-auth.md` (track task checkmarks)

- [ ] **Step 1: Run whole-suite tests across all workspace packages**

Run: `pnpm exec turbo run test`  
Expected: All packages pass with 100% green tests.

- [ ] **Step 2: Run whole-suite TypeScript typecheck**

Run: `pnpm exec turbo run typecheck`  
Expected: 0 errors across all workspace packages.

- [ ] **Step 3: Run whole-suite Turborepo build**

Run: `pnpm exec turbo run build`  
Expected: 7/7 packages build cleanly.

- [ ] **Step 4: Dispatch Senior Code Reviewer Subagent**

Dispatch `research` subagent to perform an independent senior code review of all commits on `feat/phase-2-backend-core-and-auth`, auditing security boundaries, RLS context injection, and Docker configuration.

- [ ] **Step 5: Address reviewer findings and finalize Phase 2**

Fix any feedback items, commit, verify tests, and present completion summary.
