# Design Specification: Phase 6 — Multi-Device P2P Sync & Production Hardening

## 1. Executive Summary

Phase 6 delivers the final architectural capstone for **HomeDash (Family OS)**:
1. **Multi-Device Local-First P2P Sync**: An encrypted, serverless direct peer-to-peer synchronization engine (`packages/sync-engine/src/p2p`) enabling family devices on the same local Wi-Fi / LAN to discover one another via mDNS/broadcast and synchronize HLC-ordered mutations directly without internet or cloud server availability.
2. **Web & Desktop Glassmorphic Bento Workspace**: A wide-viewport Material 3 + Glassmorphic dashboard (`apps/mobile` or web client) displaying spatial bento cards for Household Cash Flow, Medication Timeline, Active Caregiver Shifts, Emergency Contacts, and Vault Break-Glass status, complete with user-toggleable Glassmorphic and Solid M3 themes.
3. **Production Hardening, Benchmarking & Security Audit**: Docker production orchestration verification, 1,000-operation HLC synchronization benchmarks, and automated security audit test suites confirming zero plaintext leaks, strict caregiver quarantine, and timing-safe cryptographic verification.

---

## 2. Architecture & Component Decomposition

### 2.1 Multi-Device P2P Sync Engine (`packages/sync-engine`)
When a disaster strikes, home internet is severed, or a family member is in a basement with local Wi-Fi but no WAN uplink, devices must discover each other and exchange offline mutation logs directly:
- **Discovery Service (`PeerDiscoveryManager`)**:
  - Broadcasts/advertises local peer availability with household identifier, peer instance ID, and current local HLC timestamp.
  - Implements discovery listeners with automated heartbeat expiration and peer liveness tracking.
- **P2P Handshake & Mutual Authentication (`P2PSessionCoordinator`)**:
  - Mutual challenge-response authentication using the household shared key.
  - Generates ephemeral AES-256-GCM session keys for peer-to-peer payload encryption.
- **Direct CDC Delta Exchange (`P2PSyncTransport`)**:
  - Pull/Push protocol for outbox changesets.
  - Reconciles mutations through the existing deterministic `HlcReconciler` with Last-Write-Wins (LWW) conflict resolution.

### 2.2 Desktop & Web Glassmorphic Bento Grid
The dashboard brings full desktop and large-tablet ergonomics:
- **Layout**: Asymmetric Bento Grid (2-column, 3-column, or 4-column adaptive layout based on viewport width $\ge 1024\text{dp}$).
- **Surface Styling**:
  - *Glassmorphic Mode*: Semi-transparent surfaces (`rgba(255, 255, 255, 0.08)` dark, `rgba(255, 255, 255, 0.65)` light), `backdrop-filter: blur(16px) saturate(180%)`, and `1px` translucent inner-glow border (`rgba(255, 255, 255, 0.14)`).
  - *Solid M3 Mode*: Opaque `surfaceContainer` tokens with high-contrast accessibility borders.
- **Live Widgets**:
  - *Cash Flow Bento*: Monthly expenses, sinking funds progress, and bill spike alerts.
  - *Care & Meds Bento*: Daily medication checklist, missed dose escalation banners, and active caregiver shifts.
  - *Household Ops Bento*: Live grocery counter, pending child chores, and meal plan preview.
  - *Zero-Knowledge Vault Bento*: Active break-glass status indicator, emergency contact cards.

### 2.3 Production Hardening & Benchmarking
- **System Benchmarking**:
  - Ingestion throughput: >500 transactions/second.
  - HLC reconciler: 1,000 concurrent mutations resolved in <50ms.
  - P2P delta sync: Chunked transfer and zero-copy JSON parsing.
- **Automated Security & Audit Suite**:
  - Comprehensive end-to-end verification ensuring zero server-side plaintext access to vault keys or sensitive escrow secrets.
  - Boundary assertions confirming Caregiver magic link sessions cannot execute financial transactions or access break-glass escrow shares.

---

## 3. Data Contracts & Protocol Additions

### 3.1 P2P Protocol Schemas (`packages/protocol/src/p2p.ts`)
- `PeerAnnouncement`: `{ householdId: string, peerId: string, deviceName: string, hlcTimestamp: string, port: number }`
- `PeerHandshakeRequest`: `{ peerId: string, nonce: string, signature: string }`
- `PeerHandshakeResponse`: `{ accepted: boolean, sessionNonce: string, sessionSignature: string }`
- `PeerSyncPayload`: `{ senderPeerId: string, mutations: OutboxMutationRecord[], baseHlc: string }`

---

## 4. Verification & Testing Strategy

- `packages/sync-engine/test/p2p-sync.test.ts`: Test peer discovery, mutual authentication, challenge rejection on mismatched household, and bidirectional delta synchronization.
- `apps/mobile/test/bento-glassmorphic.test.ts`: Verify desktop Bento Grid layout adaptation, theme mode switching (glassmorphic vs solid), and widget rendering.
- `apps/server/test/benchmarks-and-audit.test.ts`: Stress testing, HLC 1000-mutation reconciliation benchmark, and comprehensive security audit.
- Full monorepo verification: `pnpm exec turbo run test typecheck` (all packages green).
