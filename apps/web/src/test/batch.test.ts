import { describe, it, expect } from 'vitest';
import { createSelection, toggleSelect, selectAll, deselectAll, invertSelection, selectByCategory, getSelectedCount, isSelected, executeBatchOperation } from '../batch.js';
import type { Skill } from '../skills.js';

const mockSkill: Skill = {
  id: 'test-1', name: 'Test', category: 'web', description: '', tags: ['test'], rating: 4.5,
};

describe('Batch Selection & Operations', () => {
  it('TC-001: createSelection returns empty state', () => {
    const sel = createSelection();
    expect(sel.selectedIds.size).toBe(0);
    expect(sel.allSelected).toBe(false);
  });

  it('TC-002: toggleSelect adds id', () => {
    let sel = createSelection();
    sel = toggleSelect(sel, 'id1');
    expect(sel.selectedIds.has('id1')).toBe(true);
  });

  it('TC-003: toggleSelect removes id', () => {
    let sel = createSelection();
    sel = toggleSelect(sel, 'id1');
    sel = toggleSelect(sel, 'id1');
    expect(sel.selectedIds.has('id1')).toBe(false);
  });

  it('TC-004: selectAll selects all ids', () => {
    const sel = selectAll(createSelection(), ['a', 'b', 'c']);
    expect(sel.selectedIds.size).toBe(3);
  });

  it('TC-005: deselectAll clears selection', () => {
    let sel = selectAll(createSelection(), ['a', 'b']);
    sel = deselectAll(sel);
    expect(sel.selectedIds.size).toBe(0);
  });

  it('TC-006: invertSelection reverses selection', () => {
    let sel = createSelection();
    sel = toggleSelect(sel, 'a');
    sel = invertSelection(sel, ['a', 'b', 'c']);
    expect(sel.selectedIds.has('b')).toBe(true);
    expect(sel.selectedIds.has('a')).toBe(false);
  });

  it('TC-007: selectByCategory selects matching skills', () => {
    const skills: Skill[] = [
      { ...mockSkill, id: '1', category: 'web' },
      { ...mockSkill, id: '2', category: 'mobile' },
    ];
    let sel = createSelection();
    sel = selectByCategory(sel, skills, 'web');
    expect(getSelectedCount(sel)).toBe(1);
  });

  it('TC-008: executeBatchOperation delete removes skills', () => {
    const skills = [{ ...mockSkill, id: '1' }, { ...mockSkill, id: '2' }];
    const result = executeBatchOperation({ type: 'delete', ids: ['1'] }, skills);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('2');
  });

  it('TC-009: executeBatchOperation move changes category', () => {
    const skills: Skill[] = [{ ...mockSkill, id: '1', category: 'web' }];
    const result = executeBatchOperation({ type: 'move', ids: ['1'], payload: 'mobile' }, skills);
    expect(result[0].category).toBe('mobile');
  });

  it('TC-010: getSelectedCount returns correct count', () => {
    let sel = createSelection();
    sel = toggleSelect(sel, 'a');
    sel = toggleSelect(sel, 'b');
    expect(getSelectedCount(sel)).toBe(2);
  });

  it('TC-011: isSelected checks correctly', () => {
    let sel = toggleSelect(createSelection(), 'myid');
    expect(isSelected(sel, 'myid')).toBe(true);
    expect(isSelected(sel, 'other')).toBe(false);
  });

  it('TC-012: executeBatchOperation tag adds tags', () => {
    const skills: Skill[] = [{ ...mockSkill, id: '1', tags: ['original'] }];
    const result = executeBatchOperation({ type: 'tag', ids: ['1'], payload: ['newtag'] }, skills);
    expect(result[0].tags).toContain('newtag');
  });
});