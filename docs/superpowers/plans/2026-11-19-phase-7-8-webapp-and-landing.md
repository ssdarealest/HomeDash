# Phase 7 & Phase 8: Webapp Dashboard & Docs/Landing Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the spatial desktop-class webapp dashboard (`apps/web`) inspired by Figma's spatial workspace layout, and the public landing & documentation site (`apps/landing`) combining MindStudio's modular Bento aesthetics with Immurok's tactile, privacy-centric self-hosting narrative.

**Architecture:** Approach 1 (Separate Applications): `apps/web` as an authenticated React 19 SPA consuming Tier 5 `apps/server` REST APIs and SSE streams with strict caregiver role quarantining, and `apps/landing` as a static public showcase with an interactive technical documentation portal and one-command Docker deployment terminal snippet.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React icons, Vitest, `@noble/hashes`, `@noble/ciphers`, Turbo.

**Spec:** `docs/superpowers/specs/2026-11-19-phase-7-8-webapp-and-landing-design.md`

## Global Constraints

- Monorepo hierarchy discipline: `apps/web` and `apps/landing` belong to Tier 6; dependencies must flow strictly downward (`@homedash/protocol`, `@homedash/crypto`, `@homedash/shared`).
- Strictly ZERO EMOJIS across all code, UI components, icons, commit messages, and documentation. Use Lucide icons and clean semantic typography exclusively.
- Strict Caregiver Quarantine: Caregiver guests (`role === 'caregiver_guest'`) are prohibited from viewing financial balances, transaction lists, sinking funds, or vault unlock triggers in both UI state and API requests.
- Zero Plaintext Key Storage: Client-side cryptographic operations (Argon2id KEK derivation and XChaCha20-Poly1305 payload unsealing) execute locally in the browser when unsealing approved emergency break-glass items; plaintext keys are never sent to the server.
- Real-time SSE stream connects to `/api/v1/realtime/stream` (with token auth); telemetry consumes `/api/v1/sync/telemetry`.

## Review Focus

1. Caregiver quarantine bypass attempt: User switches role to `caregiver_guest` — verify `CashFlowCard` and `BreakGlassStatusCard` are completely omitted from the DOM, and API calls to `/api/v1/finance/*` return 403 Forbidden.
2. SSE stream reconnection & offline state: Disconnecting the backend server updates the `SystemSyncTelemetryCard` badge to `reconnecting` or `offline` without throwing unhandled exceptions.
3. Master passphrase emergency unsealing: Entering an incorrect passphrase produces an explicit cryptographic MAC verification failure rather than unhandled promise rejection or crashing.
4. Terminal copy-to-clipboard in `apps/landing`: Clicking the copy button copies `docker compose up -d` to the clipboard and triggers a brief visual checkmark/success state.
5. Filter tab synchronization: Toggling between `Overview`, `Active Operations`, `Caregiver Schedule`, and `Vault Security` smoothly focuses the corresponding cards without desynchronizing the sidebar active selection.

---

### Task 1: Backend Session & Telemetry Endpoints (`apps/server`)

**Files:**
- Modify: `apps/server/src/routes/auth.ts`
- Modify: `apps/server/src/routes/sync.ts`
- Test: `apps/server/test/auth.test.ts`
- Test: `apps/server/test/sync.test.ts`

**Interfaces:**
- Consumes: `signSessionJwt` from `@homedash/server-runtime`
- Produces: `POST /api/v1/auth/session` returning `{ sessionToken: string, role: string, householdId: string, userId: string }`
- Produces: `GET /api/v1/sync/telemetry` returning `{ householdId: string, status: string, hlcTimestamp: string, connectedPeers: number, peerList: Array<{ peerId: string, deviceName: string, address: string, lastSeen: number }> }`

- [ ] **Step 1: Write the failing tests for `/api/v1/auth/session` and `/api/v1/sync/telemetry`**

Add tests to `apps/server/test/auth.test.ts` verifying `POST /api/v1/auth/session` returns a valid JWT with the requested role (`admin`, `caregiver_guest`), and to `apps/server/test/sync.test.ts` verifying `GET /api/v1/sync/telemetry` returns the node sync status and peer telemetry.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @homedash/server exec vitest run test/auth.test.ts test/sync.test.ts`
Expected: FAIL with 404 Not Found on the new endpoints.

- [ ] **Step 3: Implement `POST /api/v1/auth/session` in `apps/server/src/routes/auth.ts` and `GET /api/v1/sync/telemetry` in `apps/server/src/routes/sync.ts`**

In `auth.ts`, validate `{ role, householdId, userId }` using Zod and issue a session JWT signed with `opts.jwtSecret`.
In `sync.ts`, guard with `authMiddleware(jwtSecret)` and return node telemetry with live HLC timestamp and connected peer metadata.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @homedash/server exec vitest run test/auth.test.ts test/sync.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/routes/auth.ts apps/server/src/routes/sync.ts apps/server/test/auth.test.ts apps/server/test/sync.test.ts
git commit -m "feat(server): add session minting and sync telemetry endpoints"
```

---

### Task 2: Scaffold `apps/web` Workspace & Context Providers

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/index.css`
- Create: `apps/web/src/context/SessionContext.tsx`
- Create: `apps/web/src/context/ThemeContext.tsx`
- Create: `apps/web/src/context/SyncTelemetryContext.tsx`
- Test: `apps/web/src/context/SessionContext.test.tsx`

**Interfaces:**
- Consumes: `@homedash/protocol`, `@homedash/crypto`
- Produces:
  - `useSession(): { session: SessionState, switchRole: (role: UserRole) => Promise<void>, logout: () => void }`
  - `useTheme(): { theme: 'dark' | 'light', surface: 'glass' | 'solid', toggleTheme: () => void, toggleSurface: () => void }`
  - `useSyncTelemetry(): { status: 'connected' | 'reconnecting' | 'offline', hlc: string, peers: DiscoveredPeer[], refresh: () => Promise<void> }`

- [ ] **Step 1: Write the failing test for `SessionContext`**

Create `apps/web/src/context/SessionContext.test.tsx` verifying default `admin` role session state, role switching to `caregiver_guest`, and token management.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @homedash/web exec vitest run src/context/SessionContext.test.tsx`
Expected: FAIL (file or package not found)

- [ ] **Step 3: Scaffold `apps/web` and implement context providers**

1. Create `package.json` with dependencies: `react`, `react-dom`, `lucide-react`, `@homedash/protocol`, `@homedash/crypto`, `clsx`, `tailwind-merge`. DevDependencies: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `vitest`, `happy-dom`, `@testing-library/react`.
2. Configure `vite.config.ts` and `tailwind.config.js` with Glassmorphism and Material 3 surface utility tokens.
3. Implement `SessionContext.tsx` with role switching (calling `/api/v1/auth/session` or local fallback).
4. Implement `ThemeContext.tsx` managing `glass` vs `solid` surface and `dark` vs `light` mode.
5. Implement `SyncTelemetryContext.tsx` connecting to `/api/v1/realtime/stream` (SSE) and `/api/v1/sync/telemetry`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @homedash/web exec vitest run src/context/SessionContext.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat(web): scaffold apps/web workspace and context providers"
```

---

### Task 3: Figma-Inspired Spatial Navigation Shell (`apps/web`)

**Files:**
- Create: `apps/web/src/components/layout/AppShell.tsx`
- Create: `apps/web/src/components/layout/Sidebar.tsx`
- Create: `apps/web/src/components/layout/TopUtilityHeader.tsx`
- Create: `apps/web/src/components/layout/HeroCommandBar.tsx`
- Create: `apps/web/src/components/layout/FilterTabBar.tsx`
- Test: `apps/web/src/components/layout/AppShell.test.tsx`

**Interfaces:**
- Consumes: `useSession`, `useTheme`, `useSyncTelemetry`
- Produces:
  - `Sidebar`: Collapsible sidebar with Household switcher, nav items (`Dashboard`, `Daily Ops`, `Health Hub`, `Finance`, `Vault`, `P2P Sync`, `Settings`), member roster, and node badge.
  - `TopUtilityHeader`: Breadcrumb, Quick Action pills (`+ Expense`, `+ Dose`, `+ Grocery`, `Break-Glass`), user profile dropdown with role switcher.
  - `HeroCommandBar`: Natural language prompt dispatcher with category quick-pills.
  - `FilterTabBar`: View tab controls (`Overview`, `Active Operations`, `Caregiver Schedule`, `Vault Security`), member filter dropdown, Bento/Table layout switch.

- [ ] **Step 1: Write the failing tests for layout components**

Create `apps/web/src/components/layout/AppShell.test.tsx` testing sidebar collapse toggle, active route selection, role switcher invocation, and category pill selection in the hero command bar.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @homedash/web exec vitest run src/components/layout/AppShell.test.tsx`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement spatial layout components**

1. Build `Sidebar.tsx` supporting collapsed/expanded states, Lucide vector icons (`LayoutDashboard`, `CheckSquare`, `HeartPulse`, `Wallet`, `ShieldAlert`, `Radio`, `Settings`, `Users`), member roster badges, and node status indicator.
2. Build `TopUtilityHeader.tsx` with breadcrumb navigation, quick action pill buttons with subtle neon accents, and role switcher dropdown.
3. Build `HeroCommandBar.tsx` featuring Figma-style "What needs doing today?" prompt input with instant category chips (`Grocery`, `Chore`, `Medication`, `Expense`).
4. Build `FilterTabBar.tsx` with tab controls and Bento vs Table view toggle.
5. Assemble inside `AppShell.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @homedash/web exec vitest run src/components/layout/AppShell.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout
git commit -m "feat(web): implement figma-inspired spatial layout shell"
```

---

### Task 4: Modular Bento Domain Cards & Caregiver Quarantine (`apps/web`)

**Files:**
- Create: `apps/web/src/components/cards/CashFlowCard.tsx`
- Create: `apps/web/src/components/cards/MedicationTimelineCard.tsx`
- Create: `apps/web/src/components/cards/DailyOpsCard.tsx`
- Create: `apps/web/src/components/cards/BreakGlassStatusCard.tsx`
- Create: `apps/web/src/components/cards/SystemSyncTelemetryCard.tsx`
- Create: `apps/web/src/components/bento/BentoGrid.tsx`
- Test: `apps/web/src/components/bento/BentoGrid.test.tsx`

**Interfaces:**
- Consumes: `useSession`, `useTheme`, `useSyncTelemetry`
- Produces:
  - `BentoGrid`: Dynamically renders domain cards; strictly quarantines `CashFlowCard` and `BreakGlassStatusCard` when `session.role === 'caregiver_guest'`.
  - Live domain cards with Glassmorphic styling, interactive checkboxes, dose logging, and countdown timers.

- [ ] **Step 1: Write the failing tests for BentoGrid and Caregiver Quarantine**

Create `apps/web/src/components/bento/BentoGrid.test.tsx` verifying:
1. When logged in as `admin`, all 5 domain cards (`CashFlowCard`, `MedicationTimelineCard`, `DailyOpsCard`, `BreakGlassStatusCard`, `SystemSyncTelemetryCard`) are rendered.
2. When logged in as `caregiver_guest`, `CashFlowCard` and `BreakGlassStatusCard` are strictly absent from the DOM.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @homedash/web exec vitest run src/components/bento/BentoGrid.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement domain cards and `BentoGrid.tsx`**

1. `CashFlowCard`: Monthly income vs expense summary, account balances, and sinking fund progress bar.
2. `MedicationTimelineCard`: Timeline of scheduled doses, adherence badges, and "Log Dose" actions.
3. `DailyOpsCard`: Grocery shopping checklist with toggleable items and pending chore cards with allowance points.
4. `BreakGlassStatusCard`: Emergency cooldown countdown timer, veto trigger button for admin, and unseal trigger.
5. `SystemSyncTelemetryCard`: Real-time SSE connection health, HLC logical clock, and peer discovery list.
6. `BentoGrid`: Asymmetric grid layout with glassmorphic cards and `session.role !== 'caregiver_guest'` gating.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @homedash/web exec vitest run src/components/bento/BentoGrid.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/cards apps/web/src/components/bento
git commit -m "feat(web): implement modular bento cards and caregiver quarantine"
```

---

### Task 5: Quick Action Dialogs & Client-Side Passphrase Unsealing (`apps/web`)

**Files:**
- Create: `apps/web/src/components/modals/ExpenseModal.tsx`
- Create: `apps/web/src/components/modals/DoseModal.tsx`
- Create: `apps/web/src/components/modals/GroceryModal.tsx`
- Create: `apps/web/src/components/modals/BreakGlassModal.tsx`
- Create: `apps/web/src/components/modals/UnsealVaultModal.tsx`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/components/modals/Modals.test.tsx`

**Interfaces:**
- Consumes: `@homedash/crypto` (`derivePersonalKek`, `unsealVaultItem`), `useSession`
- Produces:
  - Interactive modals triggered from Header Quick Pills, Hero Command Bar, or Break-Glass cards.
  - Zero plaintext key leakage: `UnsealVaultModal` takes master passphrase, derives KEK in-browser via Argon2id, and unseals emergency payloads.

- [ ] **Step 1: Write the failing tests for modal workflows and client decryption**

Create `apps/web/src/components/modals/Modals.test.tsx` verifying:
1. Modal open/close bindings.
2. In-browser decryption using `derivePersonalKek` and `unsealVaultItem` with test vectors.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @homedash/web exec vitest run src/components/modals/Modals.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement action modals and client-side unsealing**

1. Implement `ExpenseModal.tsx` (amount in cents, category, notes, account selector).
2. Implement `DoseModal.tsx` (medication selector, dosage, notes).
3. Implement `GroceryModal.tsx` (item name, quantity, category).
4. Implement `BreakGlassModal.tsx` (emergency declaration and confirmation).
5. Implement `UnsealVaultModal.tsx` (passphrase input, Argon2id derivation, XChaCha20-Poly1305 payload decryption with clear error display on MAC mismatch).
6. Connect all modals into `App.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @homedash/web exec vitest run src/components/modals/Modals.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/modals apps/web/src/App.tsx
git commit -m "feat(web): add quick action modals and client-side vault unsealing"
```

---

### Task 6: Scaffold `apps/landing` Workspace

**Files:**
- Create: `apps/landing/package.json`
- Create: `apps/landing/tsconfig.json`
- Create: `apps/landing/vite.config.ts`
- Create: `apps/landing/index.html`
- Create: `apps/landing/src/main.tsx`
- Create: `apps/landing/src/index.css`
- Test: `apps/landing/test/scaffold.test.ts`

**Interfaces:**
- Consumes: `@homedash/protocol`
- Produces: Standalone public landing and documentation site workspace running on Vite (port 5174 in dev).

- [ ] **Step 1: Write the failing test for `apps/landing`**

Create `apps/landing/test/scaffold.test.ts` verifying package configuration and exported route entry points.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @homedash/landing exec vitest run test/scaffold.test.ts`
Expected: FAIL

- [ ] **Step 3: Scaffold `apps/landing` project**

1. Create `package.json` with `react`, `react-dom`, `lucide-react`, `clsx`, `tailwind-merge`. DevDependencies: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `autoprefixer`, `postcss`, `vitest`, `happy-dom`.
2. Configure `vite.config.ts` (server port 5174) and `tailwind.config.js` with deep-tech dark palette (`#08090C`, `#0D1117`, `#161B22`, `#58A6FF`, `#39D353`).
3. Set up `index.html` with title "HomeDash - Local-First Family Operating System" and metadata.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @homedash/landing exec vitest run test/scaffold.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/landing
git commit -m "feat(landing): scaffold apps/landing workspace"
```

---

### Task 7: MindStudio & Immurok Aesthetic Landing Page (`apps/landing`)

**Files:**
- Create: `apps/landing/src/components/Navbar.tsx`
- Create: `apps/landing/src/components/HeroSection.tsx`
- Create: `apps/landing/src/components/BentoFeatureSection.tsx`
- Create: `apps/landing/src/components/ArchitectureSection.tsx`
- Create: `apps/landing/src/components/CompatibilityMatrix.tsx`
- Create: `apps/landing/src/components/Footer.tsx`
- Create: `apps/landing/src/pages/LandingPage.tsx`
- Test: `apps/landing/src/components/LandingComponents.test.tsx`

**Interfaces:**
- Produces:
  - `HeroSection`: High-impact headline, Immurok-style privacy narrative, copyable `docker compose up -d` terminal block with copy feedback.
  - `BentoFeatureSection`: MindStudio-style modular 4-tile grid (Finance & Ingestion, Multi-Gen Care & Health, Zero-Knowledge Vault, Local-First P2P Sync).
  - `ArchitectureSection`: 6-tier monorepo architecture diagram and cryptographic breakdown.
  - `CompatibilityMatrix`: Cross-platform support grid (Docker, Linux, macOS, Windows, iOS, Android, Web).

- [ ] **Step 1: Write the failing tests for landing page components**

Create `apps/landing/src/components/LandingComponents.test.tsx` verifying terminal block copy button behavior, Bento feature descriptions, and navigation link targets.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @homedash/landing exec vitest run src/components/LandingComponents.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement landing page sections**

1. `Navbar.tsx`: Logo, links to `#features`, `#architecture`, `#self-host`, `#docs`, and "Open Webapp" CTA pill.
2. `HeroSection.tsx`: Headline "The Sovereign Operating System for Modern Families", copyable single-line terminal command `docker compose up -d` with click-to-copy handler, and secondary GitHub CTA.
3. `BentoFeatureSection.tsx`: 4 deep-tech cards with Lucide icons (`Wallet`, `HeartPulse`, `ShieldAlert`, `Network`) and metric highlights.
4. `ArchitectureSection.tsx`: Visual 6-tier monorepo diagram highlighting strict downward dependencies and cryptographic primitives (Argon2id, XChaCha20-Poly1305, Shamir Secret Sharing).
5. `CompatibilityMatrix.tsx`: Clean tabular platform matrix.
6. `Footer.tsx`: Zero-telemetry declaration, open-source license, and community links.
7. Combine in `LandingPage.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @homedash/landing exec vitest run src/components/LandingComponents.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/landing/src/components apps/landing/src/pages
git commit -m "feat(landing): implement mindstudio and immurok aesthetic landing page"
```

---

### Task 8: Technical Documentation Portal (`apps/landing`)

**Files:**
- Create: `apps/landing/src/docs/quickstart.ts`
- Create: `apps/landing/src/docs/environment-variables.ts`
- Create: `apps/landing/src/docs/cryptography.ts`
- Create: `apps/landing/src/docs/api-reference.ts`
- Create: `apps/landing/src/components/DocumentationPortal.tsx`
- Create: `apps/landing/src/pages/DocsPage.tsx`
- Modify: `apps/landing/src/App.tsx`
- Test: `apps/landing/src/components/DocumentationPortal.test.tsx`

**Interfaces:**
- Produces: Interactive technical documentation portal with article switching, syntax highlighting, and table of contents.

- [ ] **Step 1: Write the failing tests for documentation portal**

Create `apps/landing/src/components/DocumentationPortal.test.tsx` verifying article navigation, code snippet rendering, and search filter.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @homedash/landing exec vitest run src/components/DocumentationPortal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement documentation articles and portal viewer**

1. Create `quickstart.ts`: Docker compose setup, container bootstrapping, reverse proxy routing, and initial household setup.
2. Create `environment-variables.ts`: Complete table of configuration flags (`POSTGRES_*`, `VALKEY_*`, `MINIO_*`, `JWT_SECRET`, `WEBAUTHN_*`).
3. Create `cryptography.ts`: Mathematical & architectural breakdown of envelope encryption, KEK derivation parameters (64MB Argon2id), and Shamir Secret Sharing break-glass escrow.
4. Create `api-reference.ts`: OpenAPI endpoints reference for Auth, Sync, Realtime SSE, Finance, Health, Daily Ops, and Break-Glass.
5. Create `DocumentationPortal.tsx` with sidebar navigation, search bar, and article renderer.
6. Connect `DocsPage.tsx` and route switching in `App.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @homedash/landing exec vitest run src/components/DocumentationPortal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/landing/src/docs apps/landing/src/components/DocumentationPortal.tsx apps/landing/src/pages/DocsPage.tsx apps/landing/src/App.tsx
git commit -m "feat(landing): implement technical documentation portal"
```

---

### Task 9: Monorepo Build Integration, Caddy Routing & Full Verification

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `deploy/Caddyfile`
- Modify: `README.md`
- Test: Full monorepo build, test, and typecheck

**Interfaces:**
- Consumes: All 11 packages and applications across Tiers 1–6
- Produces: Complete end-to-end verified build across the entire HomeDash monorepo.

- [ ] **Step 1: Update workspace and Caddy routing**

Ensure `pnpm-workspace.yaml` discovers `apps/web` and `apps/landing`. Update `deploy/Caddyfile` to support web client static serving and API reverse proxying.

- [ ] **Step 2: Run full monorepo typecheck**

Run: `pnpm exec turbo run typecheck`
Expected: PASS across all packages.

- [ ] **Step 3: Run full monorepo test suite**

Run: `pnpm exec turbo run test`
Expected: PASS across all packages.

- [ ] **Step 4: Run full monorepo build**

Run: `pnpm exec turbo run build`
Expected: PASS across all packages (`dist/` generated for all packages and web apps).

- [ ] **Step 5: Update project documentation & Commit**

Update `README.md` and task tracking artifact with Phase 7 & Phase 8 completion details.
Commit with clear semantic message.

```bash
git add pnpm-workspace.yaml deploy/Caddyfile README.md
git commit -m "chore(monorepo): integrate apps/web and apps/landing into turbo toolchain"
```
