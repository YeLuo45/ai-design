import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage for jsdom environment
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

// Import AFTER mock is in place
import { validateSkillData, parseImportJSON, mergeSkills } from '../import.js';
import type { Skill } from '../skills.js';

const mockSkill: Skill = {
  id: 'test-1',
  name: 'Test Skill',
  category: 'web',
  description: 'Test description',
  tags: ['test'],
  rating: 4.5,
};

describe('Data Import & Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('TC-001: validateSkillData accepts valid skill', () => {
    expect(validateSkillData(mockSkill)).toBe(true);
  });

  it('TC-002: validateSkillData rejects invalid data', () => {
    expect(validateSkillData({ id: 1 })).toBe(false);
    expect(validateSkillData(null)).toBe(false);
    expect(validateSkillData('string')).toBe(false);
  });

  it('TC-003: parseImportJSON parses valid array', () => {
    const json = JSON.stringify([mockSkill]);
    const { skills, errors } = parseImportJSON(json);
    expect(skills.length).toBe(1);
    expect(errors.length).toBe(0);
  });

  it('TC-004: parseImportJSON handles invalid JSON', () => {
    const { skills, errors } = parseImportJSON('not json');
    expect(skills.length).toBe(0);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('TC-005: mergeSkills adds new skills', () => {
    const existing: Skill[] = [];
    const newSkill = { ...mockSkill };
    const { merged, added } = mergeSkills(existing, [newSkill]);
    expect(merged.length).toBe(1);
    expect(added).toBe(1);
  });

  it('TC-006: mergeSkills replaces existing skills', () => {
    const existing = [{ ...mockSkill }];
    const updated = { ...mockSkill, rating: 5.0 };
    const { merged, replaced } = mergeSkills(existing, [updated]);
    expect(merged.length).toBe(1);
    expect(merged[0].rating).toBe(5.0);
    expect(replaced).toBe(1);
  });

  it('TC-007: parseImportJSON handles wrapped format', () => {
    const wrapped = JSON.stringify({ version: '1.0', skills: [mockSkill] });
    const { skills } = parseImportJSON(wrapped);
    expect(skills.length).toBe(1);
  });

  it('TC-008: mergeSkills handles empty incoming', () => {
    const existing = [mockSkill];
    const { merged, added, replaced } = mergeSkills(existing, []);
    expect(merged.length).toBe(1);
    expect(added).toBe(0);
    expect(replaced).toBe(0);
  });
});