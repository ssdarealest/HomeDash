# HomeDash — Family OS

> **An open-core, local-first, privacy-first cross-platform operating system for modern families.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.x-ef4444.svg?logo=turborepo)](https://turbo.build/repo)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![Hono](https://img.shields.io/badge/Hono-API-E36002.svg?logo=hono)](https://hono.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker)](https://www.docker.com/)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPLv3-green.svg)](https://www.gnu.org/licenses/agpl-3.0)

---

## Vision & Philosophy

Modern household management is fragmented across chaotic chat threads, generic note apps, calendars, and spreadsheets. **HomeDash** replaces this fragmented stack with a unified, cohesive, privacy-first **Family Operating System** designed around five foundational pillars:

1. **Local-First & Offline-First (CRDT / HLC)**: Full read/write functionality on local SQLite with zero network connection. Automatic, conflict-free bidirectional synchronization via Hybrid Logical Clocks when connectivity resumes.
2. **Zero-Knowledge Privacy & E2EE**: High-sensitivity household documents (passports, medical histories, wills, insurance policies) are client-side encrypted using AES-256-GCM envelope encryption and Argon2id. The self-hosted server and object storage hold only encrypted blobs.
3. **Emergency Break-Glass Escrow**: Safe custody for vital documents via asymmetric escrow and Shamir Secret Sharing, allowing family members to regain access in critical emergencies without compromising daily zero-knowledge guarantees.
4. **Adaptive Multi-Generational UX**: Custom interfaces tailored to specific household roles:
   - **Children**: Visual chore tokens, gamified allowances, audio feedback.
   - **Teens**: Budgeting, chore tracking, academic checklists.
   - **Adults & Admins**: Full operational dashboard, finances, vault administration.
   - **Seniors**: High-contrast, large-touch interfaces with simplified workflows.
   - **Caregivers & Guests**: Time-bound, HMAC-signed magic links strictly quarantined from sensitive financial and vault modules.
5. **Frictionless Self-Hosting**: 1-click Docker Compose deployment with automated PostgreSQL migrations, Row-Level Security (RLS), Change Data Capture (CDC), MinIO S3 object storage, Valkey caching, and Caddy reverse proxy with automatic TLS.

---

## Monorepo Architecture

HomeDash is engineered as a strictly stratified 6-tier monorepo using **pnpm workspaces** and **Turborepo**. Package dependencies flow strictly **downward** to guarantee zero circular dependencies and modular reusability:

```
┌────────────────────────────────────────────────────────┐
│ Tier 5: Apps                                           │
│ apps/server (Hono Backend) | apps/mobile (Flutter App) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 4: Server Runtime                                 │
│ packages/server-runtime (JWT, Magic Link, RBAC, RLS)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 3: Client Sync Engine                             │
│ packages/sync-engine (HLC, Outbox, SQLite Reconciler)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 2: Schemas & Data Layer                           │
│ packages/server-schema (Postgres/Drizzle/RLS/CDC)      │
│ packages/client-schema (SQLite / Drift DDL)            │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 1: Core Domain Contracts & Security               │
│ packages/protocol (Zod RPC & OpenAPI Specification)    │
│ packages/crypto (AES-256-GCM Envelope & Escrow)        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 0: Foundation Primitives                          │
│ packages/shared (Hybrid Logical Clock, Result Types)   │
└────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```text
HomeDash/
├── apps/
│   ├── server/                  # Tier 5: Hono API server, route handlers, auth
│   └── mobile/                  # Tier 5: Flutter cross-platform client (iOS/Android/Web)
├── packages/
│   ├── shared/                  # Tier 0: HLC, Result<T, E>, functional utilities
│   ├── protocol/                # Tier 1: Zod schemas, OpenAPI generators, sync contracts
│   ├── crypto/                  # Tier 1: Zero-knowledge AES-256-GCM, Argon2id, Escrow
│   ├── client-schema/           # Tier 2: SQLite DDL, local migrations, sync tables
│   ├── server-schema/           # Tier 2: Drizzle ORM, PostgreSQL RLS policies, CDC triggers
│   └── server-runtime/          # Tier 4: Auth tokens, RBAC, RLS middleware, S3, Valkey
├── deploy/
│   ├── docker-compose.yml       # Production self-host orchestration stack
│   ├── docker-compose.dev.yml   # Local dev dependencies (Postgres, Valkey, MinIO)
│   └── Caddyfile                # Caddy reverse proxy with TLS & security headers
├── docs/                        # Architecture specs and superpowers implementation plans
└── turbo.json                   # Turborepo task pipeline configuration
```

---

## Security, Privacy & Compliance

| Security Dimension | Technical Implementation |
|---|---|
| **Data in Transit** | TLS 1.3 enforced via Caddy reverse proxy with HSTS, CSP, and strict headers. |
| **Data at Rest** | PostgreSQL Row-Level Security (`RLS`) parameterized by `app.current_household_id`. |
| **Zero-Knowledge Vault** | Client-side AES-256-GCM envelope encryption with unique data encryption keys (DEK). |
| **Key Derivation** | Argon2id KDF with high memory cost parameters. |
| **Session Security** | Pure Web Crypto JWT tokens signed with SHA-256 / Ed25519; WebAuthn Passkeys. |
| **Caregiver Access** | Time-bound HMAC-SHA256 magic links with constant-time byte verification and single-use revocation cache. |
| **Module Isolation** | Global middleware (`blockCaregiverFromSensitiveModules`) strictly prohibiting guests from finance and vault endpoints. |

---

## Quick Start & Development

### Prerequisites

- **Node.js** >= 20.0.0 (or **Bun** >= 1.1.0)
- **pnpm** >= 10.0.0 (`npm i -g pnpm`)
- **Docker** & **Docker Compose**

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/ssdarealest/HomeDash.git
cd HomeDash

pnpm install
```

### 2. Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Adjust secrets in `.env` as needed (e.g., `JWT_SECRET`, `POSTGRES_PASSWORD`, `S3_SECRET_KEY`).

### 3. Spin Up Infrastructure with Docker

For local development dependencies (PostgreSQL 17, Valkey 8, MinIO S3):

```bash
docker compose -f deploy/docker-compose.dev.yml up -d
```

### 4. Run Database Migrations & Seed Data

```bash
# Run PostgreSQL schema migrations, RLS policies, and CDC triggers
pnpm -F @homedash/server-schema db:migrate

# Seed development household and role test fixtures
pnpm -F @homedash/server-schema db:seed
```

### 5. Start Development Server

```bash
# Start backend server in watch mode
pnpm -F @homedash/server dev

# Or run full monorepo development pipeline
pnpm dev
```

The API server runs on `http://localhost:3000`.
- Health check: `http://localhost:3000/health`
- OpenAPI schema: `http://localhost:3000/api/openapi.json`
- Interactive API documentation: `http://localhost:3000/api/docs`

---

## Testing & Verification

The repository enforces 100% type safety and strict test validation across all packages:

```bash
# Run unit and integration tests across all monorepo packages
pnpm test

# Run TypeScript typechecks across all monorepo packages
pnpm typecheck

# Run test and typecheck together through Turborepo
pnpm turbo run test typecheck
```

---

## Roadmap & Implementation Phases

- [x] **Phase 1: Architecture, 6-Tier Monorepo & Database Schema**
  - Turborepo workspace scaffolding and polyglot Flutter shim
  - SQLite client DDL & PostgreSQL Drizzle schema (14 tables)
  - Zero-knowledge AES-256-GCM envelope encryption & escrow primitives
  - Hybrid Logical Clock (HLC) algorithm & Zod RPC protocol contracts
- [x] **Phase 2: Backend Core, Auth & Self-Host Infrastructure**
  - Docker Compose production stack (PostgreSQL 17, Valkey 8, MinIO, Caddy)
  - Programmatic migration runner with raw RLS policies & CDC triggers
  - Web Crypto JWT sessions & time-bound Caregiver Magic Links
  - RBAC & RLS context middlewares with sensitive route isolation
  - Web Crypto AWS SigV4 S3 storage adapter & Valkey cache client
- [x] **Phase 3: Bidirectional Sync Engine & Real-Time Protocol**
  - HLC-based conflict resolution reconciler with LWW tie-breaking
  - Outbox transaction pipeline with CDC log streaming
  - Server SSE invalidation stream and Valkey pub/sub fanout
- [x] **Phase 4: Flutter Cross-Platform Client Application**
  - Flutter cross-platform mobile client (`apps/mobile`) with Material 3 & Senior Mode tokens (1.4x scale, >=48dp touch targets)
  - Reactive Drift SQLite local database with collaborative tables, integer sync states, and DAOs
  - Client-side Hybrid Logical Clock (HLC) and deterministic conflict reconciler
  - Exponential-backoff SSE real-time sync coordinator with socket lifecycle protection
  - Client-side Zero-Knowledge AES-256-GCM / XChaCha20-Poly1305 envelope encryption & PBKDF2
  - Multi-role session management strictly quarantining Caregiver Guests from `/finance` and `/vault` (navigation and dashboard)
  - Glanceable spatial Bento dashboard, one-handed quick-log sheets, and Senior Mode 2-tab SOS emergency view
  - Android Companion Notification Listener platform channel (Kotlin EventChannel/MethodChannel)
- [x] **Phase 5: Core Functional Modules**
  - Daily Ops: Recurring chore cadence with admin verification & reward allowance crediting, interactive grocery checklist with atomic checkout-to-expense ledger pipeline, and health-aware Meal Planner with automated allergy checking
  - Family Health Hub: Scheduled medication log with photo verification, dynamic 30m missed-dose caregiver escalation worker, caregiver shift management with peer swap approvals, PHR Vitals logging & trends (BP, glucose, SpO2, temp, HR), and medical allergy registry
  - Family Finance: Multi-account management (shared checking, personal allowance, sinking funds), automated utility bill spike detection (>1.25x rolling 3mo avg), and Android Companion push notification ingestion webhook with HMAC-SHA256 signature verification & deduplication
  - Zero-Knowledge Vault Break-Glass Escrow: Emergency break-glass flow with 48h mandatory cooldown, instant admin token veto, lazy status evaluation, and emergency escrow share retrieval without server plaintext decryption
  - Omnichannel Notification Bridge: Bot webhook integration with compact 64-byte action tokens (`t:<id>:taken`, `t:<id>:snooze`) and replay prevention
- [x] **Phase 6: Multi-Device P2P Sync & Production Hardening**
  - Offline-first encrypted peer discovery with HMAC-SHA256 signature verification and heartbeat expiration (`PeerDiscoveryManager`)
  - Mutual challenge-response P2P handshake and ephemeral session key derivation (`PeerSessionCoordinator`)
  - Direct local network P2P delta exchange and conflict-free HLC reconciler (`P2PSyncCoordinator`)
  - Desktop & tablet responsive Bento Grid workspace (1 to 4 adaptive columns) with toggleable Glassmorphic and Solid M3 theme treatments (`BentoGridView`, `GlassmorphicCard`, `SystemSyncTelemetryCard`)
  - Production deployment validation with container health checks (`postgres`, `valkey`, `minio`, `server`, `caddy`)
  - 1,000-mutation HLC benchmark (<100ms) and comprehensive automated security audit confirming strict caregiver quarantine, zero plaintext vault leaks, and multi-tenant isolation

---

## License

This project is open-source under the **AGPLv3 (GNU Affero General Public License v3.0)**. See the `LICENSE` file for details.
