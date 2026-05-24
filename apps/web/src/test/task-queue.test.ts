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

interface Task {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data: any;
  result?: any;
  error?: string;
  createdAt: number;
  completedAt?: number;
  workspaceId?: string;
}

const WORKSPACE_KEY_PREFIX_TQ = 'ai-design-tasks-';
const DEFAULT_WORKSPACE_TQ = 'default';

interface TaskStore {
  tasks: Map<string, Task>;
  idCounter: number;
}

const workspaceTaskStores: Map<string, TaskStore> = new Map();

function getTaskStore(workspaceId: string): TaskStore {
  if (!workspaceTaskStores.has(workspaceId)) {
    const stored = localStorage.getItem(WORKSPACE_KEY_PREFIX_TQ + workspaceId);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const map = new Map<string, Task>();
        for (const [k, v] of Object.entries(parsed.tasks || {})) {
          map.set(k, v as Task);
        }
        workspaceTaskStores.set(workspaceId, { tasks: map, idCounter: parsed.idCounter || 0 });
      } catch {
        workspaceTaskStores.set(workspaceId, { tasks: new Map(), idCounter: 0 });
      }
    } else {
      workspaceTaskStores.set(workspaceId, { tasks: new Map(), idCounter: 0 });
    }
  }
  return workspaceTaskStores.get(workspaceId)!;
}

function saveTaskStore(workspaceId: string, store: TaskStore): void {
  const obj: Record<string, Task> = {};
  store.tasks.forEach((v, k) => { obj[k] = v; });
  localStorage.setItem(WORKSPACE_KEY_PREFIX_TQ + workspaceId, JSON.stringify({
    tasks: obj,
    idCounter: store.idCounter
  }));
}

class TaskQueue {
  private currentWorkspace: string = DEFAULT_WORKSPACE_TQ;

  enqueue(data: any, workspaceId?: string): string {
    const ws = workspaceId || this.currentWorkspace;
    const store = getTaskStore(ws);
    const id = `task_${++store.idCounter}_${Date.now()}`;
    store.tasks.set(id, { id, status: 'pending', data, createdAt: Date.now(), workspaceId: ws });
    saveTaskStore(ws, store);
    return id;
  }

  getStatus(id: string, workspaceId?: string): Task | undefined {
    const ws = workspaceId || this.currentWorkspace;
    return getTaskStore(ws).tasks.get(id);
  }

  setStatus(id: string, status: Task['status'], result?: any, error?: string, workspaceId?: string): void {
    const ws = workspaceId || this.currentWorkspace;
    const store = getTaskStore(ws);
    const task = store.tasks.get(id);
    if (!task) return;
    task.status = status;
    if (result !== undefined) task.result = result;
    if (error !== undefined) task.error = error;
    if (status === 'completed' || status === 'failed') {
      task.completedAt = Date.now();
    }
    saveTaskStore(ws, store);
  }

  cancel(id: string, workspaceId?: string): boolean {
    const ws = workspaceId || this.currentWorkspace;
    const store = getTaskStore(ws);
    const task = store.tasks.get(id);
    if (!task || task.status === 'completed' || task.status === 'failed') return false;
    task.status = 'failed';
    task.error = 'Cancelled by user';
    task.completedAt = Date.now();
    saveTaskStore(ws, store);
    return true;
  }

  listTasks(workspaceId?: string): Task[] {
    const ws = workspaceId || this.currentWorkspace;
    return Array.from(getTaskStore(ws).tasks.values());
  }

  clear(workspaceId?: string): void {
    const ws = workspaceId || this.currentWorkspace;
    const store = getTaskStore(ws);
    store.tasks.clear();
    store.idCounter = 0;
    saveTaskStore(ws, store);
  }

  setWorkspace(workspaceId: string): void {
    this.currentWorkspace = workspaceId;
  }

  getCurrentWorkspace(): string {
    return this.currentWorkspace;
  }
}

export { TaskQueue, Task };

describe('TaskQueue', () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
    // Clear module-level cache between tests
    workspaceTaskStores.clear();
    localStorage.clear();
    taskQueue = new TaskQueue();
  });

  describe('enqueue', () => {
    it('should enqueue a task and return an id', () => {
      const id = taskQueue.enqueue({ data: 'test' });
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
      expect(id.startsWith('task_')).toBe(true);
    });

    it('should set task status to pending', () => {
      const id = taskQueue.enqueue({});
      const task = taskQueue.getStatus(id);
      expect(task?.status).toBe('pending');
    });

    it('should store task data', () => {
      const id = taskQueue.enqueue({ value: 42 });
      const task = taskQueue.getStatus(id);
      expect(task?.data).toEqual({ value: 42 });
    });

    it('should assign workspace to task', () => {
      const id = taskQueue.enqueue({ data: 'test' });
      const task = taskQueue.getStatus(id);
      expect(task?.workspaceId).toBe(DEFAULT_WORKSPACE_TQ);
    });

    it('should enqueue to specific workspace', () => {
      const id = taskQueue.enqueue({ data: 'test' }, 'workspace-b');
      const task = taskQueue.getStatus(id, 'workspace-b');
      expect(task?.workspaceId).toBe('workspace-b');
    });
  });

  describe('getStatus', () => {
    it('should return task by id', () => {
      const id = taskQueue.enqueue({});
      const task = taskQueue.getStatus(id);
      expect(task).toBeTruthy();
      expect(task?.id).toBe(id);
    });

    it('should return undefined for non-existent task', () => {
      const task = taskQueue.getStatus('nonexistent');
      expect(task).toBeUndefined();
    });

    it('should return task from specific workspace', () => {
      const id = taskQueue.enqueue({ data: 'test' }, 'ws-x');
      const task = taskQueue.getStatus(id, 'ws-x');
      expect(task?.data).toEqual({ data: 'test' });
    });
  });

  describe('setStatus', () => {
    it('should update task status to running', () => {
      const id = taskQueue.enqueue({});
      taskQueue.setStatus(id, 'running');
      const task = taskQueue.getStatus(id);
      expect(task?.status).toBe('running');
    });

    it('should update task status to completed with result', () => {
      const id = taskQueue.enqueue({});
      taskQueue.setStatus(id, 'completed', { success: true });
      const task = taskQueue.getStatus(id);
      expect(task?.status).toBe('completed');
      expect(task?.result).toEqual({ success: true });
    });

    it('should update task status to failed with error', () => {
      const id = taskQueue.enqueue({});
      taskQueue.setStatus(id, 'failed', undefined, 'Something went wrong');
      const task = taskQueue.getStatus(id);
      expect(task?.status).toBe('failed');
      expect(task?.error).toBe('Something went wrong');
    });

    it('should set completedAt when status is completed', () => {
      const id = taskQueue.enqueue({});
      taskQueue.setStatus(id, 'completed', { result: 'done' });
      const task = taskQueue.getStatus(id);
      expect(task?.completedAt).toBeTruthy();
      expect(typeof task?.completedAt).toBe('number');
    });

    it('should set completedAt when status is failed', () => {
      const id = taskQueue.enqueue({});
      taskQueue.setStatus(id, 'failed', undefined, 'Error');
      const task = taskQueue.getStatus(id);
      expect(task?.completedAt).toBeTruthy();
    });
  });

  describe('cancel', () => {
    it('should cancel a pending task', () => {
      const id = taskQueue.enqueue({});
      const result = taskQueue.cancel(id);
      const task = taskQueue.getStatus(id);
      expect(result).toBe(true);
      expect(task?.status).toBe('failed');
      expect(task?.error).toBe('Cancelled by user');
    });

    it('should not cancel a completed task', () => {
      const id = taskQueue.enqueue({});
      taskQueue.setStatus(id, 'completed');
      const result = taskQueue.cancel(id);
      expect(result).toBe(false);
    });

    it('should not cancel a non-existent task', () => {
      const result = taskQueue.cancel('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('listTasks', () => {
    it('should list all tasks', () => {
      taskQueue.enqueue({ n: 1 });
      taskQueue.enqueue({ n: 2 });
      const tasks = taskQueue.listTasks();
      expect(tasks.length).toBe(2);
    });

    it('should list tasks from specific workspace', () => {
      taskQueue.enqueue({ n: 1 }, 'ws-a');
      taskQueue.enqueue({ n: 2 }, 'ws-b');
      taskQueue.enqueue({ n: 3 });
      const tasksA = taskQueue.listTasks('ws-a');
      const tasksB = taskQueue.listTasks('ws-b');
      expect(tasksA.length).toBe(1);
      expect(tasksB.length).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all tasks in current workspace', () => {
      taskQueue.enqueue({ n: 1 });
      taskQueue.enqueue({ n: 2 });
      taskQueue.clear();
      expect(taskQueue.listTasks().length).toBe(0);
    });

    it('should clear tasks in specific workspace only', () => {
      taskQueue.enqueue({ n: 1 }, 'ws-x');
      taskQueue.enqueue({ n: 2 });
      taskQueue.clear('ws-x');
      expect(taskQueue.listTasks('ws-x').length).toBe(0);
      expect(taskQueue.listTasks().length).toBe(1);
    });
  });

  describe('workspace isolation', () => {
    it('should isolate tasks between workspaces', () => {
      const id1 = taskQueue.enqueue({ val: 1 }, 'ws-1');
      const id2 = taskQueue.enqueue({ val: 2 }, 'ws-2');
      taskQueue.setStatus(id1, 'completed', { result: 'done' }, undefined, 'ws-1');
      // ws-2 task should be independent
      expect(taskQueue.getStatus(id1, 'ws-1')?.status).toBe('completed');
      expect(taskQueue.getStatus(id2, 'ws-2')?.status).toBe('pending');
    });

    it('should persist tasks to localStorage', () => {
      const id = taskQueue.enqueue({ val: 'persisted' });
      // Trigger save
      taskQueue.setStatus(id, 'running');
      // Get stored data
      const stored = localStorage.getItem(WORKSPACE_KEY_PREFIX_TQ + DEFAULT_WORKSPACE_TQ);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.tasks[id]).toBeTruthy();
    });

    it('should set and get current workspace', () => {
      expect(taskQueue.getCurrentWorkspace()).toBe(DEFAULT_WORKSPACE_TQ);
      taskQueue.setWorkspace('new-workspace');
      expect(taskQueue.getCurrentWorkspace()).toBe('new-workspace');
    });
  });
});