// batch.ts - Batch selection and operations
import type { Skill } from './skills.js';

export interface SelectionState {
  selectedIds: Set<string>;
  allSelected: boolean;
  indeterminate: boolean;
}

export interface BatchOperation {
  type: 'delete' | 'move' | 'export' | 'tag';
  ids: string[];
  payload?: unknown;
}

export function createSelection(): SelectionState {
  return {
    selectedIds: new Set(),
    allSelected: false,
    indeterminate: false,
  };
}

export function toggleSelect(selection: SelectionState, id: string): SelectionState {
  const newIds = new Set(selection.selectedIds);
  if (newIds.has(id)) newIds.delete(id);
  else newIds.add(id);
  return computeSelectionState(newIds);
}

export function selectAll(selection: SelectionState, ids: string[]): SelectionState {
  const newIds = new Set(ids);
  return { selectedIds: newIds, allSelected: true, indeterminate: false };
}

export function deselectAll(selection: SelectionState): SelectionState {
  return { selectedIds: new Set(), allSelected: false, indeterminate: false };
}

export function invertSelection(selection: SelectionState, allIds: string[]): SelectionState {
  const newIds = new Set<string>();
  for (const id of allIds) {
    if (!selection.selectedIds.has(id)) newIds.add(id);
  }
  return computeSelectionState(newIds);
}

export function selectByCategory(selection: SelectionState, skills: Skill[], category: Skill['category']): SelectionState {
  const ids = skills.filter(s => s.category === category).map(s => s.id);
  const newIds = new Set(selection.selectedIds);
  for (const id of ids) newIds.add(id);
  return computeSelectionState(newIds);
}

export function computeSelectionState(selectedIds: Set<string>): SelectionState {
  return {
    selectedIds,
    allSelected: false,
    indeterminate: selectedIds.size > 0,
  };
}

export function executeBatchOperation(operation: BatchOperation, skills: Skill[]): Skill[] {
  switch (operation.type) {
    case 'delete':
      return skills.filter(s => !operation.ids.includes(s.id));
    case 'move': {
      const targetCategory = operation.payload as Skill['category'];
      return skills.map(s => operation.ids.includes(s.id) ? { ...s, category: targetCategory } : s);
    }
    case 'export':
      return skills.filter(s => operation.ids.includes(s.id));
    case 'tag': {
      const tags = operation.payload as string[];
      return skills.map(s => {
        if (!operation.ids.includes(s.id)) return s;
        const newTags = Array.from(new Set([...s.tags, ...tags]));
        return { ...s, tags: newTags };
      });
    }
    default:
      return skills;
  }
}

export function getSelectedCount(selection: SelectionState): number {
  return selection.selectedIds.size;
}

export function isSelected(selection: SelectionState, id: string): boolean {
  return selection.selectedIds.has(id);
}