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

export const taskQueue = new TaskQueue();
export { TaskQueue, Task };