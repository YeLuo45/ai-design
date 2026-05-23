import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(ROOT, '.ai-design');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db = null;
try {
  const Database = require('better-sqlite3');
  const dbPath = path.join(DATA_DIR, 'ai-design.db');
  db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY, name TEXT, path TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY, project_id INTEGER, title TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, conversation_id INTEGER, role TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS tabs (id INTEGER PRIMARY KEY, project_id INTEGER, name TEXT, status TEXT DEFAULT 'open', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  `);
  console.log('SQLite initialized:', dbPath);
} catch (e) {
  console.log('SQLite not available:', e.message);
}

function detectAgents() {
  const agents = ['claude', 'codex', 'opencode', 'cursor', 'windsurf', 'copilot'];
  return agents.filter(agent => {
    try {
      spawn('which', [agent], { stdio: 'ignore' }).on('error', () => {});
      return require('child_process').execSync(`which ${agent} 2>/dev/null`, { stdio: 'pipe' }).toString().trim();
    } catch { return false; }
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

const routes = {
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
        const result = db.prepare('INSERT INTO projects (name, path) VALUES (?, ?)').run(body.name, body.path || ROOT);
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
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    res.write('data: ' + JSON.stringify({ type: 'connected', agents: detectAgents() }) + '\n\n');
    const interval = setInterval(() => res.write('data: ' + JSON.stringify({ type: 'ping' }) + '\n\n'), 30000);
    req.on('close', () => clearInterval(interval));
  }
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const handler = routes[url.pathname];
  if (handler) handler(req, res);
  else { res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })); }
});

server.listen(PORT, () => console.log(`Daemon on ${PORT} | Agents: ${detectAgents().join(', ') || 'none'}`));
process.on('SIGTERM', () => { server.close(); process.exit(0); });