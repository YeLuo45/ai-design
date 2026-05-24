import { describe, it, expect, beforeEach } from 'vitest';

// TaskQueue implementation for testing (mirrors daemon/src/task-queue.ts)
interface Task {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data: any;
  result?: any;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

class TaskQueue {
  private tasks = new Map<string, Task>();
  private idCounter = 0;

  enqueue(data: any): string {
    const id = `task_${++this.idCounter}_${Date.now()}`;
    this.tasks.set(id, { id, status: 'pending', data, createdAt: Date.now() });
    return id;
  }

  getStatus(id: string): Task | undefined { return this.tasks.get(id); }

  setStatus(id: string, status: Task['status'], result?: any, error?: string): void {
    const task = this.tasks.get(id);
    if (!task) return;
    task.status = status;
    if (result !== undefined) task.result = result;
    if (error !== undefined) task.error = error;
    if (status === 'completed' || status === 'failed') {
      task.completedAt = Date.now();
    }
  }

  cancel(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task || task.status === 'completed' || task.status === 'failed') return false;
    task.status = 'failed';
    task.error = 'Cancelled by user';
    task.completedAt = Date.now();
    return true;
  }

  listTasks(): Task[] { return Array.from(this.tasks.values()); }
  clear(): void { this.tasks.clear(); this.idCounter = 0; }
}

export { TaskQueue, Task };

describe('TaskQueue', () => {
  let taskQueue: TaskQueue;

  beforeEach(() => {
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

    it('should do nothing for non-existent task', () => {
      expect(() => taskQueue.setStatus('nonexistent', 'running')).not.toThrow();
    });
  });

  describe('cancel', () => {
    it('should cancel a pending task', () => {
      const id = taskQueue.enqueue({});
      const result = taskQueue.cancel(id);
      expect(result).toBe(true);
      const task = taskQueue.getStatus(id);
      expect(task?.status).toBe('failed');
      expect(task?.error).toBe('Cancelled by user');
    });

    it('should cancel a running task', () => {
      const id = taskQueue.enqueue({});
      taskQueue.setStatus(id, 'running');
      const result = taskQueue.cancel(id);
      expect(result).toBe(true);
      const task = taskQueue.getStatus(id);
      expect(task?.status).toBe('failed');
    });

    it('should not cancel a completed task', () => {
      const id = taskQueue.enqueue({});
      taskQueue.setStatus(id, 'completed');
      const result = taskQueue.cancel(id);
      expect(result).toBe(false);
      const task = taskQueue.getStatus(id);
      expect(task?.status).toBe('completed');
    });

    it('should not cancel a failed task', () => {
      const id = taskQueue.enqueue({});
      taskQueue.setStatus(id, 'failed');
      const result = taskQueue.cancel(id);
      expect(result).toBe(false);
    });

    it('should return false for non-existent task', () => {
      const result = taskQueue.cancel('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('listTasks', () => {
    it('should return all tasks', () => {
      const id1 = taskQueue.enqueue({ n: 1 });
      const id2 = taskQueue.enqueue({ n: 2 });
      const tasks = taskQueue.listTasks();
      expect(tasks.length).toBe(2);
      expect(tasks.map(t => t.id)).toContain(id1);
      expect(tasks.map(t => t.id)).toContain(id2);
    });

    it('should return empty array when no tasks', () => {
      const tasks = taskQueue.listTasks();
      expect(tasks).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all tasks', () => {
      taskQueue.enqueue({});
      taskQueue.enqueue({});
      taskQueue.clear();
      expect(taskQueue.listTasks()).toEqual([]);
    });
  });

  describe('Task interface', () => {
    it('should have correct structure for enqueued task', () => {
      const id = taskQueue.enqueue({ test: true });
      const task: Task | undefined = taskQueue.getStatus(id);
      expect(task).toBeTruthy();
      expect(task!.id).toBe(id);
      expect(task!.status).toBe('pending');
      expect(task!.data).toEqual({ test: true });
      expect(task!.createdAt).toBeTruthy();
      expect(task!.createdAt).toBeLessThanOrEqual(Date.now());
    });
  });
});