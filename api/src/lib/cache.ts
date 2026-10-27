import { createClient } from "redis";
import { env } from "../config/env.js";

interface Entry {
  value: unknown;
  expiresAt: number;
}

interface CacheStats {
  keys: number;
  live: number;
}

interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  delPrefix(prefix: string): Promise<void>;
  increment(key: string, ttlSeconds: number): Promise<number>;
  stats(): Promise<CacheStats>;
  close(): Promise<void>;
}

class MemoryCache implements CacheStore {
  private store = new Map<string, Entry>();

  async get<T>(key: string): Promise<T | null> {
    const hit = this.store.get(key);
    if (!hit) return null;
    if (hit.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return hit.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const current = (await this.get<number>(key)) ?? 0;
    const next = current + 1;
    await this.set(key, next, ttlSeconds);
    return next;
  }

  async stats(): Promise<CacheStats> {
    let live = 0;
    for (const entry of this.store.values()) if (entry.expiresAt > Date.now()) live++;
    return { keys: this.store.size, live };
  }

  async close(): Promise<void> {
    this.store.clear();
  }
}

class RedisCache implements CacheStore {
  private client = createClient({ url: env.redisUrl });

  constructor() {
    this.client.on("error", (error) => console.error("[cache] Redis error", error));
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) await this.client.connect();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delPrefix(prefix: string): Promise<void> {
    const batches = this.client.scanIterator({
      MATCH: `${prefix}*`,
      COUNT: 100,
    }) as AsyncIterable<string[] | string>;

    for await (const batch of batches) {
      const keys = Array.isArray(batch) ? batch : [batch];
      if (keys.length > 0) await this.client.unlink(keys);
    }
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const hits = await this.client.incr(key);
    if (hits === 1) await this.client.expire(key, ttlSeconds);
    return hits;
  }

  async stats(): Promise<CacheStats> {
    const keys = await this.client.dbSize();
    return { keys, live: keys };
  }

  async close(): Promise<void> {
    if (this.client.isOpen) await this.client.quit();
  }
}

class CacheFacade implements CacheStore {
  private store: CacheStore = new MemoryCache();
  private driver: "memory" | "redis" = "memory";

  async init(): Promise<void> {
    if (!env.redisUrl) return;
    const redis = new RedisCache();
    try {
      await redis.connect();
    } catch (error) {
      await redis.close().catch(() => undefined);
      throw new Error(
        `Could not connect to Redis at the configured REDIS_URL: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    this.store = redis;
    this.driver = "redis";
    console.log("[cache] Connected to Redis");
  }

  get<T>(key: string): Promise<T | null> {
    return this.store.get<T>(key);
  }

  set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    return this.store.set(key, value, ttlSeconds);
  }

  del(key: string): Promise<void> {
    return this.store.del(key);
  }

  delPrefix(prefix: string): Promise<void> {
    return this.store.delPrefix(prefix);
  }

  increment(key: string, ttlSeconds: number): Promise<number> {
    return this.store.increment(key, ttlSeconds);
  }

  stats(): Promise<CacheStats> {
    return this.store.stats();
  }

  info() {
    return { driver: this.driver };
  }

  async close(): Promise<void> {
    await this.store.close();
  }
}

export const cache = new CacheFacade();

/** Delete every catalogue-derived cache entry. Fire-and-forget is intentional. */
export function invalidateCatalog(): void {
  void Promise.all([
    cache.delPrefix("cache:product:"),
    cache.delPrefix("cache:list:"),
    cache.delPrefix("cache:suggest:"),
    cache.del("cache:categories"),
  ]).catch((error) => console.error("[cache] invalidation failed", error));
}
