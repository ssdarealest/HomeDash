# Phase 5: Core Functional Modules — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement end-to-end business logic, data models, REST endpoints, background ingestion workers, and mobile DAOs/screens across Daily Ops, Family Health, Family Finance, Zero-Knowledge Vault Break-Glass Escrow, and Omnichannel Notification Bridge.

**Architecture:** Strictly stratified 6-tier monorepo architecture. Shared Zod contracts in `packages/protocol`, runtime services and background evaluators in `packages/server-runtime`, HTTP route handlers in `apps/server`, and reactive SQLite DAOs and presentation screens in `apps/mobile`.

**Tech Stack:** TypeScript 5.x, Node/Bun, Hono, Zod, Drizzle ORM / SQLite Drift, Vitest, Turborepo, Web Crypto.

**Spec:** [docs/superpowers/specs/2026-11-19-phase-5-core-functional-modules.md](file:///d:/.project/HomeDash/docs/superpowers/specs/2026-11-19-phase-5-core-functional-modules.md)

## Global Constraints

- Strict downward-only dependency flow (Tier 5 -> Tier 4 -> Tier 3 -> Tier 2 -> Tier 1 -> Tier 0).
- Zero plaintext vault data or master recovery keys stored on the server.
- Caregiver guests strictly quarantined from `/finance` and `/vault` endpoints and widgets.
- Every endpoint scoped to caller `householdId` via JWT session context and RLS policies.
- Cryptographic comparisons must use constant-time byte comparisons (`crypto.timingSafeEqual`).
- No emojis anywhere in code, git commits, or documentation.

## Review Focus

1. **Grocery Checkout Expense Concurrency:** If grocery items are checked concurrently, the total expense must atomically link to the correct account and prevent double-charging.
2. **Allergen Matching Precision:** Meal planner recipe scanning must perform case-insensitive, word-boundary checks against active household allergies (e.g., "peanut" vs "peanut butter").
3. **Escalation Snooze Window Invalidation:** Missed dose alerts must not trigger if an unexpired `snoozed` log exists within the 15-minute window.
4. **Android Companion Push Idempotency:** Duplicate bank push notifications arriving within seconds must be rejected idempotently via SHA-256 payload hashing.
5. **Break-Glass Cooldown Race:** Cooldown expiration check must verify exact millisecond cutoff and ensure rejected/vetoed requests can never transition to approved.

---

### Task 1: Protocol Domain Schemas & OpenAPI Endpoints (`packages/protocol`)

**Files:**
- Create: `packages/protocol/src/daily-ops.ts`
- Create: `packages/protocol/src/health.ts`
- Create: `packages/protocol/src/finance.ts`
- Create: `packages/protocol/src/notifications.ts`
- Modify: `packages/protocol/src/index.ts`
- Modify: `packages/protocol/src/openapi.ts`
- Test: `packages/protocol/test/domain-schemas.test.ts`

**Interfaces:**
- Consumes: `packages/protocol/src/auth.ts`, `zod`
- Produces: `GroceryCheckoutSchema`, `MealPlanCreateSchema`, `ChoreToggleSchema`, `ChoreVerifySchema`, `MedicationTakeSchema`, `ShiftSwapSchema`, `VitalsLogCreateSchema`, `AndroidPushNotificationSchema`, `UtilityBillCreateSchema`, `BreakGlassStatusSchema`, `BotWebhookSchema`.

- [ ] **Step 1: Write the failing test**
  In `packages/protocol/test/domain-schemas.test.ts`, write tests validating input parsing for GroceryCheckout, MealPlan with allergen cross-check fields, Android companion push payload, and Break-Glass status resolution.
- [ ] **Step 2: Run test to verify it fails**
  Run `pnpm -F @homedash/protocol test`.
  Expected: FAIL with "module not found" or "schema undefined".
- [ ] **Step 3: Implement domain Zod schemas**
  Create `daily-ops.ts`, `health.ts`, `finance.ts`, and `notifications.ts` in `packages/protocol/src/`, re-export them from `index.ts`, and register the new paths in `openapi.ts`.
- [ ] **Step 4: Run test to verify it passes**
  Run `pnpm -F @homedash/protocol test`.
  Expected: PASS.
- [ ] **Step 5: Commit**
  `git add packages/protocol/`
  `git commit -m "feat(protocol): add domain schemas for daily ops, health, finance, and notifications"`

---

### Task 2: Daily Ops Runtime Service & Router (`packages/server-runtime`, `apps/server`)

**Files:**
- Create: `packages/server-runtime/src/daily-ops-service.ts`
- Create: `apps/server/src/routes/daily-ops.ts`
- Modify: `packages/server-runtime/src/index.ts`
- Modify: `apps/server/src/app.ts`
- Test: `apps/server/test/daily-ops.test.ts`

**Interfaces:**
- Consumes: `@homedash/protocol`, `@homedash/server-schema`
- Produces: `DailyOpsService` (`checkoutGroceryList`, `createMealPlanWithAllergenCheck`, `toggleChore`, `verifyChore`)

- [ ] **Step 1: Write the failing test**
  In `apps/server/test/daily-ops.test.ts`, test:
  1. `POST /api/v1/daily-ops/grocery/checkout` marks checked items completed and atomically logs a transaction in `finance_transactions`.
  2. `POST /api/v1/daily-ops/meal-plans` returns allergen warnings when a planned meal matches an active household allergy.
  3. `POST /api/v1/daily-ops/chores/:id/verify` verifies completion and auto-credits the child's allowance account.
- [ ] **Step 2: Run test to verify it fails**
  Run `pnpm -F @homedash/server test test/daily-ops.test.ts`.
  Expected: FAIL.
- [ ] **Step 3: Implement `DailyOpsService` and daily ops router**
  Implement the service logic in `packages/server-runtime/src/daily-ops-service.ts` and mount the router under `/api/v1/daily-ops` in `apps/server/src/app.ts`.
- [ ] **Step 4: Run test to verify it passes**
  Run `pnpm -F @homedash/server test test/daily-ops.test.ts`.
  Expected: PASS.
- [ ] **Step 5: Commit**
  `git add packages/server-runtime/ apps/server/`
  `git commit -m "feat(server): implement daily ops service and router with grocery checkout and meal allergen checks"`

---

### Task 3: Family Health Service, Dynamic Escalation Worker & Router (`packages/server-runtime`, `apps/server`)

**Files:**
- Create: `packages/server-runtime/src/health-service.ts`
- Create: `packages/server-runtime/src/escalation-worker.ts`
- Create: `apps/server/src/routes/health.ts`
- Modify: `packages/server-runtime/src/index.ts`
- Modify: `apps/server/src/app.ts`
- Test: `apps/server/test/health.test.ts`

**Interfaces:**
- Consumes: `@homedash/protocol`, `@homedash/server-schema`
- Produces: `HealthService`, `EscalationWorker` (`evaluateMissedDoses`)

- [ ] **Step 1: Write the failing test**
  In `apps/server/test/health.test.ts`, test:
  1. Taking medication decrements pill count and flags `low_inventory_warning: true` when remaining <= threshold.
  2. Escalation worker detects missed dose at `scheduled_at + 30m` and dispatches admin alert.
  3. Caregiver shift swap reassigns the shift to another member.
  4. Vitals log records BP and returns aggregated trends.
- [ ] **Step 2: Run test to verify it fails**
  Run `pnpm -F @homedash/server test test/health.test.ts`.
  Expected: FAIL.
- [ ] **Step 3: Implement `HealthService`, `EscalationWorker`, and health router**
  Implement dose tracking, cron-based escalation evaluator with snooze suppression, caregiver shift swaps, and vitals logging.
- [ ] **Step 4: Run test to verify it passes**
  Run `pnpm -F @homedash/server test test/health.test.ts`.
  Expected: PASS.
- [ ] **Step 5: Commit**
  `git add packages/server-runtime/ apps/server/`
  `git commit -m "feat(server): implement health service, dynamic escalation worker, and vitals router"`

---

### Task 4: Family Finance Service, Android Ingestion Webhook & Utility Bill Spike Detection (`packages/server-runtime`, `apps/server`)

**Files:**
- Create: `packages/server-runtime/src/finance-service.ts`
- Create: `packages/server-runtime/src/android-ingest-service.ts`
- Create: `apps/server/src/routes/finance.ts`
- Create: `apps/server/src/routes/ingest.ts`
- Modify: `packages/server-runtime/src/index.ts`
- Modify: `apps/server/src/app.ts`
- Test: `apps/server/test/finance-and-ingest.test.ts`

**Interfaces:**
- Consumes: `@homedash/protocol`, `@homedash/server-schema`
- Produces: `FinanceService`, `AndroidIngestService` (`ingestPushNotification`, `detectBillSpike`)

- [ ] **Step 1: Write the failing test**
  In `apps/server/test/finance-and-ingest.test.ts`, test:
  1. HMAC-SHA256 signature verification and SHA-256 deduplication for Android banking push notifications.
  2. Sinking funds goal calculation and balance tracking.
  3. Utility bill creation triggers spike detection alert if amount > 1.25x historical average.
  4. Caregiver guest access to `/api/v1/finance` returns 403 Forbidden.
- [ ] **Step 2: Run test to verify it fails**
  Run `pnpm -F @homedash/server test test/finance-and-ingest.test.ts`.
  Expected: FAIL.
- [ ] **Step 3: Implement `FinanceService`, `AndroidIngestService`, and routers**
  Implement account/transaction management, banking regex parser, companion signature verification, and bill spike evaluator.
- [ ] **Step 4: Run test to verify it passes**
  Run `pnpm -F @homedash/server test test/finance-and-ingest.test.ts`.
  Expected: PASS.
- [ ] **Step 5: Commit**
  `git add packages/server-runtime/ apps/server/`
  `git commit -m "feat(server): implement finance service, android companion push ingestion, and bill spike detector"`

---

### Task 5: Zero-Knowledge Vault Break-Glass Status & Escrow Release Router (`packages/server-runtime`, `apps/server`)

**Files:**
- Create: `packages/server-runtime/src/vault-break-glass-service.ts`
- Create: `apps/server/src/routes/vault-break-glass.ts`
- Modify: `packages/server-runtime/src/index.ts`
- Modify: `apps/server/src/app.ts`
- Test: `apps/server/test/break-glass.test.ts`

**Interfaces:**
- Consumes: `@homedash/protocol`, `@homedash/server-schema`
- Produces: `VaultBreakGlassService` (`evaluateStatus`, `vetoRequest`, `getEscrowShares`, `getEmergencyVaultItems`)

- [ ] **Step 1: Write the failing test**
  In `apps/server/test/break-glass.test.ts`, test:
  1. Non-admin initiates request -> status is `'pending'` with 48h cooldown.
  2. Admin vetoes with valid token -> status transitions to `'rejected'`.
  3. Cooldown expires without veto -> status transitions to canonical `'approved'`.
  4. Once approved, emergency escrow shares and encrypted items are served via dedicated endpoints.
- [ ] **Step 2: Run test to verify it fails**
  Run `pnpm -F @homedash/server test test/break-glass.test.ts`.
  Expected: FAIL.
- [ ] **Step 3: Implement `VaultBreakGlassService` and router**
  Implement constant-time veto validation, cooldown status evaluator, and emergency payload retrieval routes.
- [ ] **Step 4: Run test to verify it passes**
  Run `pnpm -F @homedash/server test test/break-glass.test.ts`.
  Expected: PASS.
- [ ] **Step 5: Commit**
  `git add packages/server-runtime/ apps/server/`
  `git commit -m "feat(server): implement vault break-glass cooldown evaluator and emergency escrow retrieval"`

---

### Task 6: Omnichannel Bot Webhook & Dispatcher (`packages/server-runtime`, `apps/server`)

**Files:**
- Create: `packages/server-runtime/src/bot-notification-dispatcher.ts`
- Create: `apps/server/src/routes/notifications.ts`
- Modify: `packages/server-runtime/src/index.ts`
- Modify: `apps/server/src/app.ts`
- Test: `apps/server/test/bot-bridge.test.ts`

**Interfaces:**
- Consumes: `@homedash/protocol`, `@homedash/server-runtime`
- Produces: `BotNotificationDispatcher`, `createNotificationsRouter`

- [ ] **Step 1: Write the failing test**
  In `apps/server/test/bot-bridge.test.ts`, test:
  1. Dispatcher generates compact callback tokens (`t:<shortId>:taken`).
  2. Inbound webhook resolves the token, marks the medication taken, and decrements inventory.
  3. Inbound webhook handles snooze callback (+15m).
- [ ] **Step 2: Run test to verify it fails**
  Run `pnpm -F @homedash/server test test/bot-bridge.test.ts`.
  Expected: FAIL.
- [ ] **Step 3: Implement `BotNotificationDispatcher` and notification webhook router**
  Implement compact action token registry and webhook request handler.
- [ ] **Step 4: Run test to verify it passes**
  Run `pnpm -F @homedash/server test test/bot-bridge.test.ts`.
  Expected: PASS.
- [ ] **Step 5: Commit**
  `git add packages/server-runtime/ apps/server/`
  `git commit -m "feat(server): implement omnichannel bot webhook and compact action token dispatcher"`

---

### Task 7: Mobile Drift DAOs, Models & State Providers (`apps/mobile`)

**Files:**
- Create: `apps/mobile/lib/data/database/daos/grocery_dao.dart`
- Create: `apps/mobile/lib/data/database/daos/meal_plans_dao.dart`
- Create: `apps/mobile/lib/data/database/daos/vitals_dao.dart`
- Create: `apps/mobile/lib/data/database/daos/allergies_dao.dart`
- Create: `apps/mobile/lib/data/database/daos/utility_bills_dao.dart`
- Modify: `apps/mobile/lib/data/database/app_database.dart`
- Test: `apps/mobile/test/phase5-daos.test.ts`

**Interfaces:**
- Consumes: `apps/mobile/lib/data/database/tables.dart`
- Produces: `GroceryDao`, `MealPlansDao`, `VitalsDao`, `AllergiesDao`, `UtilityBillsDao`

- [ ] **Step 1: Write the failing test**
  In `apps/mobile/test/phase5-daos.test.ts`, verify that all DAOs exist, export required CRUD and watch query methods, and map to drift database tables.
- [ ] **Step 2: Run test to verify it fails**
  Run `pnpm -F @homedash/mobile test test/phase5-daos.test.ts`.
  Expected: FAIL.
- [ ] **Step 3: Implement Drift DAOs**
  Implement `GroceryDao`, `MealPlansDao`, `VitalsDao`, `AllergiesDao`, and `UtilityBillsDao`, and register them on `AppDatabase`.
- [ ] **Step 4: Run test to verify it passes**
  Run `pnpm -F @homedash/mobile test test/phase5-daos.test.ts`.
  Expected: PASS.
- [ ] **Step 5: Commit**
  `git add apps/mobile/`
  `git commit -m "feat(mobile): implement reactive Drift DAOs for grocery, meal plans, vitals, allergies, and bills"`

---

### Task 8: Mobile UI Screens & Interactive Sheets (`apps/mobile`)

**Files:**
- Create: `apps/mobile/lib/presentation/grocery/grocery_list_screen.dart`
- Create: `apps/mobile/lib/presentation/grocery/grocery_checkout_sheet.dart`
- Create: `apps/mobile/lib/presentation/health/vitals_log_sheet.dart`
- Create: `apps/mobile/lib/presentation/health/allergy_banner.dart`
- Create: `apps/mobile/lib/presentation/shifts/shift_swap_sheet.dart`
- Create: `apps/mobile/lib/presentation/vault/break_glass_status_card.dart`
- Test: `apps/mobile/test/phase5-ui.test.ts`

**Interfaces:**
- Consumes: Material 3 tokens (`app_theme.dart`), DAOs, `SessionState`
- Produces: `GroceryListScreen`, `GroceryCheckoutSheet`, `VitalsLogSheet`, `AllergyBanner`, `ShiftSwapSheet`, `BreakGlassStatusCard`.

- [ ] **Step 1: Write the failing test**
  In `apps/mobile/test/phase5-ui.test.ts`, verify that all UI widgets exist, enforce minimum 48dp touch targets, support Senior Mode text scaling, and respect Caregiver quarantine.
- [ ] **Step 2: Run test to verify it fails**
  Run `pnpm -F @homedash/mobile test test/phase5-ui.test.ts`.
  Expected: FAIL.
- [ ] **Step 3: Implement Mobile UI components**
  Build the widgets in `apps/mobile/lib/presentation/` adhering strictly to Material 3 tokens and accessibility rules.
- [ ] **Step 4: Run test to verify it passes**
  Run `pnpm -F @homedash/mobile test test/phase5-ui.test.ts`.
  Expected: PASS.
- [ ] **Step 5: Commit**
  `git add apps/mobile/`
  `git commit -m "feat(mobile): implement grocery list, vitals sheet, allergy banner, shift swap, and break glass widgets"`

---

### Task 9: Monorepo Integration, Typecheck, and Full Verification

**Files:**
- Create: `apps/server/test/e2e-phase5-modules.test.ts`
- Modify: `apps/server/src/app.ts`
- Test: Full monorepo pipeline (`pnpm exec turbo run test typecheck`)

**Interfaces:**
- Consumes: All Phase 5 services, routes, DAOs, and UI components
- Produces: Fully verified, green monorepo build across all packages.

- [ ] **Step 1: Write comprehensive end-to-end integration test**
  In `apps/server/test/e2e-phase5-modules.test.ts`, test the end-to-end flow:
  1. Grocery checkout creating a finance transaction.
  2. Meal plan creation triggering an allergy warning.
  3. Medication take decrementing remaining inventory.
  4. Escalation worker flagging missed dose and notifying admin.
  5. Android companion push notification logging an expense.
  6. Utility bill logging triggering a spike alert.
  7. Break-glass initiation, cooldown completion, and escrow recovery retrieval.
  8. Bot webhook callback completing a dose.
- [ ] **Step 2: Run e2e test to verify it passes**
  Run `pnpm -F @homedash/server test test/e2e-phase5-modules.test.ts`.
  Expected: PASS.
- [ ] **Step 3: Run full monorepo test and typecheck suite**
  Run `pnpm exec turbo run test typecheck`.
  Expected: All packages pass with zero errors.
- [ ] **Step 4: Commit**
  `git add apps/server/`
  `git commit -m "test(server): add comprehensive end-to-end integration tests for Phase 5 modules"`
