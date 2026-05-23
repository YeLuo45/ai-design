import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage for jsdom environment
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  key: (i: number) => Object.keys(mockStorage)[i] ?? null,
  get length() { return Object.keys(mockStorage).length; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
} as Storage;

// Now import the module
import { getCache, setCache, clearCache, getCacheAge, isExpired } from '../cache.js';
import type { CacheEntry } from '../cache.js';

describe('Performance & Caching', () => {
  beforeEach(() => {
    clearCache();
  });

  it('TC-001: setCache stores data', () => {
    setCache('test-key', { value: 42 });
    const result = getCache<{ value: number }>('test-key');
    expect(result).toEqual({ value: 42 });
  });

  it('TC-002: getCache returns null for expired entry', () => {
    const expired: CacheEntry<{ value: string }> = {
      data: { value: 'old' },
      timestamp: Date.now() - (25 * 60 * 60 * 1000),
      expires: Date.now() - (1 * 60 * 60 * 1000),
    };
    localStorage.setItem('expired-key', JSON.stringify(expired));
    const result = getCache<{ value: string }>('expired-key');
    expect(result).toBeNull();
  });

  it('TC-003: clearCache removes specific key', () => {
    setCache('to-remove', { data: 1 });
    clearCache('to-remove');
    expect(getCache('to-remove')).toBeNull();
  });

  it('TC-004: getCacheAge returns age in ms', () => {
    setCache('age-test', { data: 'test' });
    const age = getCacheAge('age-test');
    expect(age).not.toBeNull();
    expect(age).toBeGreaterThanOrEqual(0);
  });

  it('TC-005: isExpired detects expired entry', () => {
    const expired: CacheEntry<string> = {
      data: 'test',
      timestamp: Date.now() - 100000,
      expires: Date.now() - 50000,
    };
    expect(isExpired(expired)).toBe(true);
  });

  it('TC-006: isExpired detects valid entry', () => {
    const valid: CacheEntry<string> = {
      data: 'test',
      timestamp: Date.now(),
      expires: Date.now() + 3600000,
    };
    expect(isExpired(valid)).toBe(false);
  });
});