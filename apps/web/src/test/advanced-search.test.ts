import { describe, it, expect } from 'vitest';
import { parseQuery, matchSkillAdvanced, highlightMatches, getSnippet, buildSavedFilter, applySavedFilter } from '../advanced-search.js';
import type { Skill } from '../skills.js';

const mockSkill: Skill = {
  id: 'test-1', name: 'Test Skill', category: 'web', description: 'A test skill for unit testing', tags: ['test', 'unit'], rating: 4.5,
};

describe('Advanced Search', () => {
  it('TC-001: parseQuery tokenizes simple term', () => {
    const q = parseQuery('test');
    expect(q.tokens.length).toBe(1);
    expect(q.tokens[0].value).toBe('test');
  });

  it('TC-002: parseQuery tokenizes field query', () => {
    const q = parseQuery('category:web');
    expect(q.filters.length).toBe(1);
    expect(q.filters[0].field).toBe('category');
    expect(q.filters[0].value).toBe('web');
  });

  it('TC-003: matchSkillAdvanced matches name', () => {
    const q = parseQuery('Test');
    expect(matchSkillAdvanced(mockSkill, q)).toBe(true);
  });

  it('TC-004: matchSkillAdvanced matches description', () => {
    const q = parseQuery('testing');
    expect(matchSkillAdvanced(mockSkill, q)).toBe(true);
  });

  it('TC-005: highlightMatches wraps in mark tags', () => {
    const result = highlightMatches('Hello World', 'World');
    expect(result).toContain('<mark>World</mark>');
  });

  it('TC-006: highlightMatches handles multiple terms', () => {
    const result = highlightMatches('Hello World Test', 'Hello Test');
    expect(result).toContain('<mark>Hello</mark>');
    expect(result).toContain('<mark>Test</mark>');
  });

  it('TC-007: getSnippet extracts around match', () => {
    const result = getSnippet('The quick brown fox jumps', 'quick', 20);
    expect(result).toContain('quick');
  });

  it('TC-008: buildSavedFilter stores filters', () => {
    const filters = [{ field: 'category', op: 'eq' as const, value: 'web' }];
    const saved = buildSavedFilter('Web Skills', filters);
    expect(saved.name).toBe('Web Skills');
    expect(saved.filters.length).toBe(1);
  });

  it('TC-009: applySavedFilter filters skills', () => {
    const skills = [mockSkill, { ...mockSkill, id: '2', category: 'mobile' }];
    const saved = buildSavedFilter('Web', [{ field: 'category', op: 'eq', value: 'web' }]);
    const result = applySavedFilter(skills, saved);
    expect(result.length).toBe(1);
    expect(result[0].category).toBe('web');
  });

  it('TC-010: parseQuery handles rating range', () => {
    const q = parseQuery('rating:>=4');
    const ratingFilter = q.filters.find(f => f.field === 'rating');
    expect(ratingFilter).toBeDefined();
    expect(ratingFilter?.op).toBe('gte');
  });
});