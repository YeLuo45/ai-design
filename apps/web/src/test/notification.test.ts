import { describe, it, expect, beforeEach } from 'vitest';
import { showNotification, getNotifications, clearNotifications, dismissNotification, submitFeedback, getFeedback, getFeedbackSummary } from '../notification.js';

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

describe('Notification & Feedback', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('TC-001: showNotification stores notification', () => {
    showNotification('success', 'Test message');
    const notifs = getNotifications();
    expect(notifs.length).toBe(1);
    expect(notifs[0].message).toBe('Test message');
  });

  it('TC-002: showNotification sets correct type', () => {
    showNotification('error', 'Error occurred');
    showNotification('warning', 'Warning');
    const notifs = getNotifications();
    expect(notifs[0].type).toBe('warning');
    expect(notifs[1].type).toBe('error');
  });

  it('TC-003: clearNotifications removes all', () => {
    showNotification('info', 'Message');
    clearNotifications();
    expect(getNotifications()).toHaveLength(0);
  });

  it('TC-004: dismissNotification removes one', () => {
    showNotification('info', 'To dismiss');
    const notif = getNotifications()[0];
    dismissNotification(notif.id);
    expect(getNotifications()).toHaveLength(0);
  });

  it('TC-005: submitFeedback stores feedback', () => {
    submitFeedback('skill-1', 'up', 'Great skill!');
    const feedback = getFeedback('skill-1');
    expect(feedback.length).toBe(1);
    expect(feedback[0].vote).toBe('up');
  });

  it('TC-006: getFeedback filters by targetId', () => {
    submitFeedback('skill-1', 'up');
    submitFeedback('skill-2', 'down');
    const skill1Feedback = getFeedback('skill-1');
    expect(skill1Feedback.length).toBe(1);
  });

  it('TC-007: getFeedbackSummary counts votes', () => {
    submitFeedback('skill-1', 'up');
    submitFeedback('skill-1', 'up');
    submitFeedback('skill-1', 'down');
    const summary = getFeedbackSummary('skill-1');
    expect(summary.up).toBe(2);
    expect(summary.down).toBe(1);
  });

  it('TC-008: showNotification limits to 50 entries', () => {
    for (let i = 0; i < 60; i++) {
      showNotification('info', `Message ${i}`);
    }
    const notifs = getNotifications();
    expect(notifs.length).toBeLessThanOrEqual(50);
  });

  it('TC-009: submitFeedback without reason is valid', () => {
    const feedback = submitFeedback('skill-1', 'down');
    expect(feedback.reason).toBeUndefined();
  });
});