// charts.ts - Data visualization utilities
import type { Skill } from './skills.js';
import { getMetrics, getSearchLog } from './metrics.js';

export interface ChartData {
  labels: string[];
  values: number[];
  title: string;
}

export interface DashboardStats {
  totalSkills: number;
  totalSearches: number;
  totalExports: number;
  averageRating: number;
  topCategory: string;
  searchGrowth: number;
  exportGrowth: number;
}

export function getCategoryDistribution(skills: Skill[]): ChartData {
  const counts: Record<string, number> = {};
  skills.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
  return {
    labels: Object.keys(counts),
    values: Object.values(counts),
    title: 'Skills by Category',
  };
}

export function getRatingDistribution(skills: Skill[]): ChartData {
  const buckets = { '0-1': 0, '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0 };
  skills.forEach(s => {
    if (s.rating < 1) buckets['0-1']++;
    else if (s.rating < 2) buckets['1-2']++;
    else if (s.rating < 3) buckets['2-3']++;
    else if (s.rating < 4) buckets['3-4']++;
    else buckets['4-5']++;
  });
  return {
    labels: Object.keys(buckets),
    values: Object.values(buckets),
    title: 'Rating Distribution',
  };
}

export function getMonthlyTrends(months = 6): { month: string; searches: number; exports: number }[] {
  const logs = getSearchLog();
  const now = new Date();
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLogs = logs.filter(l => l.timestamp.startsWith(key));
    result.push({
      month: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      searches: monthLogs.length,
      exports: 0,
    });
  }
  return result;
}

export function getTopSkills(skills: Skill[], limit = 5): Skill[] {
  return [...skills].sort((a, b) => b.rating - a.rating).slice(0, limit);
}

export function getDashboardStats(skills: Skill[]): DashboardStats {
  const metrics = getMetrics();
  const avgRating = skills.length > 0 ? skills.reduce((sum, s) => sum + s.rating, 0) / skills.length : 0;
  const categoryCounts: Record<string, number> = {};
  skills.forEach(s => { categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1; });
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  return {
    totalSkills: skills.length,
    totalSearches: metrics.searchCount,
    totalExports: metrics.exportCount,
    averageRating: Math.round(avgRating * 10) / 10,
    topCategory,
    searchGrowth: 0,
    exportGrowth: 0,
  };
}

export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}