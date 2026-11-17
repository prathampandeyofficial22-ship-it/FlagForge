import crypto from 'node:crypto';

/**
 * 32-bit MurmurHash3 implementation.
 * Guarantees uniform, deterministic bucket distribution across platforms and languages.
 *
 * @param key The input string (e.g. `${flagKey}:${userId}`)
 * @param seed Optional 32-bit integer seed (default 0)
 * @returns 32-bit unsigned integer
 */
export function murmurHash3(key: string, seed = 0): number {
  let h1 = seed >>> 0;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  const remainder = key.length & 3;
  const bytes = key.length - remainder;

  for (let i = 0; i < bytes; i += 4) {
    let k1 =
      (key.charCodeAt(i) & 0xff) |
      ((key.charCodeAt(i + 1) & 0xff) << 8) |
      ((key.charCodeAt(i + 2) & 0xff) << 16) |
      ((key.charCodeAt(i + 3) & 0xff) << 24);

    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = (Math.imul(h1, 5) + 0xe6546b64) >>> 0;
  }

  let k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(bytes + 2) & 0xff) << 16;
    // fallthrough
    case 2:
      k1 ^= (key.charCodeAt(bytes + 1) & 0xff) << 8;
    // fallthrough
    case 1:
      k1 ^= key.charCodeAt(bytes) & 0xff;
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
  }

  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

/**
 * Deterministically maps a flagKey and identifier into a rollout bucket percentage [0.00, 100.00).
 */
export function getRolloutBucket(flagKey: string, identifier: string): number {
  const combined = `${flagKey}:${identifier}`;
  const hash = murmurHash3(combined);
  // (hash % 10000) / 100 yields 0.00 to 99.99 with 2 decimal precision
  return (hash % 10000) / 100;
}

/**
 * Evaluates whether a user identifier falls within a rollout percentage.
 */
export function isUserInRollout(
  flagKey: string,
  identifier: string,
  rolloutPercentage: number
): boolean {
  if (rolloutPercentage <= 0) return false;
  if (rolloutPercentage >= 100) return true;
  const bucket = getRolloutBucket(flagKey, identifier);
  return bucket < rolloutPercentage;
}

/**
 * SHA-256 hash generator for SDK API keys and sensitive tokens.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a cryptographically secure random SDK key with prefix.
 * e.g. `ff_server_live_` or `ff_client_live_`
 */
export function generateApiKey(type: 'server' | 'client', environment: string): {
  rawKey: string;
  hashedKey: string;
  prefix: string;
} {
  const envTag = environment.toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const rawKey = `ff_${type}_${envTag}_${randomBytes}`;
  const hashedKey = hashToken(rawKey);
  const prefix = rawKey.substring(0, 18) + '...';

  return { rawKey, hashedKey, prefix };
}
