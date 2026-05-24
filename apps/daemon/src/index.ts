import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { eventBus } from './event-bus.js';
import { taskQueue } from './task-queue.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(ROOT, '.ai-design');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Simple SQLite via better-sqlite3
let db: any = null;
try {
  const Database = require('better-sqlite3');
  const dbPath = path.join(DATA_DIR, 'ai-design.db');
  db = new Database(dbPath);
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      role TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );
    CREATE TABLE IF NOT EXISTS tabs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      name TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);
  console.log('SQLite initialized:', dbPath);
} catch (e: any) {
  console.log('SQLite not available:', e.message);
}

// Detect agents in PATH
function detectAgents(): string[] {
  const agents = ['claude', 'codex', 'opencode', 'cursor', 'windsurf', 'copilot'];
  const detected: string[] = [];
  for (const agent of agents) {
    try {
      const result = spawn('which', [agent]);
      if (result.pid) detected.push(agent);
    } catch {}
  }
  return detected;
}

// Parse request body
function parseBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// SSE clients for event broadcasting
const sseClients: Set<any> = new Set();

// Broadcast event to all SSE clients
function broadcastEvent(eventType: string, data: any): void {
  const payload = JSON.stringify({ type: eventType, data, timestamp: Date.now() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Subscribe eventBus to broadcast events
eventBus.on('agent_started', (data: any) => broadcastEvent('agent_started', data));
eventBus.on('agent_completed', (data: any) => broadcastEvent('agent_completed', data));
eventBus.on('artifact_generated', (data: any) => broadcastEvent('artifact_generated', data));

// Routes
const routes: Record<string, (req: any, res: any) => void> = {
  '/health': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'running', agents: detectAgents() }));
  },
  '/api/projects': async (req, res) => {
    if (req.method === 'GET') {
      const projects = db ? db.prepare('SELECT * FROM projects').all() : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(projects));
    } else if (req.method === 'POST') {
      const body = await parseBody(req);
      if (db) {
        const stmt = db.prepare('INSERT INTO projects (name, path) VALUES (?, ?)');
        const result = stmt.run(body.name, body.path || ROOT);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: result.lastInsertRowid, name: body.name }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'SQLite not available' }));
      }
    } else {
      res.writeHead(405).end();
    }
  },
  '/api/agents': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(detectAgents()));
  },
  '/api/tasks': (req, res) => {
    if (req.method === 'POST') {
      parseBody(req).then(body => {
        const id = taskQueue.enqueue(body.data || body);
        eventBus.publish('task_enqueued', { id, data: body });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id }));
      });
    } else if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(taskQueue.listTasks()));
    } else {
      res.writeHead(405).end();
    }
  },
  '/api/tasks/:id': (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    const id = url.pathname.split('/').pop() || '';
    if (req.method === 'GET') {
      const task = taskQueue.getStatus(id);
      if (task) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(task));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Task not found' }));
      }
    } else if (req.method === 'DELETE') {
      const cancelled = taskQueue.cancel(id);
      if (cancelled) {
        eventBus.publish('task_cancelled', { id });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Cannot cancel task' }));
      }
    } else {
      res.writeHead(405).end();
    }
  },
  '/api/events': (req, res) => {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(eventBus.getHistory()));
    } else {
      res.writeHead(405).end();
    }
  },
  '/api/sse': (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Register SSE client
    sseClients.add(res);
    
    // Send initial connected event with agents
    const agents = detectAgents();
    res.write(`data: ${JSON.stringify({ type: 'connected', agents, timestamp: Date.now() })}\n\n`);
    
    // Keep alive ping
    const interval = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
      } catch {
        clearInterval(interval);
        sseClients.delete(res);
      }
    }, 30000);
    
    req.on('close', () => {
      clearInterval(interval);
      sseClients.delete(res);
    });
  }
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  
  const handler = routes[url.pathname];
  if (handler) {
    handler(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Daemon running on port ${PORT}`);
  console.log(`Agents detected:`, detectAgents());
});

process.on('SIGTERM', () => { server.close(); process.exit(0); });
process.on('SIGINT', () => { server.close(); process.exit(0); });