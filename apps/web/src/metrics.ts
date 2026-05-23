// metrics.ts - Performance monitoring and analytics
export interface PerformanceMetrics {
  firstContentfulPaint: number;
  domContentLoaded: number;
  loadComplete: number;
  searchCount: number;
  exportCount: number;
  themeChanges: number;
  timestamp: string;
}

export interface SearchMetric {
  query: string;
  results: number;
  took: number;
  timestamp: string;
}

const METRICS_KEY = 'ai-design:metrics';
const SEARCH_LOG_KEY = 'ai-design:search-log';

export function recordMetric(name: keyof Omit<PerformanceMetrics, 'timestamp'>, value: number): void {
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    const metrics: PerformanceMetrics = raw ? JSON.parse(raw) : createDefaultMetrics();
    (metrics as any)[name] = value;
    metrics.timestamp = new Date().toISOString();
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  } catch {
    // Storage error - ignore
  }
}

export function getMetrics(): PerformanceMetrics {
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    if (!raw) return createDefaultMetrics();
    return JSON.parse(raw);
  } catch {
    return createDefaultMetrics();
  }
}

export function resetMetrics(): void {
  localStorage.removeItem(METRICS_KEY);
  localStorage.removeItem(SEARCH_LOG_KEY);
}

export function incrementCounter(name: 'searchCount' | 'exportCount' | 'themeChanges'): void {
  try {
    const metrics = getMetrics();
    metrics[name] = (metrics[name] || 0) + 1;
    metrics.timestamp = new Date().toISOString();
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  } catch {
    // Storage error - ignore
  }
}

export function logSearch(query: string, results: number, took: number): void {
  try {
    const raw = localStorage.getItem(SEARCH_LOG_KEY);
    const log: SearchMetric[] = raw ? JSON.parse(raw) : [];
    log.unshift({ query, results, took, timestamp: new Date().toISOString() });
    const trimmed = log.slice(0, 100); // Keep last 100 searches
    localStorage.setItem(SEARCH_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage error - ignore
  }
}

export function getSearchLog(): SearchMetric[] {
  try {
    const raw = localStorage.getItem(SEARCH_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function generateReport(): PerformanceMetrics & { topSearches: SearchMetric[] } {
  return {
    ...getMetrics(),
    topSearches: getSearchLog().slice(0, 10),
  };
}

export function getAverageSearchTime(): number {
  const log = getSearchLog();
  if (log.length === 0) return 0;
  const sum = log.reduce((acc, s) => acc + s.took, 0);
  return Math.round(sum / log.length);
}

function createDefaultMetrics(): PerformanceMetrics {
  return {
    firstContentfulPaint: 0,
    domContentLoaded: 0,
    loadComplete: 0,
    searchCount: 0,
    exportCount: 0,
    themeChanges: 0,
    timestamp: new Date().toISOString(),
  };
}