import { describe, it, expect } from 'vitest';
import { parseShortcut, matchesShortcut, formatShortcut } from '../keyboard.js';

describe('Keyboard Shortcuts & Accessibility', () => {
  it('TC-001: parseShortcut parses simple key', () => {
    const result = parseShortcut('s');
    expect(result.key).toBe('s');
  });

  it('TC-002: parseShortcut parses ctrl combination', () => {
    const result = parseShortcut('CTRL+S');
    expect(result.key).toBe('s');
    expect(result.ctrlKey).toBe(true);
  });

  it('TC-003: parseShortcut parses meta combination', () => {
    const result = parseShortcut('META+E');
    expect(result.key).toBe('e');
    expect(result.metaKey).toBe(true);
  });

  it('TC-004: matchesShortcut detects exact match', () => {
    const event = { key: 's', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false };
    const shortcut = { key: 's', ctrlKey: true };
    expect(matchesShortcut(event, shortcut)).toBe(true);
  });

  it('TC-005: matchesShortcut detects non-match', () => {
    const event = { key: 's', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };
    const shortcut = { key: 's', ctrlKey: true };
    expect(matchesShortcut(event, shortcut)).toBe(false);
  });

  it('TC-006: formatShortcut formats ctrl correctly', () => {
    const result = formatShortcut({ key: 's', ctrl: true, action: () => {}, description: '' });
    expect(result).toBe('Ctrl+S');
  });

  it('TC-007: formatShortcut handles all modifiers', () => {
    const result = formatShortcut({ key: 's', ctrl: true, meta: true, shift: true, alt: true, action: () => {}, description: '' });
    expect(result).toBe('Ctrl+Cmd+Shift+Alt+S');
  });

  it('TC-008: matchesShortcut is case insensitive', () => {
    const event = { key: 'S', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false };
    const shortcut = { key: 's', ctrlKey: true };
    expect(matchesShortcut(event, shortcut)).toBe(true);
  });
});