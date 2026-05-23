import { describe, it, expect, beforeEach } from 'vitest';
import { getLocale, setLocale, t, formatDate, formatNumber, getAvailableLocales, getLocaleDisplayName } from '../i18n.js';

// Mock localStorage and navigator for jsdom
const mockStorage: Record<string, string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    key: (i: number) => Object.keys(mockStorage)[i] ?? null,
    get length() { return Object.keys(mockStorage).length; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  },
  writable: true,
});
Object.defineProperty(global, 'navigator', {
  value: { language: 'en-US' },
  writable: true,
});

describe('Internationalization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('TC-001: getLocale returns default on empty storage', () => {
    const locale = getLocale();
    expect(locale === 'en' || locale === 'zh').toBe(true);
  });

  it('TC-002: setLocale stores preference', () => {
    setLocale('zh');
    expect(getLocale()).toBe('zh');
  });

  it('TC-003: t returns translation for en', () => {
    const result = t('app.title', 'en');
    expect(result).toBe('ai-design');
  });

  it('TC-004: t returns translation for zh', () => {
    const result = t('app.title', 'zh');
    expect(result).toBe('ai-design');
  });

  it('TC-005: formatDate formats for en locale', () => {
    const result = formatDate(new Date('2024-01-15'), 'en');
    expect(result).toContain('2024');
  });

  it('TC-006: formatDate formats for zh locale', () => {
    const result = formatDate(new Date('2024-01-15'), 'zh');
    expect(result).toContain('2024');
  });

  it('TC-007: formatNumber formats correctly', () => {
    const result = formatNumber(1234567.89, 'en');
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  it('TC-008: getAvailableLocales returns 2 locales', () => {
    const locales = getAvailableLocales();
    expect(locales.length).toBe(2);
  });

  it('TC-009: getLocaleDisplayName returns correct names', () => {
    expect(getLocaleDisplayName('en')).toBe('English');
    expect(getLocaleDisplayName('zh')).toBe('中文');
  });

  it('TC-010: t falls back to key for unknown translation', () => {
    const result = t('unknown.key' as any, 'en');
    expect(result).toBe('unknown.key');
  });
});