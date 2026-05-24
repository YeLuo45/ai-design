import { EventEmitter } from 'events';

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

// Workspace store is module-level for singleton behavior
const workspaceStores: Map<string, WorkspaceStore> = new Map();

function getWorkspaceStore(workspaceId: string): WorkspaceStore {
  if (!workspaceStores.has(workspaceId)) {
    // Try to restore from localStorage
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

class EventBus extends EventEmitter {
  private currentWorkspace: string = DEFAULT_WORKSPACE;
  private maxHistory = MAX_EVENTS_DEFAULT;

  publish(event: string, data: any): void {
    const store = getWorkspaceStore(this.currentWorkspace);
    const busEvent: BusEvent = { type: event, data, timestamp: Date.now() };
    store.events.push(busEvent);
    if (store.events.length > store.maxEvents) {
      store.events.shift();
    }
    saveWorkspaceStore(this.currentWorkspace, store);
    this.emit(event, data);
  }

  getHistory(workspaceId?: string): BusEvent[] {
    const ws = workspaceId || this.currentWorkspace;
    const store = getWorkspaceStore(ws);
    return [...store.events];
  }

  subscribe(event: string, handler: (data: any) => void): void {
    this.on(event, handler);
  }

  unsubscribe(event: string, handler: (data: any) => void): void {
    this.off(event, handler);
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

  setMaxHistory(max: number): void {
    this.maxHistory = max;
    const store = getWorkspaceStore(this.currentWorkspace);
    store.maxEvents = max;
    saveWorkspaceStore(this.currentWorkspace, store);
  }
}

export const eventBus = new EventBus();
export { EventBus, BusEvent };