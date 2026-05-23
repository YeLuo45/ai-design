// notification.ts - Toast notification and feedback system
export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration: number;
  timestamp: string;
}

export interface Feedback {
  targetId: string;
  vote: 'up' | 'down';
  reason?: string;
  timestamp: string;
}

const NOTIF_KEY = 'ai-design:notifications';
const FEEDBACK_KEY = 'ai-design:feedback';
const MAX_NOTIFICATIONS = 50;
const MAX_FEEDBACK = 100;

export function createNotification(type: NotificationType, message: string, duration = 3000): Notification {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    message,
    duration,
    timestamp: new Date().toISOString(),
  };
}

export function showNotification(type: NotificationType, message: string, duration = 3000): Notification {
  const notif = createNotification(type, message, duration);
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    const list: Notification[] = raw ? JSON.parse(raw) : [];
    list.unshift(notif);
    const trimmed = list.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage error - ignore
  }
  return notif;
}

export function getNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearNotifications(): void {
  localStorage.removeItem(NOTIF_KEY);
}

export function dismissNotification(id: string): void {
  try {
    const list = getNotifications();
    const filtered = list.filter(n => n.id !== id);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(filtered));
  } catch {
    // Storage error - ignore
  }
}

export function submitFeedback(targetId: string, vote: 'up' | 'down', reason?: string): Feedback {
  const feedback: Feedback = {
    targetId,
    vote,
    reason,
    timestamp: new Date().toISOString(),
  };
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const list: Feedback[] = raw ? JSON.parse(raw) : [];
    list.unshift(feedback);
    const trimmed = list.slice(0, MAX_FEEDBACK);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage error - ignore
  }
  return feedback;
}

export function getFeedback(targetId?: string): Feedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (!raw) return [];
    const list: Feedback[] = JSON.parse(raw);
    if (targetId) return list.filter(f => f.targetId === targetId);
    return list;
  } catch {
    return [];
  }
}

export function getFeedbackSummary(targetId: string): { up: number; down: number } {
  const feedback = getFeedback(targetId);
  return {
    up: feedback.filter(f => f.vote === 'up').length,
    down: feedback.filter(f => f.vote === 'down').length,
  };
}

export function confirmAction(message: string, onConfirm: () => void, onCancel?: () => void): void {
  if (typeof window !== 'undefined' && window.confirm) {
    if (window.confirm(message)) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  } else {
    onConfirm();
  }
}