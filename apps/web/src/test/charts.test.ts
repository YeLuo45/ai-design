import { describe, it, expect } from 'vitest';
import { getCategoryDistribution, getRatingDistribution, getTopSkills, getDashboardStats, calculateGrowth } from '../charts.js';
import type { Skill } from '../skills.js';

const mockSkills: Skill[] = [
  { id: '1', name: 'Web Skill', category: 'web', description: '', tags: [], rating: 4.5 },
  { id: '2', name: 'Mobile Skill', category: 'mobile', description: '', tags: [], rating: 3.5 },
  { id: '3', name: 'Game Skill', category: 'game', description: '', tags: [], rating: 5.0 },
  { id: '4', name: 'Desktop Skill', category: 'desktop', description: '', tags: [], rating: 4.0 },
  { id: '5', name: 'Web Skill 2', category: 'web', description: '', tags: [], rating: 3.0 },
];

describe('Data Visualization', () => {
  it('TC-001: getCategoryDistribution groups correctly', () => {
    const chart = getCategoryDistribution(mockSkills);
    expect(chart.labels).toContain('web');
    expect(chart.values[chart.labels.indexOf('web')]).toBe(2);
  });

  it('TC-002: getRatingDistribution buckets correctly', () => {
    const chart = getRatingDistribution(mockSkills);
    expect(chart.labels).toContain('3-4');
    expect(chart.labels).toContain('4-5');
  });

  it('TC-003: getTopSkills sorts by rating desc', () => {
    const top = getTopSkills(mockSkills, 3);
    expect(top[0].rating).toBe(5.0);
    expect(top.length).toBe(3);
  });

  it('TC-004: getDashboardStats calculates averages', () => {
    const stats = getDashboardStats(mockSkills);
    expect(stats.totalSkills).toBe(5);
    expect(stats.topCategory).toBe('web');
    expect(stats.averageRating).toBe(4.0);
  });

  it('TC-005: calculateGrowth handles zero previous', () => {
    expect(calculateGrowth(10, 0)).toBe(100);
    expect(calculateGrowth(0, 0)).toBe(0);
  });

  it('TC-006: calculateGrowth calculates percentage', () => {
    expect(calculateGrowth(150, 100)).toBe(50);
    expect(calculateGrowth(80, 100)).toBe(-20);
  });

  it('TC-007: getTopSkills respects limit', () => {
    const top = getTopSkills(mockSkills, 2);
    expect(top.length).toBe(2);
  });

  it('TC-008: getCategoryDistribution handles empty', () => {
    const chart = getCategoryDistribution([]);
    expect(chart.labels).toHaveLength(0);
    expect(chart.values).toHaveLength(0);
  });

  it('TC-009: getRatingDistribution handles empty', () => {
    const chart = getRatingDistribution([]);
    expect(chart.labels).toHaveLength(5);
  });

  it('TC-010: getTopSkills returns empty for empty input', () => {
    const top = getTopSkills([]);
    expect(top).toHaveLength(0);
  });
});