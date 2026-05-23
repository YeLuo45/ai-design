import { describe, it, expect } from 'vitest';
import { exportToJSON, formatExportSize } from '../export.js';
import type { Skill } from '../skills.js';

const mockSkill: Skill = {
  id: 'test-skill',
  name: 'Test Skill',
  category: 'web',
  description: 'A test skill',
  tags: ['test'],
  rating: 4.5,
};

describe('Export & Share', () => {
  it('TC-001: exportToJSON creates valid JSON', () => {
    const json = exportToJSON([mockSkill]);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe('1.0');
    expect(parsed.skills).toHaveLength(1);
    expect(parsed.exportedAt).toBeTruthy();
  });

  it('TC-002: exportToJSON includes all skill fields', () => {
    const json = exportToJSON([mockSkill]);
    const parsed = JSON.parse(json);
    const skill = parsed.skills[0];
    expect(skill.id).toBe('test-skill');
    expect(skill.name).toBe('Test Skill');
    expect(skill.category).toBe('web');
  });

  it('TC-003: formatExportSize returns bytes for small content', () => {
    const result = formatExportSize('{}');
    expect(result).toBe('2 B');
  });

  it('TC-004: formatExportSize returns KB for medium content', () => {
    const large = '{"data":"' + 'x'.repeat(2000) + '"}';
    const result = formatExportSize(large);
    expect(result).toContain('KB');
  });

  it('TC-005: exportToJSON handles empty skills array', () => {
    const json = exportToJSON([]);
    const parsed = JSON.parse(json);
    expect(parsed.skills).toHaveLength(0);
  });

  it('TC-006: exportToJSON formats with indentation', () => {
    const json = exportToJSON([mockSkill]);
    // Check for pretty-print formatting (has newlines)
    expect(json).toContain('\n');
  });
});