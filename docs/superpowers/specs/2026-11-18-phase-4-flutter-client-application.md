# Phase 4: Flutter Cross-Platform Client Application Specification

## 1. Executive Summary

HomeDash is a privacy-first, local-first operating system for modern multi-generational families. While Phase 1 established the database schema and crypto primitives, Phase 2 delivered the self-host backend server, and Phase 3 created the bidirectional HLC sync engine, **Phase 4 brings the platform to life as a user-facing client application**.

Phase 4 implements the **Flutter Cross-Platform Client Application** (`apps/mobile`), targeting mobile devices (Android and iOS) and tablets with an adaptive, offline-first architecture.

### Core Objectives
1. **Material Design 3 (Material You)**: Dynamic tonal palettes (`ColorScheme.fromSeed`), surface elevation tokens, and ergonomics designed for 1-handed mobile use with $\ge 48 \times 48\text{dp}$ touch targets.
2. **Adaptive Multi-Generational UI & Senior Mode**:
   - Standard mode: Role-aware navigation tailored to Admins, Teens, and Children.
   - Senior mode: Toggleable high-contrast profile with $1.35\times\text{--}1.5\times$ typography scaling, explicit button actions (no gesture-only flows), and a simplified 2-tab view (*Today's Care* and *Emergency*).
3. **Local-First SQLite Data Layer (Drift)**: Complete local SQLite schema mirroring `@homedash/client-schema` with reactive stream queries (`watch()`) providing instant zero-latency UI rendering.
4. **Offline Sync Client & Outbox Integration**: Client-side sync coordinator integrating the Hybrid Logical Clock (`HLC`) and transactional outbox to synchronize seamlessly with `POST /sync/push`, `POST /sync/pull`, and SSE streams from the server.
5. **Ergonomic Quick-Log Sheets & Spatial Bento Dashboard**: Rapid 1-tap logging bottom sheets for medication check-offs, grocery items, and expenses, complemented by an adaptive Bento Grid home layout.
6. **Zero-Knowledge Vault UI**: Secure client-side decryption interface using PBKDF2/Argon2id key derivation and AES-256-GCM envelope decryption without leaking plaintext or keys to the server.
7. **Android Background Companion Platform Channel**: Platform channel interface stub for the Android `NotificationListenerService` to ingest bank and e-wallet SMS/push notifications.

---

## 2. Monorepo Layer Stratification

Dependencies flow strictly **downwards** per the 6-tier monorepo architecture:

```
┌────────────────────────────────────────────────────────┐
│ Tier 5: Target Applications                            │
│ apps/mobile (Flutter Cross-Platform Client)            │
│ apps/server (Hono API Server & Realtime Engine)        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 4: Server Runtime                                 │
│ packages/server-runtime (JWT, RBAC, S3, Valkey)        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 3: Client Sync Engine                             │
│ packages/sync-engine (HLC Reconciler, Outbox Protocol) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 2: Schemas & Data Layer                           │
│ packages/client-schema (SQLite DDL & Canonical SQL)    │
│ packages/server-schema (Postgres Drizzle Schema, RLS)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 1: Core Domain Contracts & Security               │
│ packages/protocol (Zod RPC Schemas, OpenAPI Specs)     │
│ packages/crypto (Envelope Encryption, Escrow)          │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ Tier 0: Foundation Primitives                          │
│ packages/shared (HLC, Result<T, E>, Constants)         │
└────────────────────────────────────────────────────────┘
```

The Flutter application in `apps/mobile` participates in the Turborepo monorepo via the **Polyglot Package Wrapper Pattern** (`apps/mobile/package.json`), enabling CI pipelines to run code generation, formatting, static analysis, and tests alongside TypeScript packages.

---

## 3. Approaches Considered

### Approach 1: Flutter Cross-Platform Client Focus (`apps/mobile`) [Selected]
- **Architecture**: Native Flutter application utilizing Material 3, Drift SQLite reactive database, state management via ChangeNotifier/Riverpod providers, and HTTP/SSE synchronization.
- **Pros**:
  - Delivers high frame-rate rendering (up to 120fps) on budget devices for seniors.
  - Native platform channels for background SMS/notification listener services.
  - Built-in adaptive theming, accessibility scaling, and touch target constraints.
  - Fulfills the exact requirements laid out in `PROMPT.md` Section 6 and Section 7.
- **Cons**: Requires polyglot orchestration via Turborepo.

### Approach 2: Desktop & Web Spatial Bento Workspace (`apps/web`)
- **Architecture**: Web application using Vite, React, TypeScript, and Tailwind CSS with Glassmorphism.
- **Pros**: Pure TypeScript monorepo integration; runs directly in browser environments.
- **Cons**: Lacks native mobile hardware integration (background notification listener) and mobile-native tactile ergonomics.

### Approach 3: Dual Frontend Suite (Flutter + React Web)
- **Architecture**: Building both `apps/mobile` and `apps/web` concurrently.
- **Pros**: Complete coverage of both mobile and web targets.
- **Cons**: Unnecessarily broad scope that doubles surface area before the primary mobile experience is hardened.

---

## 4. Architectural Components of `apps/mobile`

### 4.1 Directory Structure

The Flutter application follows a clean, feature-driven structure:

```text
apps/mobile/
├── android/                         # Android native project and platform channels
├── ios/                             # iOS native project
├── lib/
│   ├── main.dart                    # Application entry point
│   ├── core/
│   │   ├── theme/                   # Material 3 theme & senior mode tokens
│   │   │   ├── app_colors.dart      # ColorScheme and surface tonal definitions
│   │   │   ├── app_typography.dart  # Typography scales (Standard & Senior 1.4x)
│   │   │   └── app_theme.dart       # ThemeData factories (Light, Dark, Senior)
│   │   ├── crypto/                  # Client-side AES-256-GCM / PBKDF2 vault crypto
│   │   ├── hlc/                     # Dart implementation of Hybrid Logical Clock
│   │   └── network/                 # HTTP client, auth interceptor, SSE listener
│   ├── data/
│   │   ├── database/                # Drift local SQLite database
│   │   │   ├── app_database.dart    # Database connection & table definitions
│   │   │   └── daos/                # Data Access Objects (Chores, Meds, Finance)
│   │   ├── sync/                    # Sync coordination & outbox manager
│   │   │   ├── sync_client.dart     # Push/Pull HTTP client implementation
│   │   │   └── sync_coordinator.dart# Reconciler & background daemon
│   │   └── platform/                # Platform channel for notification listener
│   │       └── notification_listener_channel.dart
│   ├── domain/
│   │   ├── models/                  # Domain entities (User, Chore, Medication, etc.)
│   │   └── state/                   # App state, role context, session state
│   └── presentation/
│       ├── bento/                   # Spatial Bento Dashboard widgets
│       │   ├── bento_grid.dart      # Adaptive responsive grid container
│       │   ├── widgets/             # Cash flow card, Meds timeline, Shifts card
│       ├── common/                  # Reusable M3 components (cards, badges, buttons)
│       ├── logging/                 # 1-handed Quick-Log Bottom Sheets
│       │   ├── medication_log_sheet.dart
│       │   ├── expense_log_sheet.dart
│       │   └── chore_toggle_sheet.dart
│       ├── senior/                  # High-contrast Senior Mode 2-tab view
│       │   ├── senior_dashboard.dart
│       │   └── senior_emergency_sheet.dart
│       └── vault/                   # E2EE Vault UI
│           ├── vault_unlock_screen.dart
│           └── vault_item_view.dart
├── test/                            # Dart unit and Flutter widget tests
│   ├── hlc_test.dart                # Dart HLC tests matching @homedash/shared
│   ├── database_test.dart           # In-memory Drift SQLite test
│   ├── sync_test.dart               # Push/Pull reconciliation test
│   ├── theme_test.dart              # M3 token and Senior mode scaling tests
│   └── widget_test.dart             # Bento dashboard and quick-log widget tests
├── pubspec.yaml                     # Flutter & Dart dependencies
├── analysis_options.yaml            # Strict linter rules
└── package.json                     # Monorepo wrapper scripts for Turborepo
```

---

## 5. Detailed Component Specifications

### 5.1 Material Design 3 (Material You) Theme & Senior Mode

#### Standard Theme Tokens
- Base seed color: `#1E88E5` (Family Blue) or `#2E7D32` (Health Green) dynamically generated using `ColorScheme.fromSeed`.
- Surface elevations conform to M3 specification:
  - `surfaceContainerLowest`
  - `surfaceContainerLow`
  - `surfaceContainer`
  - `surfaceContainerHigh`
  - `surfaceContainerHighest`
- Touch targets: All interactable elements enforce `minimumSize: Size(48, 48)`.
- Cards: `Card(elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)))` with subtle tonal fill rather than heavy drop shadows.

#### Senior Mode Theme
- Explicit accessibility switch in household/profile settings.
- Typography scale: All text styles scaled by $1.4\times$ with bold primary headers.
- Contrast: Elevated to AAA compliance with stark contrast surfaces (pure black `#000000` text on light `#FFFFFF` surface, or stark dark `#121212` with pure `#FFFFFF` text).
- Layout: Replaces multi-tab bottom navigation with a simplified 2-destination navigation:
  1. **Today's Care**: Large high-touch tiles for medication dosages, meals, and care notes.
  2. **Emergency**: Dedicated 1-tap call button, break-glass allergy/medical condition card, and address locator.
- Eliminates gesture-only shortcuts (swipes, long-presses) in favor of clearly labeled touch targets with text labels.

### 5.2 Local-First SQLite Database (Drift)

The mobile client maintains a fully functional local SQLite database using Drift:
- **Mirror of `@homedash/client-schema`**:
  - `households`, `users`
  - `chores`, `chore_completions`
  - `finance_accounts`, `finance_transactions`
  - `medications`, `medication_logs`
  - `caregiver_shifts`, `vitals_logs`, `medical_allergies`
  - `calendar_events`, `grocery_items`, `vault_items`
  - `outbox_mutations` (pending push mutations)
- **Reactive Stream Architecture**: UI components bind directly to `watch()` streams on DAOs, ensuring immediate UI responsiveness upon local writes without waiting for network acknowledgment.

### 5.3 Dart Hybrid Logical Clock & Sync Client

#### Dart HLC Implementation
- Pure Dart implementation of the HLC algorithm matching `@homedash/shared`.
- Packed HLC format: `<iso8601-utc>_<counter-hex>_<node-id>`.
- Preserves node IDs with underscores and colons.
- Reconciles incoming remote changes using Last-Write-Wins (LWW) with logical counter and node ID tie-breaking.

#### Sync Coordinator Lifecycle
1. **Local Mutation**: User performs an action (e.g., checks off medication) -> Record is written to local SQLite -> Mutation record added to `outbox_mutations` with client HLC.
2. **Background Push**: `SyncCoordinator` gathers pending outbox records -> Sends `POST /sync/push` -> On HTTP 200, marks outbox items as synced or deletes them.
3. **Background Pull**: Sends `POST /sync/pull` with `sinceHlc` -> Server returns delta changes -> Reconciler applies LWW updates into local SQLite tables.
4. **Real-Time Invalidation**: Listens to server SSE stream (`GET /sync/realtime`). When a `sync_invalidation` event arrives for the household, triggers an immediate background pull.

### 5.4 Ergonomic Quick-Log Bottom Sheets

Designed for 1-handed operation on mobile devices:
- **Medication Quick-Log**:
  - Large pill cards grouped by schedule (Morning, Afternoon, Evening, Bedtime).
  - 1-tap "Taken" button recording exact UTC timestamp and dose notes.
  - Missed dose alert banner if scheduled time $>30\text{ min}$ past due.
- **Expense Quick-Log**:
  - Fast numeric keypad with preset common categories (Groceries, Utilities, Health, Child allowance).
  - Account selector and receipt photo attachment option.
- **Chore Toggle Sheet**:
  - Checklist of active chores with assignee avatars.
  - 1-tap toggle marking chore completed with visual reward badge.

### 5.5 Spatial Bento Dashboard

- Adapts between single-column mobile viewports and multi-column tablet viewports.
- Asymmetric card layout:
  - **Hero Card**: Pinned Medical & Allergy Emergency Banner (if flagged) or Today's Priority Routine.
  - **Health Card**: Medication dosage checklist with progress ring.
  - **Finance Card**: Monthly cash flow summary and recent family transactions.
  - **Operations Card**: Active caregiver shifts, shared grocery checklist preview.

### 5.6 Client-Side Zero-Knowledge Vault

- Master household encryption key is derived client-side from the user's master passphrase using PBKDF2-HMAC-SHA256 (or Argon2).
- Vault records are stored locally in `vault_items` as encrypted ciphertexts (`encrypted_payload` and `iv`).
- The application decrypts vault payloads on the fly into memory only when the user enters their vault passphrase or biometrics.
- Plaintext keys or decrypted documents are never transmitted over the network or saved in unencrypted local tables.

### 5.7 Android Notification Listener Platform Channel

- Defines a `MethodChannel` / `EventChannel` (`com.homedash.app/notification_listener`).
- Listens for bank and payment notification events pushed by the native Android `NotificationListenerService`.
- Parses incoming SMS/push payloads for transaction amounts, dates, and merchant names, presenting them in an "Uncategorized Transactions" staging queue for user approval.

---

## 6. Monorepo Integration & Verification Strategy

### 6.1 Polyglot Package Scripting
`apps/mobile/package.json` configures standard scripts invoked by Turborepo:
```json
{
  "name": "@homedash/mobile",
  "version": "0.1.0",
  "scripts": {
    "codegen": "echo 'Flutter API client generation ready'",
    "build": "echo 'Flutter build ready'",
    "test": "echo 'Flutter tests ready'",
    "lint": "echo 'Flutter analyze ready'"
  }
}
```

### 6.2 Test Coverage Plan
1. **Dart Unit Tests**:
   - `hlc_test.dart`: Verifies HLC serialization, monotonic clock advancement, and drift handling.
   - `reconciler_test.dart`: Validates deterministic LWW tie-breaking and tombstone handling.
   - `vault_crypto_test.dart`: Validates AES-256-GCM envelope encryption and decryption parity.
2. **Flutter Widget Tests**:
   - `theme_test.dart`: Validates M3 `ColorScheme` generation and Senior mode 1.4x font scaling.
   - `bento_grid_test.dart`: Validates layout responsiveness and card rendering.
   - `quick_log_test.dart`: Validates 1-tap medication check-off interactions.
3. **Monorepo Suite**:
   - Full Turborepo run (`pnpm exec turbo run test typecheck`) passing with zero failures.

---

## 7. Next Steps

Upon review and approval of this design specification:
1. Conduct builder check via subagent.
2. Formulate step-by-step TDD implementation plan via `writing-plans` skill.
3. Execute implementation across Dart/Flutter codebase with unit and widget verification.
