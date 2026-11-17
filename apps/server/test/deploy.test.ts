import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

describe('Self-Host Deployment Configuration', () => {
  const rootDir = join(__dirname, '../../..');
  const deployDir = join(rootDir, 'deploy');

  it('should verify production docker-compose.yml topology and health checks', () => {
    const composePath = join(deployDir, 'docker-compose.yml');
    expect(existsSync(composePath), 'deploy/docker-compose.yml must exist').toBe(true);

    const composeContent = readFileSync(composePath, 'utf-8');
    expect(composeContent).toContain('services:');
    expect(composeContent).toContain('postgres:');
    expect(composeContent).toContain('postgres:17-alpine');
    expect(composeContent).toContain('pg_isready');
    expect(composeContent).toContain('valkey:');
    expect(composeContent).toContain('valkey/valkey:8-alpine');
    expect(composeContent).toContain('minio:');
    expect(composeContent).toContain('server:');
    expect(composeContent).toContain('service_healthy');
    expect(composeContent).toContain('caddy:');
  });

  it('should verify dev docker-compose.dev.yml exists for local service orchestration', () => {
    const devComposePath = join(deployDir, 'docker-compose.dev.yml');
    expect(existsSync(devComposePath), 'deploy/docker-compose.dev.yml must exist').toBe(true);

    const devContent = readFileSync(devComposePath, 'utf-8');
    expect(devContent).toContain('5432:5432');
    expect(devContent).toContain('6379:6379');
    expect(devContent).toContain('9000:9000');
  });

  it('should verify Caddyfile reverse proxy and security configuration', () => {
    const caddyPath = join(deployDir, 'Caddyfile');
    expect(existsSync(caddyPath), 'deploy/Caddyfile must exist').toBe(true);

    const caddyContent = readFileSync(caddyPath, 'utf-8');
    expect(caddyContent).toContain('reverse_proxy server:3000');
    expect(caddyContent).toContain('X-Frame-Options');
    expect(caddyContent).toContain('X-Content-Type-Options');
  });

  it('should verify .env.example contains all required runtime variables', () => {
    const envPath = join(rootDir, '.env.example');
    expect(existsSync(envPath), '.env.example must exist').toBe(true);

    const envContent = readFileSync(envPath, 'utf-8');
    expect(envContent).toContain('DATABASE_URL=');
    expect(envContent).toContain('VALKEY_URL=');
    expect(envContent).toContain('MINIO_ENDPOINT=');
    expect(envContent).toContain('MINIO_ACCESS_KEY=');
    expect(envContent).toContain('MINIO_SECRET_KEY=');
    expect(envContent).toContain('JWT_SECRET=');
    expect(envContent).toContain('PORT=3000');
  });

  it('should verify apps/server/Dockerfile exists with production multi-stage build', () => {
    const dockerfilePath = join(rootDir, 'apps/server/Dockerfile');
    expect(existsSync(dockerfilePath), 'apps/server/Dockerfile must exist').toBe(true);

    const dockerfileContent = readFileSync(dockerfilePath, 'utf-8');
    expect(dockerfileContent).toContain('FROM oven/bun:1-alpine');
    expect(dockerfileContent).toContain('EXPOSE 3000');
    expect(dockerfileContent).toContain('CMD');
  });
});
