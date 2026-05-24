import { EventEmitter } from 'events';

interface BusEvent {
  type: string;
  data: any;
  timestamp: number;
}

class EventBus extends EventEmitter {
  private history: BusEvent[] = [];
  private maxHistory = 20;

  publish(event: string, data: any): void {
    const busEvent: BusEvent = { type: event, data, timestamp: Date.now() };
    this.history.push(busEvent);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.emit(event, data);
  }

  getHistory(): BusEvent[] {
    return [...this.history];
  }

  subscribe(event: string, handler: (data: any) => void): void {
    this.on(event, handler);
  }

  unsubscribe(event: string, handler: (data: any) => void): void {
    this.off(event, handler);
  }

  clearHistory(): void {
    this.history = [];
  }
}

export const eventBus = new EventBus();
export { EventBus, BusEvent };