import {
  FlagForgeOptions,
  FlagForgeUser,
  EvaluationResult,
} from './types';

interface CachedEntry {
  result: EvaluationResult<any>;
  expiresAt: number;
}

export class FlagForgeClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;
  private enableLocalCache: boolean;
  private cacheTtlMs: number;
  private offlineFallback: Record<string, boolean>;
  private cache: Map<string, CachedEntry> = new Map();

  constructor(options: FlagForgeOptions) {
    if (!options.apiKey) {
      throw new Error('FlagForgeClient requires an apiKey');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'http://localhost:4000/api/v1').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 3000;
    this.enableLocalCache = options.enableLocalCache ?? true;
    this.cacheTtlMs = options.cacheTtlMs ?? 60000; // 60s default
    this.offlineFallback = options.offlineFallback ?? {};
  }

  private getCacheKey(flagKey: string, user?: FlagForgeUser): string {
    const userPart = user ? `${user.key}:${JSON.stringify(user.attributes || {})}` : 'anon';
    return `${flagKey}#${userPart}`;
  }

  async evaluate<T = boolean>(
    flagKey: string,
    user?: FlagForgeUser,
    defaultValue?: T
  ): Promise<EvaluationResult<T>> {
    const fallbackDefault = (defaultValue !== undefined
      ? defaultValue
      : this.offlineFallback[flagKey] ?? false) as unknown as T;

    // Check local cache
    if (this.enableLocalCache) {
      const cacheKey = this.getCacheKey(flagKey, user);
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return {
          ...cached.result,
          reason: 'CACHE_HIT',
        };
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Environment-Key': this.apiKey,
        },
        body: JSON.stringify({
          flagKey,
          user: user
            ? {
                key: user.key,
                attributes: user.attributes || {},
              }
            : undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`FlagForge evaluation failed with status ${response.status}`);
      }

      const body = await response.json();
      const result: EvaluationResult<T> = {
        flagKey,
        enabled: body.enabled,
        value: (body.value !== undefined ? body.value : body.enabled) as T,
        reason: body.reason,
        version: body.version,
      };

      // Store in local cache
      if (this.enableLocalCache) {
        const cacheKey = this.getCacheKey(flagKey, user);
        this.cache.set(cacheKey, {
          result,
          expiresAt: Date.now() + this.cacheTtlMs,
        });
      }

      return result;
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Safe fallback on error or timeout
      return {
        flagKey,
        enabled: Boolean(fallbackDefault),
        value: fallbackDefault,
        reason: 'FALLBACK',
      };
    }
  }

  async isEnabled(
    flagKey: string,
    user?: FlagForgeUser,
    defaultValue = false
  ): Promise<boolean> {
    const result = await this.evaluate<boolean>(flagKey, user, defaultValue);
    return result.enabled;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
