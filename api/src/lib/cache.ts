interface Entry {
  value: unknown;
  expiresAt: number;
}

/**
 * Redis-compatible cache facade. The demo runs entirely in-process; set
 * REDIS_URL and swap this class for ioredis without touching callers.
 */
class MemoryCache {
  private store = new Map<string, Entry>();

  get<T>(key: string): T | null {
    const hit = this.store.get(key);
    if (!hit) return null;
    if (hit.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return hit.value as T;
  }

  set(key: string, value: unknown, ttlSeconds: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  delPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  increment(key: string, ttlSeconds: number): number {
    const current = this.get<number>(key) ?? 0;
    const next = current + 1;
    this.set(key, next, ttlSeconds);
    return next;
  }

  stats() {
    let live = 0;
    for (const entry of this.store.values()) if (entry.expiresAt > Date.now()) live++;
    return { keys: this.store.size, live };
  }
}

export const cache = new MemoryCache();

export function invalidateCatalog(): void {
  cache.delPrefix("cache:product:");
  cache.delPrefix("cache:list:");
  cache.delPrefix("cache:suggest:");
  cache.del("cache:categories");
}
