import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage before importing
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

interface BusEvent {
  type: string;
  data: any;
  timestamp: number;
}

interface WorkspaceStore {
  events: BusEvent[];
  maxEvents: number;
}

const WORKSPACE_KEY_PREFIX = 'ai-design-workspace-';
const DEFAULT_WORKSPACE = 'default';
const MAX_EVENTS_DEFAULT = 500;

const workspaceStores: Map<string, WorkspaceStore> = new Map();

function getWorkspaceStore(workspaceId: string): WorkspaceStore {
  if (!workspaceStores.has(workspaceId)) {
    const stored = localStorage.getItem(WORKSPACE_KEY_PREFIX + workspaceId);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        workspaceStores.set(workspaceId, { events: parsed.events || [], maxEvents: parsed.maxEvents || MAX_EVENTS_DEFAULT });
      } catch {
        workspaceStores.set(workspaceId, { events: [], maxEvents: MAX_EVENTS_DEFAULT });
      }
    } else {
      workspaceStores.set(workspaceId, { events: [], maxEvents: MAX_EVENTS_DEFAULT });
    }
  }
  return workspaceStores.get(workspaceId)!;
}

function saveWorkspaceStore(workspaceId: string, store: WorkspaceStore): void {
  localStorage.setItem(WORKSPACE_KEY_PREFIX + workspaceId, JSON.stringify({
    events: store.events,
    maxEvents: store.maxEvents
  }));
}

class EventBus {
  private currentWorkspace: string = DEFAULT_WORKSPACE;
  private maxHistory = MAX_EVENTS_DEFAULT;
  private handlers: Map<string, Set<(data: any) => void>> = new Map();

  publish(event: string, data: any): void {
    const store = getWorkspaceStore(this.currentWorkspace);
    const busEvent: BusEvent = { type: event, data, timestamp: Date.now() };
    store.events.push(busEvent);
    if (store.events.length > store.maxEvents) {
      store.events.shift();
    }
    saveWorkspaceStore(this.currentWorkspace, store);
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(h => h(data));
    }
  }

  getHistory(workspaceId?: string): BusEvent[] {
    const ws = workspaceId || this.currentWorkspace;
    const store = getWorkspaceStore(ws);
    return [...store.events];
  }

  subscribe(event: string, handler: (data: any) => void): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  unsubscribe(event: string, handler: (data: any) => void): void {
    this.handlers.get(event)?.delete(handler);
  }

  clearHistory(workspaceId?: string): void {
    const ws = workspaceId || this.currentWorkspace;
    const store = getWorkspaceStore(ws);
    store.events = [];
    saveWorkspaceStore(ws, store);
  }

  setWorkspace(workspaceId: string): void {
    this.currentWorkspace = workspaceId;
  }

  getCurrentWorkspace(): string {
    return this.currentWorkspace;
  }

  setMaxEvents(max: number): void {
    this.maxHistory = max;
    const store = getWorkspaceStore(this.currentWorkspace);
    store.maxEvents = max;
    saveWorkspaceStore(this.currentWorkspace, store);
  }
}

export { EventBus, BusEvent };

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    // Clear module-level caches between tests
    workspaceStores.clear();
    localStorage.clear();
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

    it('should limit history to 500 events by default', () => {
      for (let i = 0; i < 505; i++) {
        eventBus.publish(`event${i}`, { index: i });
      }
      const history = eventBus.getHistory();
      expect(history.length).toBe(500);
      expect(history[0].type).toBe('event5');
      expect(history[499].type).toBe('event504');
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

  describe('workspace support', () => {
    it('should set and get current workspace', () => {
      expect(eventBus.getCurrentWorkspace()).toBe(DEFAULT_WORKSPACE);
      eventBus.setWorkspace('workspace-1');
      expect(eventBus.getCurrentWorkspace()).toBe('workspace-1');
    });

    it('should isolate history between workspaces', () => {
      eventBus.publish('event_a', { data: 'a' });
      eventBus.setWorkspace('workspace-b');
      eventBus.publish('event_b', { data: 'b' });
      const historyA = eventBus.getHistory('default');
      const historyB = eventBus.getHistory('workspace-b');
      expect(historyA.length).toBe(1);
      expect(historyA[0].type).toBe('event_a');
      expect(historyB.length).toBe(1);
      expect(historyB[0].type).toBe('event_b');
    });

    it('should clear history for specific workspace', () => {
      eventBus.publish('event1', {});
      eventBus.setWorkspace('ws-x');
      eventBus.publish('event2', {});
      eventBus.publish('event3', {});
      eventBus.clearHistory('ws-x');
      expect(eventBus.getHistory('ws-x').length).toBe(0);
      expect(eventBus.getHistory('default').length).toBe(1);
    });

    it('should persist history to localStorage', () => {
      eventBus.publish('test_event', { data: 'persisted' });
      const stored = localStorage.getItem(WORKSPACE_KEY_PREFIX + DEFAULT_WORKSPACE);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.events.length).toBe(1);
      expect(parsed.events[0].type).toBe('test_event');
    });

    it('should restore history from localStorage on new instance', () => {
      eventBus.publish('event1', {});
      eventBus.publish('event2', {});
      // Simulate new instance by clearing the module cache
      workspaceStores.clear();
      const newBus = new EventBus();
      const history = newBus.getHistory();
      expect(history.length).toBe(2);
    });

    it('should getHistory with workspaceId parameter', () => {
      eventBus.publish('e1', {});
      eventBus.setWorkspace('ws-y');
      eventBus.publish('e2', {});
      const hist = eventBus.getHistory('ws-y');
      expect(hist.length).toBe(1);
      expect(hist[0].type).toBe('e2');
    });
  });
});