import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlagForgeClient } from '../src/client';
import { getRolloutBucket, murmurHash3 } from '../src/hash';

describe('@flagforge/node-sdk Unit & Integration Tests', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('MurmurHash3 matches deterministic bucket logic', () => {
    const hash = murmurHash3('test-key:user_123');
    expect(typeof hash).toBe('number');
    expect(hash).toBeGreaterThan(0);

    const bucket = getRolloutBucket('checkout-v2', 'user_456');
    expect(bucket).toBeGreaterThanOrEqual(0);
    expect(bucket).toBeLessThan(100);
  });

  it('Initializes with options and validates apiKey', () => {
    expect(() => new FlagForgeClient({ apiKey: '' })).toThrow('requires a valid apiKey');

    const client = new FlagForgeClient({
      apiKey: 'ff_server_dev_12345',
      baseUrl: 'http://localhost:4000/api/v1',
    });
    expect(client).toBeDefined();
  });

  it('Evaluates flag and caches result in local memory', async () => {
    const mockResponse = {
      flagKey: 'new-billing-flow',
      enabled: true,
      value: true,
      reason: 'PERCENTAGE_ROLLOUT',
      version: 2,
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    global.fetch = fetchMock;

    const client = new FlagForgeClient({
      apiKey: 'ff_server_dev_abcdef',
      enableLocalCache: true,
    });

    // First call -> Hits network
    const result1 = await client.evaluate('new-billing-flow', { key: 'user_1' });
    expect(result1.enabled).toBe(true);
    expect(result1.reason).toBe('PERCENTAGE_ROLLOUT');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call -> Hits local cache
    const result2 = await client.evaluate('new-billing-flow', { key: 'user_1' });
    expect(result2.enabled).toBe(true);
    expect(result2.reason).toBe('CACHE_HIT');
    expect(fetchMock).toHaveBeenCalledTimes(1); // Network was not called again!

    // Clear cache -> Hits network again
    client.clearCache();
    await client.evaluate('new-billing-flow', { key: 'user_1' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('Safely falls back to default value when fetch throws or times out', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error: connection refused'));

    const client = new FlagForgeClient({
      apiKey: 'ff_server_dev_fallback',
      timeoutMs: 100,
      offlineFallback: {
        'critical-banner': true,
      },
    });

    // Evaluates with safe offline fallback
    const result = await client.evaluate('critical-banner', { key: 'user_fallback' });
    expect(result.enabled).toBe(true);
    expect(result.reason).toBe('FALLBACK');

    const isEnabled = await client.isEnabled('unknown-flag', { key: 'user_anon' }, false);
    expect(isEnabled).toBe(false);
  });
});
