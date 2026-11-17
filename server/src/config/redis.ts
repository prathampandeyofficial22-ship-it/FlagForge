import { Redis } from 'ioredis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

interface ICacheService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;
  isReady(): boolean;
}

// In-Memory Fallback Cache for local dev without Redis or during tests
class MemoryCache implements ICacheService {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  isReady(): boolean {
    return true;
  }
}

class RedisCache implements ICacheService {
  private client: Redis | null = null;
  private fallback: MemoryCache = new MemoryCache();
  private connected = false;

  constructor() {
    if (config.REDIS_ENABLED && config.NODE_ENV !== 'test') {
      try {
        this.client = new Redis(config.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 2,
          retryStrategy(times: number) {
            if (times > 3) return null; // Stop retrying after 3 attempts
            return Math.min(times * 100, 2000);
          },
        });

        this.client.on('connect', () => {
          this.connected = true;
          logger.info('Connected to Redis server');
        });

        this.client.on('error', (err: any) => {
          this.connected = false;
          logger.warn('Redis error, degrading to in-memory cache', { message: err.message });
        });

        this.client.connect().catch((err: any) => {
          this.connected = false;
          logger.warn('Could not connect to Redis, falling back to memory cache', { message: err.message });
        });
      } catch (err) {
        this.connected = false;
        logger.warn('Failed to initialize Redis client', err);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.connected && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        return this.fallback.get(key);
      }
    }
    return this.fallback.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.connected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        await this.fallback.set(key, value, ttlSeconds);
        return;
      }
    }
    await this.fallback.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (this.connected && this.client) {
      try {
        await this.client.del(key);
      } catch {
        await this.fallback.del(key);
      }
    } else {
      await this.fallback.del(key);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (this.connected && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } catch {
        await this.fallback.delPattern(pattern);
      }
    } else {
      await this.fallback.delPattern(pattern);
    }
  }

  isReady(): boolean {
    return this.connected;
  }
}

export const cache = new RedisCache();
