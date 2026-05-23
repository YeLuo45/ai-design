// cache.ts - Performance caching utilities

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

export function isExpired(entry: CacheEntry<unknown>): boolean {
  return Date.now() > entry.expires;
}

export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (isExpired(entry)) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expires: Date.now() + CACHE_TTL,
  };
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage quota exceeded - ignore
  }
}

export function clearCache(key?: string): void {
  if (key) {
    localStorage.removeItem(key);
  } else {
    // Clear all ai-design related keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('ai-design:')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
}

export function getCacheAge(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<unknown> = JSON.parse(raw);
    return Date.now() - entry.timestamp;
  } catch {
    return null;
  }
}