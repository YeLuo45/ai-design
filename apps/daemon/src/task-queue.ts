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

  getStatus(id: string): Task | undefined {
    return this.tasks.get(id);
  }

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

  listTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  clear(): void {
    this.tasks.clear();
    this.idCounter = 0;
  }
}

export const taskQueue = new TaskQueue();
export { TaskQueue, Task };