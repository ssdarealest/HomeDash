# Phase 5: Core Functional Modules — Design Specification

- **Date:** 2026-11-19
- **Status:** Approved Architecture (Builder Check Addressed)
- **Author:** Antigravity Engineering Lead
- **Scope:** Complete business logic, ingestion pipelines, REST API routes, mobile state & DAOs, and cross-module workflows for Daily Ops, Family Health, Family Finance, Zero-Knowledge Vault & Break-Glass Escrow, and Omnichannel Notification Bridge.

---

## 1. Intent & The Why

### Problem Statement
In existing household tools, family coordination is severely fragmented:
- Finances are tracked in isolation from household shopping and recurring bills.
- Elder and pediatric health routines (medications, vitals, caregiver shift handoffs) happen over chaotic text messages where critical doses get missed without escalation.
- Vital family documents (passports, deeds, insurance, directives) are either unencrypted or stored in single-owner password managers that become inaccessible during sudden medical emergencies.
- Everyday family members (young children, non-tech-savvy seniors, and temporary caregivers) cannot navigate enterprise tools.

### Vision & Objective
HomeDash Phase 5 delivers the core operational heartbeat of "Family OS" across all four plug-and-play modules defined in `PROMPT.md`:
1. **Daily Household Operations:** Collaborative aisle-sorted grocery checklists with 1-tap checkout-to-expense conversion, allergy-aware weekly meal planning, and gamified recurring chores.
2. **Multi-Generational Health & Care Hub:** Dose tracking with inventory countdown, auto-refill warnings, 30-minute missed-dose escalation alerts to household admins, caregiver shift handoffs, and vitals logging.
3. **Family Finance & Ingestion Engine:** Shared and personal accounts, sinking funds, automated Android companion notification ingestion (bank push-to-transaction), and utility bill spike detection.
4. **Zero-Knowledge Vault & Break-Glass Escrow:** Client-side E2EE document storage, 48-hour time-delayed emergency break-glass protocol with admin veto, and 30/7/1-day renewal reminders.
5. **Omnichannel Notification Bridge:** Pluggable two-way bot webhook handler enabling 1-tap `[Taken]` and `[Snooze 15m]` responses directly from external messengers into the core database.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Full Schema Parity & Downward Dependency:** Strictly honor the 6-tier monorepo architecture. Shared Zod contracts in `packages/protocol`, runtime services and background workers in `packages/server-runtime`, route handlers in `apps/server`, and reactive DAOs/screens in `apps/mobile`.
- **Atomic Cross-Module Integration:**
  - Checking out a grocery list automatically computes total expense and creates a linked record in `finance_transactions`.
  - Adding a meal plan automatically queries household allergies and returns safety warnings if known allergens are detected in recipe notes.
  - Missed critical medication doses automatically trigger escalation notifications.
- **Zero-Knowledge Invariant:** Zero-knowledge vault documents remain opaque ciphertexts on the server. The server never decrypts or handles plaintext document payloads or DEKs.
- **Strict Role Quarantine:** Caregiver guests remain strictly blocked from `/finance` and `/vault` endpoints and UI widgets.
- **100% Test Pass & Monorepo Verification:** `turbo run test typecheck` passes cleanly across all packages.

### Non-Goals
- Live bank API integration (Plaid/GoCardless OAuth live secrets) in local self-host mode. Instead, we implement the signed Android Companion webhook listener parser and OFX/CSV upload parser.
- Full desktop Tauri packaging (slated for post-Phase 6 client builds).
- Live Telegram Bot long-polling daemon requiring active bot tokens in dev; we implement the webhook adapter with HMAC authentication and test mocks.

### Anti-Goals
- No plaintext storage of vault data or master recovery keys.
- No bypassing of household tenant isolation (`household_id` filtering via RLS and session context).
- No unhandled runtime memory leaks or zombie background workers.
- No emojis anywhere in code, commits, or documentation.

---

## 3. Architectural Approaches & Trade-Offs

### Approach 1 (Selected): Monolithic Unified Phase 5 with 4 Coordinated Functional Modules
- **Architecture:** Deliver the complete functional engine in one cohesive pull request.
  - Sub-stage 1: Protocol Zod schemas and OpenAPI definitions (`packages/protocol`).
  - Sub-stage 2: Server runtime services, workers, and API routers (`packages/server-runtime`, `apps/server`).
  - Sub-stage 3: Mobile reactive DAOs, state models, and quick-log screens (`apps/mobile`).
  - Sub-stage 4: Full-suite integration verification and documentation.
- **Pros:** Guarantees atomic cross-module contracts (grocery-to-finance, meal-to-allergies, health-to-escalation) without intermediate broken dependencies.
- **Cons:** Larger blast radius requiring thorough end-to-end testing.

### Approach 2 (Rejected): 4 Separate Sub-Phases (5A through 5D)
- **Trade-off:** Smaller PRs, but introduces cyclic coordination churn because cross-module features (like grocery converting to finance) require stubs or duplicate PR touches across 4 branches.

---

## 4. Technical Architecture & Module Specifications

### Module A: Daily Household Operations

#### 1. Collaborative Grocery List & Checkout Flow
- **Data Model:** `grocery_items` table (`id`, `household_id`, `name`, `quantity`, `aisle_category`, `is_checked`, `checked_by_member_id`, `checked_at`).
- **Aisle Sorting:** `produce`, `dairy`, `meat_seafood`, `bakery`, `pantry`, `frozen`, `household`.
- **Checkout-to-Expense Pipeline:**
  - Endpoint: `POST /api/v1/daily-ops/grocery/checkout`
  - Input: `{ householdId, accountId, category: "Groceries", totalAmountCents, notes }`
  - Logic: In a single atomic transaction:
    1. Mark all checked items as archived/completed.
    2. Insert a new record into `finance_transactions` with `source: 'manual'` (or `'grocery_checkout'`), linking the expense to the selected financial account.
    3. Decrement the account balance by `totalAmountCents`.
    4. Emit sync journal change for real-time SSE propagation.

#### 2. Health-Aware Weekly Meal Planner
- **Data Model:** `meal_plans` table (`id`, `household_id`, `planned_date`, `meal_type`, `recipe_title`, `notes`).
- **Allergen Cross-Check Engine:**
  - Endpoint: `POST /api/v1/daily-ops/meal-plans`
  - Logic: Upon planning a meal, the service scans the recipe title and notes against all active records in `medical_allergies` for the household.
  - Response: Returns `{ mealPlan, allergenWarnings: [{ memberId, allergen, severity }] }` so client UI alerts the family before meals are cooked.

#### 3. Chores & Gamification
- **Data Model:** `chores` table (`id`, `household_id`, `title`, `assigned_member_id`, `recurrence_rule`, `reward_points`, `allowance_cents`, `is_completed`, `verified_by_admin`).
- **Completion & Verification Flow:**
  - `POST /api/v1/daily-ops/chores/:id/toggle`: Assignee marks chore complete.
  - `POST /api/v1/daily-ops/chores/:id/verify`: Admin verifies completion.
  - **Allowance Credit:** If `allowance_cents > 0`, `DailyOpsService` queries `finance_accounts` for an account with `owner_member_id = assigned_member_id` and `account_type = 'personal_allowance'`. If found, it automatically logs an income transaction in that account and increments its balance.
  - **Reward Points:** Dynamically aggregated via `SELECT COALESCE(SUM(reward_points), 0) FROM chores WHERE assigned_member_id = $1 AND is_completed = true AND verified_by_admin = true`. This avoids schema drift and balances stay strictly in sync with verified tasks.

#### 4. Household Wiki & Quick Reference
- Structured quick-reference cards for Wi-Fi QR access, main water/breaker shutoffs, and emergency contacts.

---

### Module B: Multi-Generational Health & Care Hub

#### 1. Shared Medication Log & Inventory Countdown
- **Data Model:** `medications` (`id`, `household_id`, `patient_member_id`, `name`, `dosage`, `schedule_cron`, `remaining_pills`, `refill_threshold`, `is_active`), `medication_logs` (`id`, `household_id`, `medication_id`, `scheduled_at`, `taken_at`, `status`, `photo_proof_url`, `recorded_by_member_id`).
- **Status Lifecycle:** `taken`, `skipped`, `snoozed`, `missed_escalated`.
- **1-Tap Take Action:**
  - `POST /api/v1/health/medications/:id/take`:
    1. Inserts record in `medication_logs` with `status: 'taken'`.
    2. Atomically decrements `remaining_pills` by 1.
    3. Checks if `remaining_pills <= refill_threshold`. If true, returns `low_inventory_warning: true`.

#### 2. Missed-Dose Escalation Alert Worker
- **Dynamic Cron Evaluation:** Rather than pre-materializing empty pending rows, the `EscalationWorker` evaluates active medications against their `schedule_cron`.
- **Missed Detection:**
  - For each active medication, computes expected dose time `T_dose`.
  - If `T_dose <= now - 30 minutes` and no log with `status: 'taken'` exists for `(medication_id, T_dose)`:
    - Inserts a record into `medication_logs` with `status: 'missed_escalated'`.
    - Dispatches high-priority alert to all household admins via `BotNotificationDispatcher`.
- **Snooze Handling:** If a `snoozed` log exists with `taken_at + 15 minutes > now`, escalation is suppressed until the snooze window expires.

#### 3. Caregiver Shift-Swap & Visit Timeline
- **Data Model:** `caregiver_shifts` (`id`, `household_id`, `patient_member_id`, `assigned_member_id`, `start_time`, `end_time`, `status`, `notes`).
- **Endpoints:**
  - `GET /api/v1/health/shifts`: Scoped to household.
  - `POST /api/v1/health/shifts/:id/swap`: Reassigns shift to requested caregiver with confirmation note.
  - `POST /api/v1/health/shifts/:id/checkin`: Records start time and shift notes.

#### 4. Personal Health Records (PHR) & Vitals
- **Data Model:** `vitals_logs` (`id`, `household_id`, `member_id`, `vital_type`, `value_primary`, `value_secondary`, `unit`, `recorded_at`).
- **Supported Vitals:** `blood_pressure` (systolic/diastolic), `blood_glucose`, `heart_rate`, `temperature`, `weight`.
- **Trend Aggregation:** `GET /api/v1/health/vitals/trends?memberId=...&vitalType=...` returns moving average, minimum, and maximum statistics.

---

### Module C: Family Finance & Ingestion Engine

#### 1. Ledgers, Sinking Funds & Budgets
- **Data Model:** `finance_accounts` (`account_type`: `shared_checking`, `personal_allowance`, `sinking_fund`, `balance_cents`), `finance_transactions` (`amount_cents`, `transaction_type`: `income`, `expense`, `transfer`, `category`, `source`).
- **Sinking Fund Allocation:** Tracks goal amounts, current balances, and monthly funding contributions.

#### 2. Android Companion Notification Ingestion Webhook
- **Endpoint:** `POST /api/v1/ingest/android-notification`
- **Routing & Identification:**
  - Request includes header `X-HomeDash-Household-Id: <uuid>` and `X-HomeDash-Signature: <hex>`.
  - Authenticated via HMAC-SHA256 using `companionSecret` stored in `households.settings->>'companionSecret'`.
  - Target Account: If optional `accountId` is provided in payload, it is validated against the household. If omitted, falls back to the household's primary `shared_checking` account.
- **Parsing Engine:**
  - Extracts `amountCents`, `merchant/description`, `transactionType` (expense/income), and timestamp from banking notifications (Chase, Wells Fargo, Venmo, Apple Pay, etc.).
  - Computes idempotency hash (`sha256(packageName + rawText + timestamp)`) to prevent duplicate transactions.
  - Records transaction with `source: 'android_push'`.

#### 3. Utility Bill Spike Detection Engine
- **Data Model:** `utility_bills` (`provider_name`, `bill_type`, `billing_period_start`, `billing_period_end`, `amount_cents`, `due_date`, `status`, `ocr_metadata`).
- **Spike Detector:**
  - Evaluates historical average amount for the same `bill_type` and `provider_name` within the household.
  - If current bill `amount_cents > 1.25 * historical_average`, returns `is_spike: true` with percentage anomaly calculation.

---

### Module D: Zero-Knowledge Vault & Emergency Break-Glass

#### 1. Client-Side E2EE Document Storage
- **Data Model:** `vault_items` (`title`, `category`, `encrypted_payload`, `payload_nonce`, `encrypted_dek`, `dek_nonce`, `key_version`).
- **Zero-Knowledge Invariant:** The server treats all payloads and DEKs as opaque base64-encoded strings. Only authenticated family members holding the derived key can decrypt.

#### 2. Time-Delayed Break-Glass Escrow Protocol
- **Data Model:** `break_glass_requests` (`id`, `household_id`, `requested_by_member_id`, `status`: `'pending'`, `'approved'`, `'rejected'`, `'expired'`, `cooldown_expires_at`, `veto_token_hash`).
- **Workflow & RLS Parity:**
  - **Canonical Status:** Strictly uses `'approved'` (matching Phase 1 Postgres enum and RLS policies) when cooldown expires without admin veto.
  - **Initiate:** Trusted member calls `POST /api/v1/vault/break-glass/initiate`. Status becomes `'pending'`, cooldown set to 48 hours. Veto token generated for admins.
  - **Veto:** Admin calls `POST /api/v1/vault/break-glass/veto` with `{ requestId, vetoToken }`. Verified using constant-time comparison. Status becomes `'rejected'`.
  - **Access Resolution:** When 48h elapses without veto:
    - Status transitions to `'approved'`.
    - Dedicated REST endpoint `GET /api/v1/vault/break-glass/:id/escrow-shares` serves the recovery shares to the verified requester.
    - Dedicated emergency endpoint `GET /api/v1/vault/emergency-items` allows the verified requester to pull encrypted vault items, preserving the core sync engine's standard quarantine.

#### 3. Asset & Renewal Tracker
- **Data Model:** `asset_renewals` (`title`, `category`: `insurance`, `vehicle`, `warranty`, `tuition`, `renewal_date`, `reminder_days`).
- **Endpoint:** `GET /api/v1/vault/renewals/upcoming` returns items due within 30 days, sorted by urgency.

---

### Module E: Omnichannel Notification Bridge

#### 1. Two-Way Bot Webhook & Identity Resolution
- **Endpoint:** `POST /api/v1/notifications/bot/webhook`
- **Compact Action Token Strategy:**
  - To conform to Telegram's 64-byte `callback_data` limit, outbound notification buttons use a compact token format: `t:<short_id>:taken` or `t:<short_id>:snooze`.
  - The server stores the short token in an in-memory/cache registry mapping to `{ householdId, medicationId, scheduledAt, memberId }`.
  - On incoming callback: The webhook resolves the token, marks the medication taken, decrements inventory, and updates the chat message with confirmation.
- **Admin Alert Destinations:**
  - Configured in `households.settings->'notifications'` (e.g. `telegramChatId`, `webhookUrl`).
  - `BotNotificationDispatcher` formats and sends alerts to the configured household channel.

---

## 5. Security, Permissions & Caregiver Quarantine

- **Caregiver Quarantine:** Caregiver guests remain strictly blocked from all `/finance` and `/vault` endpoints via global `blockCaregiverFromSensitiveModules` middleware. Caregivers only receive access to daily chores, grocery checklist, shift schedules, and patient medication check-off.
- **Multi-Tenant Row-Level Security:** Every single query across all 4 modules filters strictly on `household_id` validated from the caller's JWT session.
- **Constant-Time Crypto:** All tokens (break-glass veto tokens, companion webhook HMACs, bot webhook tokens) use constant-time byte comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.

---

## 6. Monorepo Implementation Plan

1. **`packages/protocol`:**
   - Add Zod schemas and OpenAPI route definitions for Daily Ops, Family Health, Family Finance, Break-Glass status/veto/escrow, and Ingest webhooks.
2. **`packages/server-runtime`:**
   - Implement `DailyOpsService`, `HealthService`, `FinanceService`, `VaultService`, `AndroidIngestService`, `EscalationWorker`, and `BotNotificationDispatcher`.
3. **`apps/server`:**
   - Mount new routers under `/api/v1/daily-ops`, `/api/v1/health`, `/api/v1/finance`, `/api/v1/ingest`, and `/api/v1/notifications`.
   - Wire all routes into `createApp()`.
4. **`apps/mobile`:**
   - Update Drift DAOs for grocery, meal plans, vitals, allergies, utility bills, and renewals.
   - Implement Flutter UI sheets and screens:
     - Grocery checklist with aisle view and 1-tap checkout sheet.
     - Meal planner with allergen alert banner.
     - Vitals quick-log sheet.
     - Caregiver shift-swap sheet.
     - Break-glass emergency status card.
5. **Testing & Monorepo Verification:**
   - Unit tests for all services, controllers, and mobile DAOs.
   - Run `pnpm exec turbo run test typecheck` ensuring 100% test pass.
