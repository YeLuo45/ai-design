import { describe, it, expect, beforeEach } from 'vitest';
import { recordMetric, getMetrics, resetMetrics, incrementCounter, logSearch, getSearchLog, getAverageSearchTime, generateReport } from '../metrics.js';

// Mock localStorage for jsdom
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

describe('Performance Monitoring', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('TC-001: recordMetric stores metric', () => {
    recordMetric('searchCount', 5);
    const metrics = getMetrics();
    expect(metrics.searchCount).toBe(5);
  });

  it('TC-002: getMetrics returns default on empty storage', () => {
    const metrics = getMetrics();
    expect(metrics.searchCount).toBe(0);
    expect(metrics.exportCount).toBe(0);
  });

  it('TC-003: resetMetrics clears all data', () => {
    recordMetric('searchCount', 10);
    resetMetrics();
    const metrics = getMetrics();
    expect(metrics.searchCount).toBe(0);
  });

  it('TC-004: incrementCounter increments by 1', () => {
    incrementCounter('searchCount');
    incrementCounter('searchCount');
    const metrics = getMetrics();
    expect(metrics.searchCount).toBe(2);
  });

  it('TC-005: logSearch records search entry', () => {
    logSearch('test query', 10, 5);
    const log = getSearchLog();
    expect(log.length).toBe(1);
    expect(log[0].query).toBe('test query');
    expect(log[0].results).toBe(10);
  });

  it('TC-006: getSearchLog returns empty on no data', () => {
    const log = getSearchLog();
    expect(log).toHaveLength(0);
  });

  it('TC-007: getAverageSearchTime calculates mean', () => {
    logSearch('q1', 5, 10);
    logSearch('q2', 5, 20);
    const avg = getAverageSearchTime();
    expect(avg).toBe(15);
  });

  it('TC-008: generateReport includes all fields', () => {
    incrementCounter('searchCount');
    incrementCounter('exportCount');
    logSearch('test', 5, 10);
    const report = generateReport();
    expect(report).toHaveProperty('searchCount');
    expect(report).toHaveProperty('exportCount');
    expect(report).toHaveProperty('topSearches');
    expect(report.topSearches.length).toBe(1);
  });

  it('TC-009: logSearch limits to 100 entries', () => {
    for (let i = 0; i < 150; i++) {
      logSearch(`q${i}`, 1, 1);
    }
    const log = getSearchLog();
    expect(log.length).toBeLessThanOrEqual(100);
  });

  it('TC-010: recordMetric updates timestamp', () => {
    recordMetric('loadComplete', 1000);
    const metrics = getMetrics();
    expect(metrics.timestamp).toBeTruthy();
  });
});