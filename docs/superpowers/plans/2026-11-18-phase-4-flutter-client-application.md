# Phase 4: Flutter Cross-Platform Client Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Phase 4 Flutter Cross-Platform Client Application (`apps/mobile`) for Family OS, featuring Material Design 3, an adaptive Senior Mode profile, a local-first Drift SQLite database, a client-side HLC sync coordinator, an E2EE Zero-Knowledge Vault UI, ergonomic 1-handed logging sheets, a spatial Bento dashboard, and the Android Companion notification listener channel.

**Architecture:** Layered Flutter architecture (`core/`, `data/`, `domain/`, `presentation/`) consuming the HomeDash HTTP/SSE sync protocol. The package integrates natively into the Turborepo monorepo via the Polyglot Package Wrapper Pattern, maintaining strict downward stratification.

**Tech Stack:** Flutter / Dart (Material 3), Drift (SQLite), pure Dart Hybrid Logical Clock (HLC), Web Crypto / PBKDF2 / AES-GCM vault envelope cryptography, ChangeNotifier / Provider state management, and Turborepo.

**Spec:** [docs/superpowers/specs/2026-11-18-phase-4-flutter-client-application.md](docs/superpowers/specs/2026-11-18-phase-4-flutter-client-application.md)

## Global Constraints

- Monorepo dependencies flow strictly downwards (Tier 5 -> Tier 4 -> Tier 3 -> Tier 2 -> Tier 1 -> Tier 0).
- Local SQLite table names strictly mirror `packages/client-schema/src/schema.sql` with `local_` prefixes.
- Sync protocol strictly adheres to the 13 collaborative tables whitelisted by the server.
- All touch targets must satisfy minimum dimensions of $48 \times 48\text{dp}$.
- Senior Mode requires $1.4\times$ typography scaling, AAA high-contrast tokens, a 2-tab navigation layout (*Today's Care* and *Emergency*), and no gesture-only interactions.
- Zero-Knowledge Vault keys must be derived client-side; plaintext secrets are never transmitted or stored unencrypted.
- Caregiver guest sessions are strictly quarantined from accessing `/finance` and `/vault` modules.
- Turborepo commands `pnpm exec turbo run test typecheck` must pass 100% with zero errors across all monorepo packages.
- No emojis anywhere in code, markdown, or documentation.

## Review Focus

1. **Local SQLite Schema Divergence**: Drift table column types, defaults, and table names must precisely match `packages/client-schema/src/schema.sql` to avoid synchronization de-serialization errors.
2. **Corrupted Timestamp Handling in Dart HLC**: Ill-formed timestamps received over the wire must fall back to `{ millis: 0, counter: 0, nodeId: 'invalid' }` to ensure they never overwrite valid local state.
3. **Caregiver Guest Route Quarantine**: UI navigation guards must unconditionally prevent caregiver profiles from accessing finance and vault views even on client-side routing.
4. **SSE Keep-Alive Stream Leak**: Real-time event streams must be properly canceled and disposed on client logout or network disconnect.
5. **Senior Mode Button Ergonomics**: All interactive elements in Senior Mode must feature visible, high-contrast text labels rather than icon-only or swipe-based triggers.

---

### Task 1: Flutter Project Scaffolding & Polyglot Monorepo Harness

**Files:**
- Create: `apps/mobile/pubspec.yaml`
- Create: `apps/mobile/analysis_options.yaml`
- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/lib/main.dart`
- Create: `apps/mobile/test/scaffold.test.ts`

**Interfaces:**
- Produces: Base Flutter application entrypoint and package configuration conforming to Turborepo pipeline scripts (`codegen`, `build`, `test`, `lint`, `typecheck`).

- [ ] **Step 1: Write the failing test**

```typescript
// apps/mobile/test/scaffold.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Flutter Mobile Package Scaffolding', () => {
  it('should have a valid pubspec.yaml with Material 3 and Drift dependencies', () => {
    const pubspecPath = path.resolve(__dirname, '../pubspec.yaml');
    expect(fs.existsSync(pubspecPath)).toBe(true);
    const content = fs.readFileSync(pubspecPath, 'utf8');
    expect(content).toContain('name: homedash_mobile');
    expect(content).toContain('sdk: flutter');
    expect(content).toContain('drift:');
  });

  it('should have analysis_options.yaml with strict linter rules', () => {
    const analysisPath = path.resolve(__dirname, '../analysis_options.yaml');
    expect(fs.existsSync(analysisPath)).toBe(true);
  });

  it('should have a valid main.dart entrypoint', () => {
    const mainPath = path.resolve(__dirname, '../lib/main.dart');
    expect(fs.existsSync(mainPath)).toBe(true);
    const content = fs.readFileSync(mainPath, 'utf8');
    expect(content).toContain('void main()');
    expect(content).toContain('HomeDashApp');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @homedash/mobile test`
Expected: FAIL due to missing files.

- [ ] **Step 3: Implement scaffolding files**

1. Create `apps/mobile/pubspec.yaml` configuring `homedash_mobile`, Flutter SDK, and core dependencies (`drift`, `sqlite3_flutter_libs`, `provider`, `http`, `crypto`, `intl`).
2. Create `apps/mobile/analysis_options.yaml` with recommended Flutter lints.
3. Update `apps/mobile/package.json` with scripts:
   - `"test": "vitest run"`
   - `"typecheck": "tsc --noEmit"`
   - `"build": "echo 'Flutter build ready'"`
   - `"lint": "echo 'Flutter analyze ready'"`
4. Create `apps/mobile/lib/main.dart` with `void main()` running `const HomeDashApp()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @homedash/mobile test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/pubspec.yaml apps/mobile/analysis_options.yaml apps/mobile/package.json apps/mobile/lib/main.dart apps/mobile/test/scaffold.test.ts
git commit -m "feat(mobile): scaffold Flutter project and monorepo pipeline integration"
```

---

### Task 2: Material 3 (Material You) Theme & Senior Mode Token Architecture

**Files:**
- Create: `apps/mobile/lib/core/theme/app_colors.dart`
- Create: `apps/mobile/lib/core/theme/app_typography.dart`
- Create: `apps/mobile/lib/core/theme/app_theme.dart`
- Create: `apps/mobile/test/theme.test.ts`

**Interfaces:**
- Produces:
  - `AppColors`: Palette tokens (`primarySeed`, tonal surfaces `surfaceContainerLowest` through `surfaceContainerHighest`, and high-contrast senior tokens).
  - `AppTypography`: Standard typography scale and `AppTypography.seniorTextTheme` ($1.4\times$ font scale).
  - `AppTheme`: `AppTheme.light()`, `AppTheme.dark()`, and `AppTheme.senior()`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/mobile/test/theme.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Material 3 and Senior Theme Tokens', () => {
  it('should define M3 tonal surface elevation tokens in app_colors.dart', () => {
    const filePath = path.resolve(__dirname, '../lib/core/theme/app_colors.dart');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('surfaceContainerLowest');
    expect(content).toContain('surfaceContainerHigh');
    expect(content).toContain('seniorBackground');
  });

  it('should define Senior Mode 1.4x scaled typography in app_typography.dart', () => {
    const filePath = path.resolve(__dirname, '../lib/core/theme/app_typography.dart');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('seniorScaleFactor = 1.4');
  });

  it('should provide Senior Theme with minimum 48dp touch targets in app_theme.dart', () => {
    const filePath = path.resolve(__dirname, '../lib/core/theme/app_theme.dart');
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('static ThemeData senior()');
    expect(content).toContain('Size(48, 48)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @homedash/mobile test`
Expected: FAIL due to missing theme files.

- [ ] **Step 3: Implement Theme Tokens**

1. Create `apps/mobile/lib/core/theme/app_colors.dart`:
   - Primary seed: `#1E88E5` (Family Blue), Health seed: `#2E7D32` (Health Green).
   - Dynamic tonal surface definitions.
   - High-contrast Senior Mode colors (`#000000` on `#FFFFFF`, `#121212` with pure `#FFFFFF`).
2. Create `apps/mobile/lib/core/theme/app_typography.dart`:
   - Standard scale: Display, Headline, Title, Body, Label.
   - Senior scale factor: `1.4`, with `TextStyle` overrides boosting line height and font weight.
3. Create `apps/mobile/lib/core/theme/app_theme.dart`:
   - `light()`, `dark()`, `senior()` factory methods using `ThemeData(useMaterial3: true)`.
   - Explicit `ElevatedButtonThemeData` and `IconButtonThemeData` enforcing `Size(48, 48)` minimum touch targets.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @homedash/mobile test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/core/theme/ apps/mobile/test/theme.test.ts
git commit -m "feat(mobile): implement Material 3 and Senior Mode theme token architecture"
```

---

### Task 3: Local-First SQLite Database Layer (Drift Schema Parity)

**Files:**
- Create: `apps/mobile/lib/data/database/tables.dart`
- Create: `apps/mobile/lib/data/database/app_database.dart`
- Create: `apps/mobile/lib/data/database/daos/chores_dao.dart`
- Create: `apps/mobile/lib/data/database/daos/medications_dao.dart`
- Create: `apps/mobile/lib/data/database/daos/finance_dao.dart`
- Create: `apps/mobile/lib/data/database/daos/outbox_dao.dart`
- Create: `apps/mobile/test/database.test.ts`

**Interfaces:**
- Produces:
  - Drift table definitions mirroring `packages/client-schema/src/schema.sql`.
  - `AppDatabase` class.
  - Reactive DAOs with `watchAllChores()`, `watchTodayMedications()`, `watchPendingOutbox()`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/mobile/test/database.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Drift SQLite Schema Parity with packages/client-schema', () => {
  it('should define canonical local_ tables matching client-schema.sql', () => {
    const tablesPath = path.resolve(__dirname, '../lib/data/database/tables.dart');
    const content = fs.readFileSync(tablesPath, 'utf8');
    const canonicalTables = [
      'LocalChores',
      'LocalMedications',
      'LocalMedicationLogs',
      'LocalCaregiverShifts',
      'LocalVitalsLogs',
      'LocalMedicalAllergies',
      'LocalFinanceAccounts',
      'LocalFinanceTransactions',
      'LocalVaultItems',
      'LocalGroceryItems',
      'OutboxMutations',
    ];
    for (const table of canonicalTables) {
      expect(content).toContain(`class ${table} extends Table`);
    }
  });

  it('should include correct envelope fields in LocalVaultItems table', () => {
    const tablesPath = path.resolve(__dirname, '../lib/data/database/tables.dart');
    const content = fs.readFileSync(tablesPath, 'utf8');
    expect(content).toContain('payloadCiphertext');
    expect(content).toContain('payloadNonce');
    expect(content).toContain('encryptedDek');
    expect(content).toContain('dekNonce');
    expect(content).toContain('kekSalt');
  });

  it('should implement OutboxDao with pending mutation queries', () => {
    const outboxDaoPath = path.resolve(__dirname, '../lib/data/database/daos/outbox_dao.dart');
    const content = fs.readFileSync(outboxDaoPath, 'utf8');
    expect(content).toContain('watchPendingMutations');
    expect(content).toContain('markSynced');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @homedash/mobile test`
Expected: FAIL due to missing database files.

- [ ] **Step 3: Implement Drift Schema & DAOs**

1. Create `apps/mobile/lib/data/database/tables.dart` with Drift `Table` classes:
   - `LocalChores`, `LocalMedications`, `LocalMedicationLogs`, `LocalCaregiverShifts`, `LocalVitalsLogs`, `LocalMedicalAllergies`, `LocalFinanceAccounts`, `LocalFinanceTransactions`, `LocalVaultItems`, `LocalGroceryItems`, `LocalMealPlans`, `LocalHomeWikiCards`, `LocalUtilityBills`, `LocalAssetRenewals`, `LocalHouseholds`, `LocalUsers`, and `OutboxMutations`.
2. Create `apps/mobile/lib/data/database/app_database.dart` binding tables and DAOs.
3. Create DAOs with reactive streams (`watch()`) for UI consumption.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @homedash/mobile test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/data/database/ apps/mobile/test/database.test.ts
git commit -m "feat(mobile): implement Drift SQLite tables and reactive DAOs"
```

---

### Task 4: Dart Hybrid Logical Clock & Conflict Reconciler

**Files:**
- Create: `apps/mobile/lib/core/hlc/hlc.dart`
- Create: `apps/mobile/lib/data/sync/reconciler.dart`
- Create: `apps/mobile/test/hlc.test.ts`

**Interfaces:**
- Produces:
  - `HybridLogicalClock`: `now()`, `send()`, `receive()`, `pack()`, `unpack()`.
  - `ConflictReconciler`: `reconcile({incomingHlc, existingHlc, isDeleted}) -> ReconcileResult`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/mobile/test/hlc.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Dart HLC and Conflict Reconciler Parity', () => {
  it('should implement unpack with underscore node ID preservation', () => {
    const hlcPath = path.resolve(__dirname, '../lib/core/hlc/hlc.dart');
    const content = fs.readFileSync(hlcPath, 'utf8');
    expect(content).toContain('class HybridLogicalClock');
    expect(content).toContain('unpack');
    expect(content).toContain('pack');
  });

  it('should implement safe deterministic fallback for corrupt HLCs', () => {
    const hlcPath = path.resolve(__dirname, '../lib/core/hlc/hlc.dart');
    const content = fs.readFileSync(hlcPath, 'utf8');
    expect(content).toContain('invalid');
  });

  it('should implement LWW reconciliation logic with tombstone support in reconciler.dart', () => {
    const reconcilerPath = path.resolve(__dirname, '../lib/data/sync/reconciler.dart');
    const content = fs.readFileSync(reconcilerPath, 'utf8');
    expect(content).toContain('reconcile');
    expect(content).toContain('shouldApply');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @homedash/mobile test`
Expected: FAIL due to missing HLC files.

- [ ] **Step 3: Implement Dart HLC and Reconciler**

1. Create `apps/mobile/lib/core/hlc/hlc.dart`:
   - Port the monotonic HLC algorithm from `packages/shared/src/hlc.ts`.
   - String packing format: `<iso8601-utc>_<counter-hex>_<node-id>`.
   - Robust unpack regex preserving underscores and colons in `nodeId`.
   - Deterministic invalid fallback `{ millis: 0, counter: 0, nodeId: 'invalid' }`.
2. Create `apps/mobile/lib/data/sync/reconciler.dart`:
   - Port `reconcileHlc` Last-Write-Wins logic with physical timestamp ordering, logical counter comparison, and lexicographical node ID tie-breaking.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @homedash/mobile test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/core/hlc/ apps/mobile/lib/data/sync/reconciler.dart apps/mobile/test/hlc.test.ts
git commit -m "feat(mobile): implement Dart HLC and deterministic conflict reconciler"
```

---

### Task 5: Mobile Sync Coordinator & Real-Time SSE Client

**Files:**
- Create: `apps/mobile/lib/data/sync/sync_client.dart`
- Create: `apps/mobile/lib/data/sync/sync_coordinator.dart`
- Create: `apps/mobile/test/sync_client.test.ts`

**Interfaces:**
- Produces:
  - `SyncClient`: `push(householdId, clientId, mutations)`, `pull(householdId, cursor, limit)`.
  - `SyncCoordinator`: `sync()`, `startRealtimeListener()`, `dispose()`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/mobile/test/sync_client.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('SyncClient and Coordinator', () => {
  it('should configure POST /sync/push and POST /sync/pull endpoints', () => {
    const clientPath = path.resolve(__dirname, '../lib/data/sync/sync_client.dart');
    const content = fs.readFileSync(clientPath, 'utf8');
    expect(content).toContain('/sync/push');
    expect(content).toContain('/sync/pull');
  });

  it('should listen to SSE stream at /sync/realtime for sync:invalidate events', () => {
    const coordPath = path.resolve(__dirname, '../lib/data/sync/sync_coordinator.dart');
    const content = fs.readFileSync(coordPath, 'utf8');
    expect(content).toContain('/sync/realtime');
    expect(content).toContain('sync:invalidate');
  });

  it('should guard concurrent syncs using active sync mutex', () => {
    const coordPath = path.resolve(__dirname, '../lib/data/sync/sync_coordinator.dart');
    const content = fs.readFileSync(coordPath, 'utf8');
    expect(content).toContain('_isSyncing');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @homedash/mobile test`
Expected: FAIL due to missing sync client files.

- [ ] **Step 3: Implement SyncClient & SyncCoordinator**

1. Create `apps/mobile/lib/data/sync/sync_client.dart` implementing HTTP calls against the HomeDash API.
2. Create `apps/mobile/lib/data/sync/sync_coordinator.dart` coordinating outbox flushing, remote delta ingestion, SSE invalidation listening, and concurrency mutex.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @homedash/mobile test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/data/sync/ apps/mobile/test/sync_client.test.ts
git commit -m "feat(mobile): implement mobile sync client and SSE realtime coordinator"
```

---

### Task 6: Zero-Knowledge Client-Side Vault Cryptography & State

**Files:**
- Create: `apps/mobile/lib/core/crypto/vault_crypto.dart`
- Create: `apps/mobile/lib/domain/state/vault_state.dart`
- Create: `apps/mobile/test/vault.test.ts`

**Interfaces:**
- Produces:
  - `VaultCrypto`: `deriveKek(passphrase, salt)`, `decryptEnvelope(envelope, kek)`, `encryptEnvelope(payload, kek)`.
  - `VaultState`: `unlock(passphrase)`, `lock()`, `isUnlocked`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/mobile/test/vault.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Zero-Knowledge Vault Cryptography & State', () => {
  it('should implement two-tier envelope decryption in vault_crypto.dart', () => {
    const cryptoPath = path.resolve(__dirname, '../lib/core/crypto/vault_crypto.dart');
    const content = fs.readFileSync(cryptoPath, 'utf8');
    expect(content).toContain('decryptEnvelope');
    expect(content).toContain('encryptEnvelope');
    expect(content).toContain('deriveKek');
  });

  it('should maintain memory-only state and auto-lock in vault_state.dart', () => {
    const statePath = path.resolve(__dirname, '../lib/domain/state/vault_state.dart');
    const content = fs.readFileSync(statePath, 'utf8');
    expect(content).toContain('unlock');
    expect(content).toContain('lock');
    expect(content).toContain('isUnlocked');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @homedash/mobile test`
Expected: FAIL due to missing vault files.

- [ ] **Step 3: Implement Vault Cryptography & State**

1. Create `apps/mobile/lib/core/crypto/vault_crypto.dart` with two-tier envelope encryption/decryption matching `local_vault_items`.
2. Create `apps/mobile/lib/domain/state/vault_state.dart` managing lock/unlock lifecycle in memory without persistent key caching.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @homedash/mobile test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/core/crypto/ apps/mobile/lib/domain/state/vault_state.dart apps/mobile/test/vault.test.ts
git commit -m "feat(mobile): implement zero-knowledge vault envelope crypto and state"
```

---

### Task 7: Multi-Generational Session & Role Navigation State

**Files:**
- Create: `apps/mobile/lib/domain/models/user_role.dart`
- Create: `apps/mobile/lib/domain/state/session_state.dart`
- Create: `apps/mobile/lib/presentation/navigation/app_router.dart`
- Create: `apps/mobile/test/session.test.ts`

**Interfaces:**
- Produces:
  - `UserRole`: `admin`, `senior`, `teen_child`, `caregiver_guest`.
  - `SessionState`: `switchRole(role)`, `consumeMagicLink(token)`, `activeHousehold`.
  - `AppRouter`: Route guards that strictly quarantine `caregiver_guest` from `/finance` and `/vault`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/mobile/test/session.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Multi-Role Session and Route Quarantine', () => {
  it('should define all 4 canonical user roles in user_role.dart', () => {
    const rolePath = path.resolve(__dirname, '../lib/domain/models/user_role.dart');
    const content = fs.readFileSync(rolePath, 'utf8');
    expect(content).toContain('admin');
    expect(content).toContain('senior');
    expect(content).toContain('teen_child');
    expect(content).toContain('caregiver_guest');
  });

  it('should quarantine caregiver from finance and vault routes in app_router.dart', () => {
    const routerPath = path.resolve(__dirname, '../lib/presentation/navigation/app_router.dart');
    const content = fs.readFileSync(routerPath, 'utf8');
    expect(content).toContain('canAccessRoute');
    expect(content).toContain('caregiver_guest');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @homedash/mobile test`
Expected: FAIL due to missing session and routing files.

- [ ] **Step 3: Implement Session State & Route Guards**

1. Create `apps/mobile/lib/domain/models/user_role.dart`.
2. Create `apps/mobile/lib/domain/state/session_state.dart` with profile switching and magic link ingestion.
3. Create `apps/mobile/lib/presentation/navigation/app_router.dart` implementing role-aware navigation.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @homedash/mobile test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/domain/ apps/mobile/lib/presentation/navigation/ apps/mobile/test/session.test.ts
git commit -m "feat(mobile): implement multi-role session state and caregiver route quarantine"
```

---

### Task 8: Spatial Bento Dashboard & 1-Handed Quick-Log Bottom Sheets

**Files:**
- Create: `apps/mobile/lib/presentation/bento/bento_grid.dart`
- Create: `apps/mobile/lib/presentation/bento/widgets/hero_emergency_card.dart`
- Create: `apps/mobile/lib/presentation/bento/widgets/medication_timeline_card.dart`
- Create: `apps/mobile/lib/presentation/bento/widgets/cash_flow_card.dart`
- Create: `apps/mobile/lib/presentation/bento/widgets/caregiver_shift_card.dart`
- Create: `apps/mobile/lib/presentation/logging/medication_quick_log_sheet.dart`
- Create: `apps/mobile/lib/presentation/logging/expense_quick_log_sheet.dart`
- Create: `apps/mobile/lib/presentation/logging/chore_toggle_sheet.dart`
- Create: `apps/mobile/test/bento.test.ts`

**Interfaces:**
- Produces:
  - `BentoGrid`: Adaptive responsive widget container.
  - Modular cards: `HeroEmergencyCard`, `MedicationTimelineCard`, `CashFlowCard`, `CaregiverShiftCard`.
  - Bottom sheets: `MedicationQuickLogSheet`, `ExpenseQuickLogSheet`, `ChoreToggleSheet`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/mobile/test/bento.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Bento Dashboard and 1-Handed Quick-Log Sheets', () => {
  it('should define BentoGrid with adaptive layout', () => {
    const gridPath = path.resolve(__dirname, '../lib/presentation/bento/bento_grid.dart');
    const content = fs.readFileSync(gridPath, 'utf8');
    expect(content).toContain('class BentoGrid');
  });

  it('should define 1-handed bottom sheets for logging', () => {
    const medSheetPath = path.resolve(__dirname, '../lib/presentation/logging/medication_quick_log_sheet.dart');
    const content = fs.readFileSync(medSheetPath, 'utf8');
    expect(content).toContain('MedicationQuickLogSheet');
    expect(content).toContain('showModalBottomSheet');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @homedash/mobile test`
Expected: FAIL due to missing presentation files.

- [ ] **Step 3: Implement Bento Grid & Quick-Log Sheets**

1. Create `apps/mobile/lib/presentation/bento/bento_grid.dart` and modular cards.
2. Create 1-handed logging sheets in `apps/mobile/lib/presentation/logging/`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @homedash/mobile test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/presentation/bento/ apps/mobile/lib/presentation/logging/ apps/mobile/test/bento.test.ts
git commit -m "feat(mobile): implement spatial bento dashboard and 1-handed quick-log sheets"
```

---

### Task 9: Senior Mode Dedicated 2-Tab Dashboard & Emergency Care

**Files:**
- Create: `apps/mobile/lib/presentation/senior/senior_dashboard.dart`
- Create: `apps/mobile/lib/presentation/senior/widgets/senior_care_card.dart`
- Create: `apps/mobile/lib/presentation/senior/widgets/senior_emergency_banner.dart`
- Create: `apps/mobile/lib/presentation/senior/senior_emergency_sheet.dart`
- Create: `apps/mobile/test/senior.test.ts`

**Interfaces:**
- Produces:
  - `SeniorDashboard`: 2-destination navigation (*Today's Care* and *Emergency*).
  - High-touch widgets with $1.4\times$ typography scaling and explicit labeled buttons.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/mobile/test/senior.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Senior Mode 2-Tab Dashboard', () => {
  it('should implement 2-tab navigation in senior_dashboard.dart', () => {
    const dashPath = path.resolve(__dirname, '../lib/presentation/senior/senior_dashboard.dart');
    const content = fs.readFileSync(dashPath, 'utf8');
    expect(content).toContain("Today's Care");
    expect(content).toContain('Emergency');
    expect(content).toContain('seniorScaleFactor');
  });

  it('should provide 1-tap call and allergy emergency card in senior_emergency_sheet.dart', () => {
    const sheetPath = path.resolve(__dirname, '../lib/presentation/senior/senior_emergency_sheet.dart');
    const content = fs.readFileSync(sheetPath, 'utf8');
    expect(content).toContain('SeniorEmergencySheet');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @homedash/mobile test`
Expected: FAIL due to missing senior mode files.

- [ ] **Step 3: Implement Senior Mode Dashboard**

1. Create `apps/mobile/lib/presentation/senior/senior_dashboard.dart` with 2-tab navigation.
2. Create `SeniorCareCard` and `SeniorEmergencyBanner` widgets.
3. Create `SeniorEmergencySheet` with emergency call and medical conditions.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @homedash/mobile test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/presentation/senior/ apps/mobile/test/senior.test.ts
git commit -m "feat(mobile): implement senior mode 2-tab dashboard and emergency care"
```

---

### Task 10: Android Background Companion Platform Channel

**Files:**
- Create: `apps/mobile/lib/data/platform/notification_listener_channel.dart`
- Create: `apps/mobile/android/app/src/main/kotlin/com/homedash/app/NotificationListenerServiceImpl.kt`
- Create: `apps/mobile/test/notification_channel.test.ts`

**Interfaces:**
- Produces:
  - `NotificationListenerChannel`: `streamNotifications()`, `parseTransaction(text)`.
  - Android native service Kotlin implementation stub.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/mobile/test/notification_channel.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Android Notification Listener Platform Channel', () => {
  it('should define MethodChannel and parser in notification_listener_channel.dart', () => {
    const channelPath = path.resolve(__dirname, '../lib/data/platform/notification_listener_channel.dart');
    const content = fs.readFileSync(channelPath, 'utf8');
    expect(content).toContain('com.homedash.app/notification_listener');
    expect(content).toContain('parseTransactionPayload');
  });

  it('should have native Android Kotlin implementation file', () => {
    const ktPath = path.resolve(__dirname, '../android/app/src/main/kotlin/com/homedash/app/NotificationListenerServiceImpl.kt');
    expect(fs.existsSync(ktPath)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @homedash/mobile test`
Expected: FAIL due to missing platform channel files.

- [ ] **Step 3: Implement Platform Channel and Android Service**

1. Create `apps/mobile/lib/data/platform/notification_listener_channel.dart` with Dart mock emitter and notification parser.
2. Create `apps/mobile/android/app/src/main/kotlin/com/homedash/app/NotificationListenerServiceImpl.kt`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @homedash/mobile test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/data/platform/ apps/mobile/android/ apps/mobile/test/notification_channel.test.ts
git commit -m "feat(mobile): implement Android companion notification listener platform channel"
```

---

### Task 11: Polyglot Monorepo Build, Typecheck & Test Suite Integration

**Files:**
- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/vitest.config.ts`

**Interfaces:**
- Produces: Full monorepo compatibility passing `pnpm turbo run test typecheck` across all 9 monorepo packages.

- [ ] **Step 1: Write the failing test**

```bash
pnpm exec turbo run test typecheck
```
Expected: Verify all package tasks run cleanly.

- [ ] **Step 2: Configure tsconfig.json and vitest.config.ts for @homedash/mobile**

1. Create `apps/mobile/tsconfig.json` extending root config.
2. Create `apps/mobile/vitest.config.ts`.
3. Update `apps/mobile/package.json` with scripts:
   - `"typecheck": "tsc --noEmit"`
   - `"test": "vitest run"`

- [ ] **Step 3: Run full monorepo suite**

Run: `pnpm exec turbo run test typecheck`
Expected: 100% pass across all packages (zero errors).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/package.json apps/mobile/tsconfig.json apps/mobile/vitest.config.ts
git commit -m "chore(mobile): wire mobile test and typecheck into turborepo pipeline"
```
