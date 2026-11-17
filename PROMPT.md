# MASTER SYSTEM & ARCHITECTURE PROMPT: "FAMILY OS" (OPEN-CORE HYBRID PLATFORM)

## 1. ROLE & OBJECTIVE
Act as a Principal Software Architect, Product Designer, and Full-Stack Engineering Lead. Your task is to design, architect, and implement **Family OS**—an open-core, local-first, cross-platform application (Mobile + Webapp/Desktop) that supports both **Self-Hosting (Docker)** and **Managed Cloud** deployments.

The platform unifies **household financial management**, **multi-generational health & caregiver coordination**, **zero-knowledge emergency document vaults**, and **daily home operations** into a single, modular, privacy-first ecosystem.

---

## 2. PRODUCT VISION & CORE PROBLEM
- **One-Sentence Pitch:** A mobile-first, local-first operating system for modern and multi-generational families to coordinate finances, elder/child healthcare, caregiver shifts, emergency vaults, and household logistics in one shared, role-scoped workspace.
- **The Problem:** Existing solutions are fragmented and built for the wrong scale. Enterprise healthcare/EHR tools are too complex for families; standard finance apps ignore shared household logistics; and daily family coordination collapses across scattered chat messages, paper notes, and missed calls. Furthermore, privacy-conscious users lack a unified solution they can self-host on their own home servers while retaining seamless mobile convenience.

---

## 3. CORE & EXTENDED FEATURE MODULES (PLUG-AND-PLAY ARCHITECTURE)
To prevent feature bloat, design the system around **toggleable modules** enabled during household onboarding:

### Module A: Family Finance & Automated Billing Ledger
- **Shared & Personal Ledgers:** Track household cash flow, shared budgets, individual allowances, and **Sinking Funds** (e.g., medical reserves, children's education, travel).
- **Automated Bank & E-Wallet Ingestion (Hybrid-Ready):**
  - *Cloud Mode:* Webhook adapters for Open Banking / payment aggregators (e.g., Plaid, GoCardless, SePay, Casso).
  - *Self-Host Mode:* A lightweight **Android Companion Listener** (using Android `NotificationListenerService` with local regex/LLM parsing) that securely pushes bank/e-wallet push notifications via signed webhooks to the user's self-hosted instance, plus CSV/OFX import.
- **Automated Utility & Recurring Bill Engine:**
  - Dedicated inbound email address (`bills@your-domain` or IMAP polling) + OCR/Vision-LLM pipeline to parse electronic utility invoices (electricity, water, internet, mobile plans), extract billing periods/amounts, auto-log expenses, and alert on abnormal usage spikes.

### Module B: Multi-Generational Care & Health Hub
- **Shared Medication Log:** Dose schedules with 1-tap check-off timestamps, photo verification option, inventory countdown (auto-alert when pills run low), and **escalation alerts** (if a critical dose is missed by >30 minutes, escalate notification to primary household admins).
- **Caregiver Shift-Swap & Visit Calendar:** Shared timeline for family members, private aides, or babysitters to claim, swap, or log care shifts and check-in/check-out notes.
- **Personal Health Records (PHR):** Vitals log (blood pressure, blood glucose, heart rate, temperature with trend charts), child/senior vaccination schedules, lab result/prescription image archive, and a prominent **Allergy & Medical Condition Banner** pinned for emergencies.

### Module C: Zero-Knowledge Vault & Household Lifecycle
- **Encrypted Family Vault:** Client-side end-to-end encrypted (E2EE) storage for health insurance cards, national IDs, birth certificates, property deeds, and emergency contacts.
- **Break-Glass Emergency Protocol:** Time-delayed emergency access (24–48 hours). If a primary admin is incapacitated, a designated trusted family member can request emergency vault unlock; if not vetoed by the admin within the cooldown window, read access is automatically granted.
- **Asset & Renewal Tracker:** Automated 30/7/1-day reminders for vehicle registration/insurance, school tuition deadlines, appliance warranties, and maintenance schedules (e.g., AC servicing, water filter replacement).
- **Home Wiki:** Structured quick-reference cards for household operations (Wi-Fi QR, main water/breaker shutoff locations, appliance manuals, trusted plumber/electrician contacts).

### Module D: Daily Household Operations
- **Real-Time Collaborative Grocery List:** Offline-capable sync across devices, auto-categorized by supermarket aisle, with a 1-tap **"Checkout & Log Expense"** flow that converts the receipt directly into a financial transaction.
- **Health-Aware Weekly Meal Planner:** Shared meal calendar that cross-references planned dishes against family members' recorded allergies or dietary restrictions (e.g., low-sodium for hypertensive elders).
- **Recurring Chores & Gamification:** Assignable household tasks with recurrence rules and optional allowance/point rewards for children.

---

## 4. MULTI-ROLE RBAC & OMNICHANNEL COMMUNICATION
Design strict Role-Based Access Control (RBAC) enforced at both the API and database row levels:
1. **Household Admin (Parents / Heads of Household):** Full read/write access to all enabled modules, vault management, billing, and member permissions.
2. **Senior Mode (Elderly Parents):** Simplified, high-accessibility interface. Hides complex financial charts; exposes only today's medication checklist (1-tap *"I took this"*), upcoming doctor visits, and a 1-tap Emergency Call SOS button.
3. **Child / Teen:** Scoped access to assigned chores, school/activity schedule, meal plan, and personal allowance balance.
4. **Caregiver / Guest (Temporary Access):** Time-bound access granted via expiring QR code or magic link. Strictly scoped to active shift schedules, care instructions, medication checklists, and relevant chores. **Zero access** to finances or the E2EE Vault.

### Omnichannel Notification Bridge
Because elderly relatives and domestic aides often struggle with new apps, implement a pluggable **Two-Way Bot Bridge** (Telegram Bot API, Zalo OA, Web Push, SMS):
- Outbound: *"8:00 AM Reminder: Time for Grandma's Blood Pressure medication (1 tablet)."*
- Inbound: Interactive inline buttons (`[✅ Taken]`, `[⏰ Snooze 15m]`) directly inside the chat app that update the core database in real time.

---

## 5. TECHNICAL ARCHITECTURE & ENGINEERING PRINCIPLES
1. **Local-First & Offline-First Core:**
   - The app must work seamlessly in hospital basements (weak signal during emergencies) and underground supermarkets.
   - Maintain a local encrypted database on client devices (SQLite on mobile, IndexedDB/OPFS on web) with a deterministic sync engine (CRDTs or Hybrid Logical Clocks) for automatic background conflict resolution.
2. **Deployment Parity (Self-Host & Cloud):**
   - Provide a single-command `docker-compose.yml` for self-hosters (bundling the API server, PostgreSQL, Valkey/Redis, and MinIO for S3-compatible object storage).
   - Abstract external dependencies (Auth/OIDC/Passkeys, Object Storage, Push/Bot Providers, OCR/LLM endpoints) behind clean adapter interfaces so Self-Host and Cloud run the exact same codebase.
3. **Security & Cryptography:**
   - **Zero-Knowledge Vault:** Derive keys client-side using `Argon2id` and encrypt sensitive documents/fields using `XChaCha20-Poly1305` (or `AES-256-GCM`) before transmission. Neither the Cloud operator nor a compromised host disk can read Vault contents without the household master key.
   - **Audit Logging:** Immutable audit trail for all vault accesses, break-glass requests, permission changes, and medication log edits.

---

## 6. RECOMMENDED TECH STACK
Use a modern, type-safe, high-performance stack optimized for low-resource homelab Docker containers and smooth cross-platform UIs:
- **Mobile App (iOS & Android):** **Flutter (Dart)**
  - *Why:* First-class native **Material 3** rendering engine, 120fps performance on budget devices for seniors, local SQLite (`drift` / `powersync`), and native Android platform channels for the background `NotificationListenerService`.
- **Webapp & Desktop:** **Next.js (React + TypeScript)** or **Vite + TanStack Router**, packaged with **Tauri** for lightweight native desktop apps (Windows/macOS/Linux).
- **Backend API & Workers:** **TypeScript (Node.js/Bun + Fastify or Hono)** or **Go**
  - *Database:* **PostgreSQL 17+** (with Row-Level Security) + **Valkey/Redis** + **BullMQ** (for cron-based medication reminders, escalation timers, and OCR queues).
  - *Validation & API Contract:* Shared **Zod** schemas + **OpenAPI / tRPC** for end-to-end type safety.
- **AI / OCR Pipeline:** Pluggable provider interface supporting both cloud APIs and local self-hosted models (e.g., Ollama / Tesseract / PaddleOCR) for parsing utility bills and receipts privately.

---

## 7. UI/UX DESIGN SYSTEM GUIDELINES

### Mobile UI/UX: Strict Material 3 (Material You)
- **Color & Surface System:** Implement dynamic color palettes (`ColorScheme.fromSeed`) using tonal surface elevation (`surfaceContainerLow`, `surfaceContainerHigh`) instead of heavy drop shadows.
- **Navigation & Ergonomics:** Bottom `NavigationBar` capped at 3–4 destinations dynamically tailored to enabled modules. Use modal `BottomSheet` components for rapid 1-handed logging (adding an expense, checking off medication, adding a grocery item). Touch targets must be $\ge 48 \times 48\text{dp}$.
- **Senior Mode Adaptive Theme:** A toggleable accessibility profile that applies high-contrast color tokens, scales typography by `1.35x–1.5x`, removes gesture-only interactions in favor of explicit labeled buttons, and locks navigation to a 2-tab layout (*Today's Care* & *Emergency*).

### Desktop & Webapp UI/UX: Material 3 + Glassmorphism Hybrid
- **Spatial Bento Dashboard:** Leverage wide viewports with an asymmetric Bento Grid displaying live widgets (Cash Flow Summary, Today's Medication Timeline, Active Shifts, Upcoming Renewals).
- **Visual Language:** Combine **Material 3** structural anatomy, typography scales, and semantic color tokens with **Glassmorphic** surface treatments on desktop:
  - Translucent layered cards (`backdrop-filter: blur(16px) saturate(180%)`).
  - Subtle `1px` inner-glow borders (`rgba(255, 255, 255, 0.14)` in dark mode; `rgba(255, 255, 255, 0.6)` in light mode) over soft, low-contrast ambient mesh backgrounds.
  - Provide a user-selectable theme switch between **Glassmorphic Workspace** and **Solid Material 3** (for maximum contrast/accessibility).

---

## 8. EXECUTION ROADMAP & DELIVERABLES
Structure your engineering output systematically across these phases. **Start with Phase 1 now** and wait for confirmation before proceeding to subsequent phases:

1. **Phase 1 — System Architecture & Database Schema:**
   - Complete monorepo folder structure.
   - Normalized PostgreSQL schema (with multi-tenant `household_id`, RBAC roles, audit logs, and module toggles) + Local SQLite sync schema.
   - E2EE Vault & Break-Glass cryptographic sequence diagrams.
2. **Phase 2 — Backend Core, Auth & Self-Host Infrastructure:**
   - Production-ready `docker-compose.yml` and environment configuration.
   - Auth flows (Passkeys/OIDC + Temporary Caregiver Magic Links) and RBAC middleware.
3. **Phase 3 — Financial & Care Core APIs + Ingestion Workers:**
   - REST/tRPC endpoints for Finance, Medication Logs, Shifts, and Vault.
   - Notification webhook parser (Android companion payload) + Email/OCR utility bill worker + Telegram/Zalo bot webhook handler.
4. **Phase 4 — Cross-Platform Frontend (Flutter M3 & Web Glassmorphic UI):**
   - Design system tokens (M3 ThemeData + Web CSS/Tailwind Glassmorphic primitives).
   - Core screens: Onboarding Module Selector, Unified Bento Dashboard, Quick-Log Bottom Sheets, Senior Mode View, and E2EE Vault UI.