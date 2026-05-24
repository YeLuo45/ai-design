import { describe, it, expect } from 'vitest';
import { createExportPackage, exportToFormat, validateImportPackage, mergeSkills, getImportStats } from '../advanced-import.js';
import type { Skill } from '../skills.js';

const mockSkill: Skill = {
  id: 'test-1', name: 'Test Skill', category: 'web',
  description: 'A test skill', tags: ['test'], rating: 4.5,
};

describe('Advanced Import/Export', () => {
  it('TC-001: createExportPackage includes metadata', () => {
    const pkg = createExportPackage([mockSkill], { format: 'json', includeMetadata: true });
    expect(pkg.version).toBe('1.0');
    expect(pkg.metadata.total).toBe(1);
    expect(pkg.metadata.categories).toContain('web');
  });

  it('TC-002: createExportPackage filters by category', () => {
    const skills: Skill[] = [
      { ...mockSkill, id: '1', category: 'web' },
      { ...mockSkill, id: '2', category: 'mobile' as const },
    ];
    const pkg = createExportPackage(skills, { format: 'json', categories: ['web'], includeMetadata: true });
    expect(pkg.skills.length).toBe(1);
    expect(pkg.skills[0].category).toBe('web');
  });

  it('TC-003: exportToFormat produces JSON', () => {
    const result = exportToFormat([mockSkill], { format: 'json', includeMetadata: true });
    expect(result).toContain('"version"');
    expect(result).toContain('"skills"');
  });

  it('TC-004: exportToFormat produces YAML-like output', () => {
    const result = exportToFormat([mockSkill], { format: 'yaml', includeMetadata: true });
    expect(result).toContain('version:');
    expect(result).toContain('skills:');
  });

  it('TC-005: validateImportPackage detects valid package', () => {
    const valid = {
      version: '1.0', exportedAt: '2024-01-01', skills: [], metadata: { total: 0, categories: [] },
    };
    expect(validateImportPackage(valid)).toBe(true);
  });

  it('TC-006: validateImportPackage detects invalid package', () => {
    expect(validateImportPackage(null)).toBe(false);
    expect(validateImportPackage({})).toBe(false);
    expect(validateImportPackage({ version: '1.0' })).toBe(false);
  });

  it('TC-007: mergeSkills replace mode', () => {
    const existing = [mockSkill];
    const imported = [{ ...mockSkill, id: 'new' }];
    const result = mergeSkills(existing, imported, 'replace');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('new');
  });

  it('TC-008: mergeSkills merge mode', () => {
    const existing = [mockSkill];
    const imported = [{ ...mockSkill, id: 'new' }];
    const result = mergeSkills(existing, imported, 'merge');
    expect(result.length).toBe(2);
  });

  it('TC-009: getImportStats counts duplicates', () => {
    const existing = [mockSkill];
    const imported = [mockSkill, { ...mockSkill, id: 'new' }];
    const stats = getImportStats(existing, imported);
    expect(stats.duplicate).toBe(1);
    expect(stats.new).toBe(1);
  });

  it('TC-010: getImportStats handles empty existing', () => {
    const stats = getImportStats([], [mockSkill]);
    expect(stats.duplicate).toBe(0);
    expect(stats.new).toBe(1);
  });
});