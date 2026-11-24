import type { DocArticle } from './types';

export const apiReferenceDoc: DocArticle = {
  id: 'api-reference',
  title: 'API Reference & OpenAPI Specification',
  description:
    'Comprehensive REST and Realtime Server-Sent Events (SSE) API documentation covering Auth, Sync, Daily Ops, Health, Finance, and Vault Break-Glass.',
  category: 'API & Protocols',
  badge: 'REST & SSE',
  iconName: 'Code',
  sections: [
    {
      id: 'api-overview',
      title: 'API Architecture & Base URL',
      content:
        'The HomeDash API is built on high-performance Hono and OpenAPI 3.1 specifications. All JSON payloads are strongly validated via Zod schemas defined in @homedash/protocol. All authenticated endpoints require a Bearer JWT session token or valid session cookie.',
      snippets: [
        {
          language: 'bash',
          filename: 'curl',
          description: 'Health check probe verifying daemon status and database connectivity',
          code: `curl -s -X GET http://localhost:3000/health \\
  -H "Accept: application/json"

# Response:
# {"status":"ok","timestamp":"2026-11-24T12:00:00.000Z"}`,
        },
      ],
    },
    {
      id: 'auth-endpoints',
      title: 'Authentication & WebAuthn Endpoints',
      content:
        'Passwordless authentication powered by FIDO2 / WebAuthn public key attestation and assertion ceremony.',
      table: {
        headers: ['Method', 'Endpoint', 'Description', 'Auth Required'],
        rows: [
          ['POST', '/api/v1/auth/register-challenge', 'Generates FIDO2 registration challenge options for the client authenticator.', 'No'],
          ['POST', '/api/v1/auth/register-verify', 'Verifies WebAuthn attestation response and issues initial session credentials.', 'No'],
          ['POST', '/api/v1/auth/login-challenge', 'Generates FIDO2 assertion challenge options for login.', 'No'],
          ['POST', '/api/v1/auth/login-verify', 'Verifies WebAuthn assertion signature and issues signed JWT session token.', 'No'],
          ['GET', '/api/v1/auth/session', 'Returns currently authenticated user profile, roles, and household membership.', 'Yes (Bearer)'],
          ['POST', '/api/v1/auth/logout', 'Invalidates current active session token and clears cookies.', 'Yes (Bearer)'],
        ],
      },
    },
    {
      id: 'sync-realtime-endpoints',
      title: 'Sync Engine & Realtime SSE Stream',
      content:
        'Local-first Change Data Capture (CDC) synchronization endpoints pairing push/pull delta replication with Server-Sent Events (SSE).',
      table: {
        headers: ['Method', 'Endpoint', 'Description', 'Auth Required'],
        rows: [
          ['POST', '/api/v1/sync/push', 'Pushes offline local mutation batches with client HLC timestamps.', 'Yes (Bearer)'],
          ['POST', '/api/v1/sync/pull', 'Pulls remote CDC mutation log entries above highwater mark cursor.', 'Yes (Bearer)'],
          ['GET', '/api/v1/realtime/stream', 'Server-Sent Events (SSE) persistent stream delivering live mutation broadcasts.', 'Yes (Bearer)'],
        ],
      },
      snippets: [
        {
          language: 'typescript',
          filename: 'realtime-sse-client.ts',
          description: 'Client connection listening to live Server-Sent Events mutation stream',
          code: `// Connect to HomeDash Realtime SSE mutation stream
const eventSource = new EventSource('/api/v1/realtime/stream', {
  withCredentials: true,
});

eventSource.addEventListener('mutation', (event) => {
  const mutation = JSON.parse(event.data);
  console.log('Realtime change received:', mutation.table, mutation.operation);
  // Reconcile into local reactive state or SQLite store
});

eventSource.onerror = (err) => {
  console.error('SSE connection dropped, falling back to exponential backoff', err);
};`,
        },
      ],
    },
    {
      id: 'daily-ops-endpoints',
      title: 'Daily Operations & Chores API',
      content:
        'Endpoints orchestrating household schedules, rotating chore assignments, shared grocery lists, and family calendars.',
      table: {
        headers: ['Method', 'Endpoint', 'Description', 'Auth Required'],
        rows: [
          ['GET', '/api/v1/daily-ops/tasks', 'Lists pending and completed family tasks filtered by assignee or date.', 'Yes (Bearer)'],
          ['POST', '/api/v1/daily-ops/tasks', 'Creates a new scheduled task with reminder rules.', 'Yes (Bearer)'],
          ['GET', '/api/v1/daily-ops/chores', 'Retrieves recurring chore matrix and rotation leaderboard.', 'Yes (Bearer)'],
          ['POST', '/api/v1/daily-ops/chores/rotate', 'Advances chore assignment rotation to the next eligible member.', 'Yes (Bearer)'],
          ['GET', '/api/v1/daily-ops/grocery', 'Retrieves real-time collaborative grocery list items.', 'Yes (Bearer)'],
        ],
      },
    },
    {
      id: 'health-endpoints',
      title: 'Health & Multi-Gen Care API',
      content:
        'Medication administration tracking, vital sign time-series metrics, and multi-generational caregiver shift logs.',
      table: {
        headers: ['Method', 'Endpoint', 'Description', 'Auth Required'],
        rows: [
          ['GET', '/api/v1/health/medications', 'Lists scheduled prescriptions, dosages, and administration intervals.', 'Yes (Bearer)'],
          ['POST', '/api/v1/health/medications/log', 'Logs confirmed medication ingestion event with timestamp and witness.', 'Yes (Bearer)'],
          ['GET', '/api/v1/health/vitals', 'Queries encrypted vital sign timeseries (blood pressure, glucose, SpO2).', 'Yes (Bearer)'],
          ['POST', '/api/v1/health/vitals', 'Appends new client-encrypted vital measurement record.', 'Yes (Bearer)'],
          ['POST', '/api/v1/health/shifts/handoff', 'Records caregiver shift handoff notes and clinical observations.', 'Yes (Bearer)'],
        ],
      },
    },
    {
      id: 'finance-endpoints',
      title: 'Family Finance & Automated OCR Ingestion API',
      content:
        'Encrypted bank accounts, double-entry ledger transactions, sinking funds, and OCR receipt processing.',
      table: {
        headers: ['Method', 'Endpoint', 'Description', 'Auth Required'],
        rows: [
          ['GET', '/api/v1/finance/accounts', 'Retrieves family accounts and balance summary ledger.', 'Yes (Bearer)'],
          ['POST', '/api/v1/finance/transactions', 'Creates an envelope-encrypted financial transaction record.', 'Yes (Bearer)'],
          ['GET', '/api/v1/finance/sinking-funds', 'Lists envelope-budgeted sinking funds and target funding progress.', 'Yes (Bearer)'],
          ['POST', '/api/v1/finance/receipts/ocr', 'Ingests receipt image, extracts line items via OCR, and stages expense draft.', 'Yes (Bearer)'],
        ],
      },
    },
    {
      id: 'vault-break-glass-endpoints',
      title: 'Zero-Knowledge Vault & Break-Glass Escrow API',
      content:
        'Storage of envelope-encrypted confidential documents, master secrets, and Shamir 2-of-3 break-glass recovery ceremony.',
      table: {
        headers: ['Method', 'Endpoint', 'Description', 'Auth Required'],
        rows: [
          ['GET', '/api/v1/vault/items', 'Fetches client-side encrypted vault items with their ciphertext and DEK wrappers.', 'Yes (Bearer)'],
          ['POST', '/api/v1/vault/items', 'Stores a newly encrypted zero-knowledge vault item.', 'Yes (Bearer)'],
          ['POST', '/api/v1/vault/break-glass/initiate', 'Initiates 48-hour emergency break-glass countdown and broadcasts alerts.', 'Yes (Bearer)'],
          ['POST', '/api/v1/vault/break-glass/veto', 'Active household administrator veto canceling an in-flight recovery request.', 'Yes (Bearer)'],
          ['POST', '/api/v1/vault/break-glass/recover', 'Submits 2-of-3 Shamir shards to reconstruct vault credentials after cooldown.', 'Yes (Recovery)'],
        ],
      },
    },
  ],
};
