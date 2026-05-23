import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  '/api/sse': (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    // Send initial event
    res.write('data: {"type":"connected","agents":' + JSON.stringify(detectAgents()) + '}\n\n');
    // Keep alive ping
    const interval = setInterval(() => {
      res.write('data: {"type":"ping"}\n\n');
    }, 30000);
    req.on('close', () => clearInterval(interval));
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