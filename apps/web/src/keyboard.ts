// keyboard.ts - Keyboard shortcuts and accessibility
export interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export interface KeyEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export function parseShortcut(key: string): { key: string; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean } {
  const parts = key.toUpperCase().split('+');
  const result: { key: string; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean } = { key: '' };
  parts.forEach(p => {
    if (p === 'CTRL') result.ctrlKey = true;
    else if (p === 'META' || p === 'CMD') result.metaKey = true;
    else if (p === 'SHIFT') result.shiftKey = true;
    else if (p === 'ALT') result.altKey = true;
    else result.key = p.toLowerCase();
  });
  return result;
}

export function matchesShortcut(event: KeyEvent, shortcut: { key: string; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean }): boolean {
  const keyMatch = event.key.toLowerCase() === shortcut.key?.toLowerCase();
  const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
  const metaMatch = !!shortcut.metaKey === event.metaKey;
  const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
  const altMatch = !!shortcut.altKey === event.altKey;
  return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;
}

export function formatShortcut(shortcut: Shortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.meta) parts.push('Cmd');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('+');
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

export function trapFocus(container: HTMLElement): () => void {
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return () => {};
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  first.focus();
  const handler = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const el = document.createElement('div');
  el.setAttribute('aria-live', priority);
  el.setAttribute('aria-atomic', 'true');
  el.className = 'sr-only';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 1000);
}