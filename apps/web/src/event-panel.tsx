import { useState, useEffect } from 'react';

interface BusEvent {
  type: string;
  data: any;
  timestamp: number;
}

interface Task {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data: any;
  result?: any;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

interface EventPanelProps {
  sseConnected: boolean;
}

function EventPanel({ sseConnected }: EventPanelProps) {
  const [events, setEvents] = useState<BusEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Fetch initial event history
    fetch('http://localhost:3001/api/events')
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(() => {});

    // Fetch initial tasks
    fetch('http://localhost:3001/api/tasks')
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(() => {});

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      Promise.all([
        fetch('http://localhost:3001/api/events').then(res => res.json()).catch(() => []),
        fetch('http://localhost:3001/api/tasks').then(res => res.json()).catch(() => [])
      ]).then(([eventsData, tasksData]) => {
        setEvents(eventsData);
        setTasks(tasksData);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'running': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-zinc-900 text-zinc-100 rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">MessageBus Events</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-zinc-400">{sseConnected ? 'SSE Connected' : 'SSE Disconnected'}</span>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-300 mb-2">Task Queue ({tasks.length})</h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="text-xs text-zinc-500">No tasks</p>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between text-xs bg-zinc-800 rounded px-2 py-1">
                <span className="font-mono text-zinc-400 truncate">{task.id.split('_').slice(0, 2).join('_')}</span>
                <span className={`px-2 py-0.5 rounded ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Events Section */}
      <div className="flex-1">
        <h3 className="text-sm font-medium text-zinc-300 mb-2">Event History ({events.length}/20)</h3>
        <div className="space-y-1 overflow-y-auto flex-1">
          {events.length === 0 ? (
            <p className="text-xs text-zinc-500">No events</p>
          ) : (
            events.map((event, index) => (
              <div key={index} className="text-xs bg-zinc-800 rounded px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-400">{event.type}</span>
                  <span className="text-zinc-500">{formatTime(event.timestamp)}</span>
                </div>
                {event.data && typeof event.data === 'object' && (
                  <pre className="text-zinc-400 mt-1 overflow-hidden text-xs">
                    {JSON.stringify(event.data).slice(0, 50)}...
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default EventPanel;