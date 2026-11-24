import type { DocArticle } from './types';

export const quickstartDoc: DocArticle = {
  id: 'quickstart',
  title: 'Quickstart Guide',
  description:
    'Deploy HomeDash locally using Docker Compose, configure Caddy reverse proxy routing, and complete initial zero-knowledge household onboarding in minutes.',
  category: 'Getting Started',
  badge: 'Core Setup',
  iconName: 'Terminal',
  sections: [
    {
      id: 'prerequisites',
      title: 'Prerequisites & Monorepo Overview',
      content:
        'HomeDash is designed to run self-hosted on bare metal or local home server hardware (Raspberry Pi 5, Intel NUC, NAS, or home lab cluster). Before initiating deployment, verify that your host system satisfies the runtime requirements.',
      table: {
        headers: ['Component', 'Minimum Requirement', 'Recommended'],
        rows: [
          ['Docker Engine', '24.0 or higher', '26.0+ with containerd'],
          ['Docker Compose', 'v2.20 or higher', 'v2.27+ with compose spec'],
          ['System Memory', '2 GB RAM', '4 GB+ RAM'],
          ['Storage', '10 GB free disk space', '50 GB+ NVMe / SSD'],
          ['Network', 'Local LAN connectivity', 'Gigabit Ethernet with mDNS'],
        ],
      },
    },
    {
      id: 'docker-compose-setup',
      title: 'Docker Compose Setup',
      content:
        'The primary production deployment profile encapsulates the PostgreSQL 16 database, Valkey 7 in-memory cache, MinIO S3-compatible encrypted object storage, the Node.js backend daemon, and the web application into an isolated container network.',
      snippets: [
        {
          language: 'bash',
          filename: 'terminal',
          description: 'Clone the repository and launch all infrastructure services in detached mode',
          code: `# Clone repository and navigate to root
git clone https://github.com/homedash/homedash.git
cd homedash

# Copy template configuration
cp .env.example .env

# Spin up services in detached background mode
docker compose up -d`,
        },
        {
          language: 'yaml',
          filename: 'docker-compose.yml',
          description: 'Core container composition defining database, cache, storage, and application tiers',
          code: `services:
  postgres:
    image: postgres:16-alpine
    container_name: homedash-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: homedash
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-homedash_secret}
      POSTGRES_DB: homedash
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  valkey:
    image: valkey/valkey:7.2-alpine
    container_name: homedash-valkey
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - valkey_data:/data

  minio:
    image: minio/minio:RELEASE.2024-05-10T01-41-38Z
    container_name: homedash-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: homedash
      MINIO_ROOT_PASSWORD: \${MINIO_ROOT_PASSWORD:-homedash_minio_secret}
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    volumes:
      - minio_data:/data

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    container_name: homedash-backend
    restart: unless-stopped
    depends_on:
      - postgres
      - valkey
      - minio
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgres://homedash:\${POSTGRES_PASSWORD}@postgres:5432/homedash
      VALKEY_HOST: valkey
      VALKEY_PORT: 6379
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
    ports:
      - "127.0.0.1:3000:3000"

  caddy:
    image: caddy:2-alpine
    container_name: homedash-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

volumes:
  postgres_data:
  valkey_data:
  minio_data:
  caddy_data:
  caddy_config:`,
        },
      ],
    },
    {
      id: 'reverse-proxy-caddy',
      title: 'Reverse Proxy Routing with Caddy',
      content:
        'Caddy provides automatic TLS provisioning, reverse proxy routing, and transparent HTTP/2 and HTTP/3 multiplexing. The Caddy reverse proxy maps incoming local requests to the frontend web application and backend API services seamlessly.',
      snippets: [
        {
          language: 'caddyfile',
          filename: 'Caddyfile',
          description: 'Reverse proxy configuration for local LAN hostname or domain with automated TLS',
          code: `# Local domain or LAN hostname configuration
homedash.local {
  # Reverse proxy API and SSE realtime streams to backend
  handle /api/* {
    reverse_proxy 127.0.0.1:3000 {
      header_up Host {host}
      header_up X-Real-IP {remote_host}
      header_up X-Forwarded-For {remote_host}
      header_up X-Forwarded-Proto {scheme}

      # Flush immediately for Server-Sent Events (SSE)
      flush_interval -1
    }
  }

  # Route frontend web assets
  handle {
    reverse_proxy 127.0.0.1:5173
  }

  # Security headers
  header {
    X-Content-Type-Options nosniff
    X-Frame-Options DENY
    Referrer-Policy no-referrer
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
  }
}`,
        },
      ],
    },
    {
      id: 'household-onboarding',
      title: 'Initial Household Onboarding',
      content:
        'Once containers are running and healthy, navigate to http://localhost:5173 or your configured local domain to initiate first-run household onboarding.',
      subsections: [
        {
          id: 'onboarding-step-1',
          title: '1. Primary Administrator Enrollment',
          content:
            'The initial registrant is automatically granted the Primary Administrator role. Provide your display name and register a FIDO2 WebAuthn passkey (Touch ID, Windows Hello, YubiKey, or Android biometric key). No plaintext passwords ever traverse the network.',
        },
        {
          id: 'onboarding-step-2',
          title: '2. Client-Side Master Key Generation',
          content:
            'Your browser derives the Household Master Key (HMK) locally using Argon2id with 64MB memory cost and 3 iterations. The unencrypted master key never leaves the client browser sandbox.',
        },
        {
          id: 'onboarding-step-3',
          title: '3. Break-Glass Recovery Escrow Setup',
          content:
            'Generate Shamir Secret Sharing emergency break-glass recovery shards with a 2-of-3 threshold. Distribute physical shard printouts or export encrypted backup QR cards to designated family stewards.',
        },
        {
          id: 'onboarding-step-4',
          title: '4. Household Member Invitations',
          content:
            'Invite family members via localized time-limited invitation tokens or direct QR code scans. New members enroll their personal WebAuthn credentials and receive encrypted shares of shared family vaults.',
        },
      ],
    },
  ],
};
