import { describe, it, expect } from 'vitest';
import { skills, getSkillsByCategory, searchSkills, compareSkills } from '../skills.js';

describe('Enhanced Skill System', () => {
  it('TC-001: getSkillsByCategory returns web skills', () => {
    const webSkills = getSkillsByCategory('web');
    expect(webSkills.length).toBeGreaterThanOrEqual(2);
  });

  it('TC-002: searchSkills finds by name', () => {
    const results = searchSkills('Dashboard');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toContain('Dashboard');
  });

  it('TC-003: searchSkills finds by tag', () => {
    const results = searchSkills('mobile');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('TC-004: compareSkills finds same attributes', () => {
    const web = skills.find(s => s.id === 'web-prototype')!;
    const dash = skills.find(s => s.id === 'dashboard')!;
    const { same } = compareSkills(web, dash);
    expect(Array.isArray(same)).toBe(true);
  });

  it('TC-005: compareSkills finds different attributes', () => {
    const web = skills.find(s => s.id === 'web-prototype')!;
    const mobile = skills.find(s => s.id === 'mobile-app')!;
    const { diff } = compareSkills(web, mobile);
    expect(diff.length).toBeGreaterThan(0);
  });

  it('TC-006: All skills have required fields', () => {
    const required = ['id', 'name', 'category', 'description', 'tags', 'rating'];
    skills.forEach(skill => {
      required.forEach(field => {
        expect(skill).toHaveProperty(field);
      });
    });
  });
});