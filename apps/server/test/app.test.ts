import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app';

describe('Hono Backend Application', () => {
  const app = createApp();

  it('should return health check ok on GET /health', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('homedash-api');
    expect(body.timestamp).toBeDefined();
  });

  it('should return OpenAPI document on GET /openapi.json', async () => {
    const res = await app.request('/openapi.json');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.openapi).toMatch(/^3\./);
    expect(body.info.title).toBe('Family OS API');
  });

  it('should validate inputs on POST /vault/break-glass/initiate and reject invalid UUID', async () => {
    const res = await app.request('/vault/break-glass/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ householdId: 'invalid-uuid' }),
    });

    expect(res.status).toBe(400);
  });
});
