import { describe, it, expect, beforeEach } from 'vitest';
import { parseQuery, matchSkill, searchSkills, getSearchHistory, addToHistory, clearSearchHistory, getSuggestions } from '../search.js';
import type { Skill } from '../skills.js';

const mockSkill: Skill = {
  id: 'test-1',
  name: 'Test Skill',
  category: 'web',
  description: 'A test skill for unit testing',
  tags: ['test', 'unit'],
  rating: 4.5,
};

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

describe('Search & Filter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('TC-001: parseQuery parses field:value syntax', () => {
    const { field, value } = parseQuery('name:Test');
    expect(field).toBe('name');
    expect(value).toBe('Test');
  });

  it('TC-002: parseQuery handles plain query', () => {
    const { field, value } = parseQuery('test');
    expect(field).toBeNull();
    expect(value).toBe('test');
  });

  it('TC-003: matchSkill matches by name', () => {
    expect(matchSkill(mockSkill, 'Test')).toBe(true);
    expect(matchSkill(mockSkill, 'NotFound')).toBe(false);
  });

  it('TC-004: matchSkill matches by field prefix', () => {
    expect(matchSkill(mockSkill, 'name:Test Skill')).toBe(true);
    expect(matchSkill(mockSkill, 'category:web')).toBe(true);
    expect(matchSkill(mockSkill, 'tag:test')).toBe(true);
  });

  it('TC-005: searchSkills filters by category', () => {
    const results = searchSkills([mockSkill], { query: '', category: 'web' });
    expect(results.total).toBe(1);
  });

  it('TC-006: searchSkills filters by rating', () => {
    const results = searchSkills([mockSkill], { query: '', minRating: 4.0 });
    expect(results.total).toBe(1);
    const results2 = searchSkills([mockSkill], { query: '', minRating: 5.0 });
    expect(results2.total).toBe(0);
  });

  it('TC-007: searchSkills returns took time', () => {
    const results = searchSkills([mockSkill], { query: 'test' });
    expect(results.took).toBeGreaterThanOrEqual(0);
  });

  it('TC-008: getSuggestions returns name suggestions', () => {
    const suggestions = getSuggestions([mockSkill], 'Test');
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('TC-009: addToHistory saves query', () => {
    addToHistory('test query');
    const history = getSearchHistory();
    expect(history).toContain('test query');
  });

  it('TC-010: clearSearchHistory removes all', () => {
    addToHistory('test');
    clearSearchHistory();
    expect(getSearchHistory()).toHaveLength(0);
  });

  it('TC-011: searchSkills respects limit', () => {
    const skills = [mockSkill, { ...mockSkill, id: '2' }];
    const results = searchSkills(skills, { query: '', limit: 1 });
    expect(results.skills.length).toBe(1);
  });

  it('TC-012: getSuggestions handles tag: prefix', () => {
    const suggestions = getSuggestions([mockSkill], 'tag:test');
    expect(suggestions.length).toBeGreaterThan(0);
  });
});