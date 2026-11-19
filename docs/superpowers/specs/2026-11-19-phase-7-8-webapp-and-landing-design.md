# Phase 7 & Phase 8 Design Specification: Webapp Dashboard & Docs/Landing Website

## 1. Intent & Purpose
This document specifies the design and implementation for the web and public-facing extensions of **HomeDash (Family OS)**:
1. **Phase 7: Webapp & Desktop Dashboard (`apps/web`)**: A web client providing family members and administrators with a spatial, desktop-class operating system dashboard inspired by Figma's spatial workspace layout (sidebar + utility header + quick command bar + tabbed filter bar + modular card grid).
2. **Phase 8: Docs & Landing Website (`apps/landing`)**: A modern public landing and documentation site combining the deep-tech, modular Bento aesthetics of **MindStudio** with the developer-first, tactile, privacy-centric narrative and self-host ethos of **Immurok**.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Webapp Workspace (`apps/web`)**:
  - Implemented with React 19, TypeScript, Vite, Tailwind CSS, and Lucide icons.
  - Spatial shell replicating the ergonomics of the Figma dashboard layout:
    - Left collapsible navigation sidebar with household profile, module navigation, household members directory, and self-hosted node telemetry badge.
    - Top utility header with active section breadcrumb and quick action pill buttons (`+ Expense`, `+ Dose`, `+ Grocery`, `Emergency Break-Glass`).
    - Quick Command Hero bar for rapid natural language input dispatch.
    - Tabbed filter bar supporting view filtering (`Overview`, `Active Operations`, `Caregiver Schedule`, `Vault Security`), member selection, and Bento vs Table layout toggles.
    - Asymmetric Bento Grid hosting modular live cards: Household Cash Flow, Medication Timeline, Daily Household Ops (Groceries & Chores), Emergency Break-Glass Countdown, and LAN P2P Sync Telemetry.
  - Strict Caregiver Quarantine: Dynamic role-based filtering ensures caregiver guests never render financial balances, accounts, or vault unlock triggers.
  - Dual Surface System: Seamless toggle between translucent Glassmorphism (`backdrop-filter: blur(16px)`) and solid Material 3 high-contrast containers.
  - Real-time connectivity: Authenticated REST client and Server-Sent Events (SSE) stream (`/api/v1/realtime/stream`) to reflect live household updates.
- **Docs & Landing Website (`apps/landing`)**:
  - Clean, high-performance static/SSR site with deep-tech dark mode palette, electric accent highlights, and geometric sans-serif typography.
  - Immurok-style privacy-first narrative: "Zero cloud lock-in. No telemetry. 100% Local-First", featuring a copyable single-command self-hosting terminal block (`docker compose up -d`).
  - MindStudio-style modular Bento feature grid illustrating the 4 core pillars: Family Finance & Ingestion, Multi-Gen Care & Medication Hub, Zero-Knowledge Vault with Break-Glass, and P2P Sync.
  - Interactive technical documentation portal covering Docker self-hosting, configuration environment variables, client-side cryptography specifications, and OpenAPI reference.
  - Platform compatibility matrix (iOS, Android, macOS, Windows, Linux, Web).

### Non-Goals
- No third-party trackers, external advertising pixels, or telemetry services.
- No standalone web IndexedDB offline replication engine for this phase (the webapp connects directly via authenticated REST and real-time SSE to the local/self-hosted node).

### Anti-Goals
- **Strictly ZERO EMOJIS** across all code, UI components, icons, commit messages, and documentation. Lucide vector icons and semantic typography must be used exclusively.
- Never bypass backend RBAC or caregiver guest quarantine boundaries.

---

## 3. Approaches Considered & Decision
- **Approach 1: Separate Applications (`apps/web` + `apps/landing`) (Selected)**
  - `apps/web`: Dedicated client SPA for authenticated household members and caregivers.
  - `apps/landing`: Dedicated public landing and documentation site optimized for fast loading and technical documentation.
  - *Rationale*: Clean separation of application state from public static content, independent build boundaries, and zero leak of authenticated application logic into public web pages.
- **Approach 2: Unified Web Application (`apps/web`) (Rejected)**
  - Merged public landing, documentation, and authenticated app in one project.
  - *Rationale*: Unnecessary coupling of static SEO content with stateful real-time application bundles.

---

## 4. Architecture & Component Hierarchy

### Monorepo Dependency Flow
```text
Tier 1: packages/shared, packages/crypto
Tier 2: packages/protocol
Tier 3: packages/server-schema, packages/client-schema
Tier 4: packages/server-runtime, packages/sync-engine
Tier 5: apps/server
Tier 6: apps/mobile, apps/web, apps/landing
```
Both `apps/web` and `apps/landing` occupy Tier 6, consuming lower-tier packages (`@homedash/protocol`, `@homedash/crypto`, `@homedash/shared`) with downward-only dependency discipline.

### Deployment & Serving Topology
- **Development Mode**:
  - `apps/web`: Runs on Vite at `http://localhost:5173` (authenticated household dashboard).
  - `apps/landing`: Runs on Vite at `http://localhost:5174` (public landing and documentation site).
  - `apps/server`: Runs on port 3000 at `http://localhost:3000`.
- **Production / Self-Hosted Mode (`docker compose up -d`)**:
  - `apps/web`: Built into static SPA distribution, served at root `/` via Caddy reverse proxy or static file handler.
  - `apps/server`: Proxied under `/api/*`, `/realtime/stream`, `/ws`, `/health`, and `/openapi.json`.
  - `apps/landing`: Packaged as a high-performance static site (SSG), ready for zero-cost deployment on GitHub Pages, Cloudflare Pages, or static Caddy host (`/docs`).

### Server API Augmentation for Web Clients
To ensure zero-trust RBAC compliance and live browser telemetry:
1. `POST /api/v1/auth/session`: Issues a valid signed HS256 JWT for requested household roles (`admin`, `senior`, `teen_child`, `child`, `caregiver_guest`) during local self-hosted use and testing.
2. `GET /api/v1/sync/telemetry`: Exposes node health status, HLC timestamp, and active peer telemetry to authenticated web clients.
3. `/api/v1/realtime/stream`: Standard SSE stream for live household sync events.

### Webapp Dashboard Architecture (`apps/web`)
- **State Management & Contexts**:
  - `SessionContext`: Holds authentication token, current user profile, role (`admin`, `senior`, `teen_child`, `child`, `caregiver_guest`), and household ID. Communicates with `POST /api/v1/auth/session` for role switching.
  - `ThemeContext`: Toggles dark/light mode and Glassmorphic translucent styling (`backdrop-filter: blur(16px)`) vs Solid Material 3 high-contrast surface containers.
  - `SyncTelemetryContext`: Tracks live SSE connection state (`/api/v1/realtime/stream`), discovered LAN peers from `/api/v1/sync/telemetry`, and local HLC clock counters.
- **Component Anatomy (Figma Spatial Workspace)**:
  - `Sidebar`:
    - Household selector & avatar.
    - Global search & quick switcher.
    - Navigation items: Dashboard (All), Daily Ops, Health Hub, Finance, Vault, P2P Sync, Settings. Clicking a navigation item filters and focuses the spatial workspace on that domain.
    - Family Members roster with role badges.
    - Self-Hosted node health badge (`online` / `syncing`).
  - `Header`:
    - Workspace breadcrumb.
    - Quick Action Pills (`+ Expense`, `+ Dose`, `+ Grocery`, `Break-Glass`). Clicking opens a modal form for immediate task dispatch to backend REST endpoints.
    - User profile dropdown with live role switcher.
  - `HeroCommandBar`:
    - Figma-inspired natural language quick-input field ("What needs doing today?") with instant categorization buttons for Grocery, Chore, Medication, and Expense.
  - `FilterTabBar`:
    - Tab triggers (`Overview`, `Active Operations`, `Caregiver Schedule`, `Vault Security`).
    - Member filter dropdown.
    - Bento Grid / Compact Table view toggle.
  - `BentoGrid`:
    - `CashFlowCard` (strictly quarantined for caregivers).
    - `MedicationTimelineCard` (timeline view with dose logging).
    - `DailyOpsCard` (grocery item checkboxes and pending chores).
    - `BreakGlassStatusCard` (emergency countdown, admin veto, and client-side unsealing via master recovery passphrase; quarantined for caregivers).
    - `SystemSyncTelemetryCard` (live SSE status, node HLC counter, and LAN peer list).

### Landing & Documentation Architecture (`apps/landing`)
- **Components**:
  - `Navbar`: Brand logo, navigation links (Features, Architecture, Self-Host, Docs, GitHub), and "Open Webapp" CTA button.
  - `HeroSection`: High-contrast headline, subtitle emphasizing local-first privacy ("Zero cloud lock-in. No telemetry. 100% Local-First"), one-click terminal copy snippet (`docker compose up -d`), and primary CTAs.
  - `BentoFeatureSection`: MindStudio-inspired asymmetric 4-tile grid detailing Finance & Ingestion, Health Hub & Medication, Zero-Knowledge Vault with Break-Glass, and Local-First P2P sync.
  - `ArchitectureSection`: Interactive 6-tier monorepo overview and cryptographic breakdown (Argon2id, XChaCha20-Poly1305, Shamir Secret Sharing).
  - `CompatibilityMatrix`: Supported platforms table (Docker, Linux, macOS, Windows, iOS, Android, Web).
  - `DocumentationPortal`: Structured technical Markdown guides:
    - Quickstart & Docker deployment.
    - Environment variables reference.
    - Cryptographic key management & break-glass protocol.
    - REST & SSE API reference.
  - `Footer`: Open-source copyright, MIT license, links to repositories, and zero-telemetry statement.

---

## 5. Security & Caregiver Quarantine Enforcement
1. **Client-Side Gating**: In `apps/web`, all financial cards and emergency vault widgets check `user.role !== 'caregiver_guest'`. If `isCaregiver` is true, those cards are omitted from the layout.
2. **API Parity**: Any direct API request triggered from `apps/web` relies on `apps/server` RBAC middleware (`roleGuard(['admin', 'member'])`), returning HTTP 403 if a caregiver token is presented.
3. **Zero Plaintext Key Storage**: Web vault interactions require client-side decryption using the household master recovery passphrase; no keys are sent in plaintext to the server.

---

## 6. Verification & Test Plan
1. **Component Tests**:
   - Webapp sidebar collapse and route navigation.
   - Quick command input dispatch and category selection.
   - Glassmorphic style token resolution vs Solid M3 fallback.
   - Caregiver quarantine filter: verifying `CashFlowCard` and `BreakGlassStatusCard` are absent when logged in as a caregiver guest.
2. **Landing & Docs Tests**:
   - Terminal copy-to-clipboard functionality test.
   - Feature card rendering and responsiveness.
   - Documentation navigation and article rendering.
3. **Monorepo Build Integration**:
   - `pnpm exec turbo run build test typecheck` passes across all packages including `apps/web` and `apps/landing`.
