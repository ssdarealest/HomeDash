import type { DocArticle } from './types';

export const environmentVariablesDoc: DocArticle = {
  id: 'environment-variables',
  title: 'Environment Variables Reference',
  description:
    'Comprehensive reference guide of all configuration environment flags, secret tokens, and network settings for self-hosting HomeDash.',
  category: 'Configuration',
  badge: 'Reference',
  iconName: 'Server',
  sections: [
    {
      id: 'env-overview',
      title: 'Configuration Architecture',
      content:
        'HomeDash strictly adheres to Twelve-Factor App methodology for configuration management. All runtime services load environment variables from the host process environment or a root .env file. Secrets must be generated using cryptographically secure random generators.',
      snippets: [
        {
          language: 'bash',
          filename: '.env.example',
          description: 'Example environment configuration file template',
          code: `# =================================================================
# HOMEDASH SYSTEM CONFIGURATION
# =================================================================

# Server & Network
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173

# PostgreSQL Database
POSTGRES_USER=homedash
POSTGRES_PASSWORD=generate_strong_password_here
POSTGRES_DB=homedash
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgres://homedash:generate_strong_password_here@postgres:5432/homedash

# Valkey In-Memory Cache & Event Bus
VALKEY_HOST=valkey
VALKEY_PORT=6379
VALKEY_PASSWORD=
VALKEY_DB=0

# MinIO Encrypted Blob Storage
MINIO_ROOT_USER=homedash
MINIO_ROOT_PASSWORD=generate_minio_secret_key_here
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_BUCKET=homedash-vault
MINIO_USE_SSL=false

# Authentication & Session Security
JWT_SECRET=generate_minimum_64_character_hex_or_base64_secret_here

# WebAuthn / FIDO2 Relying Party
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME="HomeDash Local"
WEBAUTHN_ORIGIN=http://localhost:5173`,
        },
      ],
    },
    {
      id: 'postgres-env-vars',
      title: 'PostgreSQL Database Settings (POSTGRES_*)',
      content:
        'PostgreSQL 16 serves as the persistent ACID storage engine for relational metadata, event journals, and CDC sync highwater marks.',
      table: {
        headers: ['Variable', 'Default', 'Required', 'Description'],
        rows: [
          ['POSTGRES_USER', 'homedash', 'Yes', 'PostgreSQL database superuser / application owner username.'],
          ['POSTGRES_PASSWORD', '(none)', 'Yes', 'Master password for PostgreSQL database authentication.'],
          ['POSTGRES_DB', 'homedash', 'Yes', 'Primary database catalog name created upon container initialization.'],
          ['POSTGRES_HOST', 'postgres', 'Yes', 'Host address or Docker service name of the PostgreSQL server.'],
          ['POSTGRES_PORT', '5432', 'No', 'PostgreSQL TCP listening port (default: 5432).'],
          ['DATABASE_URL', '(derived)', 'No', 'Full connection URI string. When supplied, overrides individual POSTGRES_* parameters.'],
        ],
      },
    },
    {
      id: 'valkey-env-vars',
      title: 'Valkey Cache & Realtime Pub/Sub (VALKEY_*)',
      content:
        'Valkey 7 provides low-latency caching, ephemeral session tracking, rate limiting, and the Redis-compatible Pub/Sub bus backing SSE streams.',
      table: {
        headers: ['Variable', 'Default', 'Required', 'Description'],
        rows: [
          ['VALKEY_HOST', 'valkey', 'Yes', 'Host address or container name of the Valkey cache instance.'],
          ['VALKEY_PORT', '6379', 'No', 'TCP listening port of the Valkey daemon (default: 6379).'],
          ['VALKEY_PASSWORD', '(empty)', 'No', 'Optional AUTH password for secured Valkey installations.'],
          ['VALKEY_DB', '0', 'No', 'Logical database index (0-15) dedicated to HomeDash cache keys.'],
        ],
      },
    },
    {
      id: 'minio-env-vars',
      title: 'MinIO Encrypted Object Storage (MINIO_*)',
      content:
        'MinIO delivers S3-compatible blob storage for client-side encrypted document receipts, medical records, and camera archives.',
      table: {
        headers: ['Variable', 'Default', 'Required', 'Description'],
        rows: [
          ['MINIO_ROOT_USER', 'homedash', 'Yes', 'Administrative access key for MinIO S3 API operations.'],
          ['MINIO_ROOT_PASSWORD', '(none)', 'Yes', 'Administrative secret key for MinIO S3 API authentication.'],
          ['MINIO_ENDPOINT', 'minio', 'Yes', 'Hostname or IP address for internal S3 client communication.'],
          ['MINIO_PORT', '9000', 'No', 'S3 API service port (default: 9000).'],
          ['MINIO_BUCKET', 'homedash-vault', 'No', 'Default S3 bucket initialized for encrypted media and receipt blobs.'],
          ['MINIO_USE_SSL', 'false', 'No', 'Boolean flag determining whether TLS is enforced for internal S3 calls.'],
        ],
      },
    },
    {
      id: 'auth-webauthn-env-vars',
      title: 'Authentication & Passkey Settings (JWT_SECRET, WEBAUTHN_*)',
      content:
        'Cryptographic parameters managing stateless session tokens and FIDO2 / WebAuthn hardware passkey verification.',
      table: {
        headers: ['Variable', 'Default', 'Required', 'Description'],
        rows: [
          ['JWT_SECRET', '(none)', 'Yes', 'High-entropy secret key (min 64 hex characters) used for signing JWT session tokens.'],
          ['WEBAUTHN_RP_ID', 'localhost', 'Yes', 'Relying Party ID matching the domain origin for FIDO2 passkey attestation.'],
          ['WEBAUTHN_RP_NAME', 'HomeDash Local', 'No', 'Human-readable Relying Party brand displayed on authenticator prompts.'],
          ['WEBAUTHN_ORIGIN', 'http://localhost:5173', 'Yes', 'Expected client origin URI strictly verified during passkey assertion.'],
        ],
      },
    },
    {
      id: 'server-runtime-env-vars',
      title: 'Server Runtime & Ports (PORT, HOST, NODE_ENV)',
      content:
        'General execution environment flags governing listening sockets, CORS headers, and process optimization modes.',
      table: {
        headers: ['Variable', 'Default', 'Required', 'Description'],
        rows: [
          ['PORT', '3000', 'No', 'HTTP port on which the backend Fastify/Hono API daemon listens.'],
          ['HOST', '0.0.0.0', 'No', 'Network interface binding address for the HTTP listener.'],
          ['NODE_ENV', 'development', 'No', 'Runtime execution environment (production, development, or test).'],
          ['CORS_ORIGIN', '*', 'No', 'Allowed Origin header values for Cross-Origin Resource Sharing.'],
        ],
      },
    },
  ],
};
