// quick-actions.ts - Quick action panel and shortcuts
import { showNotification } from './notification.js';

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  action: () => void;
  shortcut?: string;
  category: 'export' | 'import' | 'theme' | 'nav';
}

export interface ActionHistory {
  id: string;
  actionId: string;
  timestamp: string;
}

const ACTIONS_KEY = 'ai-design:quick-actions';
const HISTORY_KEY = 'ai-design:action-history';
const MAX_HISTORY = 20;

export function registerAction(action: QuickAction): void {
  try {
    const raw = localStorage.getItem(ACTIONS_KEY);
    const actions: QuickAction[] = raw ? JSON.parse(raw) : [];
    const idx = actions.findIndex(a => a.id === action.id);
    if (idx >= 0) actions[idx] = action;
    else actions.push(action);
    localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions));
  } catch {
    // Storage error - ignore
  }
}

export function getActions(): QuickAction[] {
  try {
    const raw = localStorage.getItem(ACTIONS_KEY);
    if (!raw) return getDefaultActions();
    return JSON.parse(raw);
  } catch {
    return getDefaultActions();
  }
}

export function getActionsByCategory(category: QuickAction['category']): QuickAction[] {
  return getActions().filter(a => a.category === category);
}

export function executeAction(actionId: string): void {
  const actions = getActions();
  const action = actions.find(a => a.id === actionId);
  if (!action) {
    showNotification('error', `Action not found: ${actionId}`);
    return;
  }
  try {
    action.action();
    addToHistory(actionId);
    showNotification('success', `Executed: ${action.label}`);
  } catch (e) {
    showNotification('error', `Action failed: ${action.label}`);
  }
}

export function addToHistory(actionId: string): void {
  try {
    const entry: ActionHistory = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      actionId,
      timestamp: new Date().toISOString(),
    };
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: ActionHistory[] = raw ? JSON.parse(raw) : [];
    history.unshift(entry);
    const trimmed = history.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage error - ignore
  }
}

export function getHistory(): ActionHistory[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function getLastAction(): ActionHistory | null {
  const history = getHistory();
  return history[0] || null;
}

function getDefaultActions(): QuickAction[] {
  return [
    { id: 'export-json', icon: '📤', label: 'Export JSON', action: () => {}, shortcut: 'Ctrl+S', category: 'export' },
    { id: 'import-json', icon: '📥', label: 'Import JSON', action: () => {}, shortcut: 'Ctrl+O', category: 'import' },
    { id: 'theme-toggle', icon: '🎨', label: 'Toggle Theme', action: () => {}, shortcut: 'Ctrl+T', category: 'theme' },
    { id: 'nav-home', icon: '🏠', label: 'Go Home', action: () => {}, category: 'nav' },
  ];
}