import { describe, it, expect, beforeEach } from 'vitest';
import { registerAction, getActions, getActionsByCategory, addToHistory, getHistory, clearHistory, getLastAction } from '../quick-actions.js';

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

describe('Quick Actions Panel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('TC-001: registerAction stores action', () => {
    const action = { id: 'test', icon: '⚡', label: 'Test', action: () => {}, category: 'export' as const };
    registerAction(action);
    const actions = getActions();
    expect(actions.some(a => a.id === 'test')).toBe(true);
  });

  it('TC-002: getActions returns defaults on empty', () => {
    const actions = getActions();
    expect(actions.length).toBeGreaterThan(0);
  });

  it('TC-003: getActionsByCategory filters correctly', () => {
    const exportActions = getActionsByCategory('export');
    expect(exportActions.every(a => a.category === 'export')).toBe(true);
  });

  it('TC-004: addToHistory records action', () => {
    addToHistory('test-action');
    const history = getHistory();
    expect(history.length).toBe(1);
    expect(history[0].actionId).toBe('test-action');
  });

  it('TC-005: clearHistory removes all', () => {
    addToHistory('a1');
    addToHistory('a2');
    clearHistory();
    expect(getHistory()).toHaveLength(0);
  });

  it('TC-006: getLastAction returns most recent', () => {
    addToHistory('first');
    addToHistory('second');
    const last = getLastAction();
    expect(last?.actionId).toBe('second');
  });

  it('TC-007: registerAction updates existing', () => {
    const action = { id: 'update-test', icon: '⚡', label: 'Original', action: () => {}, category: 'export' as const };
    registerAction(action);
    registerAction({ ...action, label: 'Updated' });
    const actions = getActions();
    const found = actions.find(a => a.id === 'update-test');
    expect(found?.label).toBe('Updated');
  });

  it('TC-008: addToHistory limits to 20 entries', () => {
    for (let i = 0; i < 25; i++) {
      addToHistory('action-' + i);
    }
    const history = getHistory();
    expect(history.length).toBeLessThanOrEqual(20);
  });

  it('TC-009: getHistory returns empty on no data', () => {
    const history = getHistory();
    expect(history).toHaveLength(0);
  });

  it('TC-010: getActions returns 4 defaults', () => {
    const actions = getActions();
    expect(actions.length).toBe(4);
  });
});
