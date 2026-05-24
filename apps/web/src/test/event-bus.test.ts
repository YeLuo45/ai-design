import { describe, it, expect, beforeEach } from 'vitest';

// EventBus implementation for testing (mirrors daemon/src/event-bus.ts)
interface BusEvent {
  type: string;
  data: any;
  timestamp: number;
}

class EventBus {
  private history: BusEvent[] = [];
  private maxHistory = 20;
  private handlers: Map<string, Set<(data: any) => void>> = new Map();

  publish(event: string, data: any): void {
    const busEvent: BusEvent = { type: event, data, timestamp: Date.now() };
    this.history.push(busEvent);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(h => h(data));
    }
  }

  getHistory(): BusEvent[] { return [...this.history]; }

  subscribe(event: string, handler: (data: any) => void): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  unsubscribe(event: string, handler: (data: any) => void): void {
    this.handlers.get(event)?.delete(handler);
  }

  clearHistory(): void { this.history = []; }
}

export { EventBus, BusEvent };

// Create a test instance to avoid polluting the singleton
describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('publish and subscribe', () => {
    it('should publish event and notify subscribers', () => {
      let receivedData: any;
      eventBus.subscribe('test_event', (data) => {
        receivedData = data;
      });
      eventBus.publish('test_event', { message: 'hello' });
      expect(receivedData).toEqual({ message: 'hello' });
    });

    it('should handle multiple subscribers', () => {
      let count = 0;
      eventBus.subscribe('test_event', () => count++);
      eventBus.subscribe('test_event', () => count++);
      eventBus.publish('test_event', {});
      expect(count).toBe(2);
    });

    it('should handle unsubscribe', () => {
      let count = 0;
      const handler = () => count++;
      eventBus.subscribe('test_event', handler);
      eventBus.publish('test_event', {});
      eventBus.unsubscribe('test_event', handler);
      eventBus.publish('test_event', {});
      expect(count).toBe(1);
    });
  });

  describe('history', () => {
    it('should record events in history', () => {
      eventBus.publish('event1', { data: 1 });
      eventBus.publish('event2', { data: 2 });
      const history = eventBus.getHistory();
      expect(history.length).toBe(2);
      expect(history[0].type).toBe('event1');
      expect(history[1].type).toBe('event2');
    });

    it('should limit history to 20 events', () => {
      for (let i = 0; i < 25; i++) {
        eventBus.publish(`event${i}`, { index: i });
      }
      const history = eventBus.getHistory();
      expect(history.length).toBe(20);
      expect(history[0].type).toBe('event5');
      expect(history[19].type).toBe('event24');
    });

    it('should return a copy of history', () => {
      eventBus.publish('test', {});
      const history1 = eventBus.getHistory();
      const history2 = eventBus.getHistory();
      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });

    it('should include timestamp in events', () => {
      const before = Date.now();
      eventBus.publish('test', { data: 1 });
      const after = Date.now();
      const history = eventBus.getHistory();
      expect(history[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(history[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('clearHistory', () => {
    it('should clear all events from history', () => {
      eventBus.publish('event1', {});
      eventBus.publish('event2', {});
      eventBus.clearHistory();
      expect(eventBus.getHistory().length).toBe(0);
    });
  });

  describe('BusEvent interface', () => {
    it('should have correct structure', () => {
      eventBus.publish('my_event', { nested: { data: 'test' } });
      const history = eventBus.getHistory();
      const event: BusEvent = history[0];
      expect(event.type).toBe('my_event');
      expect(event.data).toEqual({ nested: { data: 'test' } });
      expect(typeof event.timestamp).toBe('number');
    });
  });
});