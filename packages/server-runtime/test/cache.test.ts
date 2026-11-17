import { describe, it, expect } from 'vitest';
import { InMemoryCacheClient, ValkeyCacheClient } from '../src/cache/valkey';

describe('Valkey / Cache Client Adapter', () => {
  it('should store, retrieve, and delete values with in-memory adapter', async () => {
    const cache = new InMemoryCacheClient();

    await cache.set('test:key:1', 'hello-world', 10);
    const val = await cache.get('test:key:1');
    expect(val).toBe('hello-world');

    await cache.del('test:key:1');
    const deletedVal = await cache.get('test:key:1');
    expect(deletedVal).toBeNull();
  });

  it('should expire keys automatically when TTL is elapsed', async () => {
    const cache = new InMemoryCacheClient();

    // Set with 0s TTL (immediately expired)
    await cache.set('temp:challenge:1', 'challenge-token', -1);
    const val = await cache.get('temp:challenge:1');
    expect(val).toBeNull();
  });

  it('should export ValkeyCacheClient that connects to Redis URL', () => {
    expect(ValkeyCacheClient).toBeDefined();
    const client = new ValkeyCacheClient('redis://localhost:6379', true); // lazyConnect = true
    expect(client).toBeDefined();
    expect(typeof client.get).toBe('function');
    expect(typeof client.set).toBe('function');
  });
});
