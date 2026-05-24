import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

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
    CREATE TABLE IF NOT EXISTS agent_sessions (id INTEGER PRIMARY KEY, agent_name TEXT, status TEXT DEFAULT 'running', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  `);
  console.log('SQLite initialized:', dbPath);
} catch (e) {
  console.log('SQLite not available:', e.message);
}

interface AgentProcess {
  process: ChildProcess;
  name: string;
  sessionId: number;
}

const activeAgents: AgentProcess[] = [];

// Detect agents in PATH
function detectAgents() {
  const agentNames = ['claude', 'codex', 'opencode', 'cursor', 'windsurf', 'copilot', 'hermes'];
  return agentNames.filter(agent => {
    try {
      const result = require('child_process').execSync(`which ${agent} 2>/dev/null`, { stdio: 'pipe' }).toString().trim();
      return result.length > 0;
    } catch { return false; }
  });
}

// SSRF protection - block internal IPs
function isBlockedIP(host) {
  const blocked = [
    /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./,
    /^127\./, /^localhost$/, /^0\.0\.0\.0$/, /^::1$/
  ];
  return blocked.some(r => r.test(host));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

function streamResponse(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// MCP Tool Registry
const mcpTools = {
  skill_generate: {
    name: 'skill_generate',
    description: 'Generate a design artifact using a skill (web-prototype, dashboard, mobile-app)',
    inputSchema: {
      type: 'object',
      properties: {
        skill: { type: 'string', enum: ['web-prototype', 'dashboard', 'mobile-app'], description: 'Skill to use' },
        direction: { type: 'string', description: 'Visual direction (e.g., minimal, modern, playful)' },
        device_frame: { type: 'string', description: 'Device frame for preview' },
        brief: { type: 'string', description: 'Design brief or description' },
      },
      required: ['skill', 'brief'],
    },
  },
  design_preview: {
    name: 'design_preview',
    description: 'Preview an artifact in a device frame',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string', description: 'Artifact ID to preview' },
        device_frame: { type: 'string', description: 'Device frame type' },
      },
      required: ['artifact_id'],
    },
  },
  artifact_export: {
    name: 'artifact_export',
    description: 'Export artifact as HTML or ZIP',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string', description: 'Artifact ID to export' },
        format: { type: 'string', enum: ['html', 'zip'], description: 'Export format' },
      },
      required: ['artifact_id', 'format'],
    },
  },
  design_visual_directions: {
    name: 'design_visual_directions',
    description: 'List available visual directions for design',
    inputSchema: { type: 'object', properties: {} },
  },
  design_device_frames: {
    name: 'design_device_frames',
    description: 'List available device frames for preview',
    inputSchema: { type: 'object', properties: {} },
  },
};

// Visual directions and device frames
const visualDirections = ['minimal', 'modern', 'playful', 'professional', 'elegant', 'bold'];
const deviceFrames = ['desktop', 'tablet', 'mobile', 'responsive'];

// MCP Tool Handlers
async function handleSkillGenerate(args) {
  const { skill, direction, device_frame, brief } = args;
  // Generate HTML based on skill - simplified implementation
  const skillData = {
    'web-prototype': { template: '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Web Prototype</title><style>body{font-family:system-ui;padding:2rem;background:#f5f5f5;}.container{max-width:1200px;margin:0 auto;background:#fff;padding:2rem;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);}</style></head><body><div class="container"><h1>Web Prototype</h1><p>Skill: web-prototype | Direction: ' + (direction || 'default') + ' | Brief: ' + (brief || '') + '</p></div></body></html>' },
    'dashboard': { template: '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dashboard</title><style>body{font-family:system-ui;padding:2rem;background:#1a1a2e;color:#fff;}.container{max-width:1200px;margin:0 auto;}.card{background:#16213e;padding:1.5rem;border-radius:8px;margin-bottom:1rem;}</style></head><body><div class="container"><h1>Dashboard</h1><div class="card"><h2>Analytics</h2><p>Skill: dashboard | Direction: ' + (direction || 'default') + '</p></div></div></body></html>' },
    'mobile-app': { template: '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mobile App</title><style>body{font-family:system-ui;background:#000;color:#fff;padding:1rem;}.container{max-width:375px;margin:0 auto;background:#1c1c1e;min-height:100vh;padding:1rem;}</style></head><body><div class="container"><h1>Mobile App</h1><p>Skill: mobile-app | Direction: ' + (direction || 'default') + '</p></div></body></html>' },
  };
  const artifact = skillData[skill] || skillData['web-prototype'];
  return {
    artifact_id: `artifact_${Date.now()}`,
    html: artifact.template,
    skill,
    direction: direction || 'default',
  };
}

async function handleDesignPreview(args) {
  const { artifact_id, device_frame } = args;
  return {
    artifact_id,
    device_frame: device_frame || 'desktop',
    preview_url: `/preview/${artifact_id}?frame=${device_frame || 'desktop'}`,
    html: '<div style="padding:2rem;text-align:center;"><h2>Preview: ' + artifact_id + '</h2><p>Device: ' + (device_frame || 'desktop') + '</p></div>',
  };
}

async function handleArtifactExport(args) {
  const { artifact_id, format } = args;
  return {
    artifact_id,
    format,
    download_url: `/export/${artifact_id}.${format}`,
    size: '12KB',
  };
}

async function handleDesignVisualDirections(args) {
  return { directions: visualDirections };
}

async function handleDesignDeviceFrames(args) {
  return { frames: deviceFrames };
}

const mcpHandlers = {
  skill_generate: handleSkillGenerate,
  design_preview: handleDesignPreview,
  artifact_export: handleArtifactExport,
  design_visual_directions: handleDesignVisualDirections,
  design_device_frames: handleDesignDeviceFrames,
};

const routes = {
  '/health': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'running', 
      agents: detectAgents(),
      activeAgents: activeAgents.length
    }));
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
        res.writeHead(500).end();
      }
    } else {
      res.writeHead(405).end();
    }
  },
  '/api/agents': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ detected: detectAgents(), active: activeAgents.map(a => ({ name: a.name, sessionId: a.sessionId })) }));
  },
  '/api/agents/spawn': async (req, res) => {
    if (req.method !== 'POST') { res.writeHead(405).end(); return; }
    const body = await parseBody(req);
    const agentName = body.agent || 'claude';
    const workingDir = body.workingDir || ROOT;
    
    try {
      const agentProcess = spawn(agentName, [], { cwd: workingDir, stdio: ['pipe', 'pipe', 'pipe'] });
      const sessionId = db ? db.prepare('INSERT INTO agent_sessions (agent_name) VALUES (?)').run(agentName).lastInsertRowid : Date.now();
      
      const agentInfo: AgentProcess = { process: agentProcess, name: agentName, sessionId: sessionId as number };
      activeAgents.push(agentInfo);
      
      agentProcess.stdout.on('data', (data) => {
        streamResponse(res, { type: 'output', agent: agentName, data: data.toString() });
      });
      agentProcess.stderr.on('data', (data) => {
        streamResponse(res, { type: 'error', agent: agentName, data: data.toString() });
      });
      agentProcess.on('close', (code) => {
        streamResponse(res, { type: 'close', agent: agentName, code });
        const idx = activeAgents.indexOf(agentInfo);
        if (idx >= 0) activeAgents.splice(idx, 1);
      });
      
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
      res.write(`data: ${JSON.stringify({ type: 'spawned', agent: agentName, sessionId })}\n\n`);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  },
  '/api/agents/send': async (req, res) => {
    const body = await parseBody(req);
    const { sessionId, command } = body;
    const agent = activeAgents.find(a => a.sessionId === sessionId);
    if (agent && agent.process.stdin.writable) {
      agent.process.stdin.write(command + '\n');
      res.writeHead(200).end(JSON.stringify({ sent: true }));
    } else {
      res.writeHead(404).end(JSON.stringify({ error: 'Agent not found' }));
    }
  },
  '/api/agents/stop': (req, res) => {
    const body = req.method === 'POST' ? { sessionId: parseInt(new URL(req.url, `http://localhost:${PORT}`).searchParams.get('sessionId') || '0') } : {};
    const agent = activeAgents.find(a => a.sessionId === body.sessionId);
    if (agent) {
      agent.process.kill();
      res.writeHead(200).end(JSON.stringify({ stopped: true }));
    } else {
      res.writeHead(404).end(JSON.stringify({ error: 'Agent not found' }));
    }
  },
  '/api/proxy/:provider.stream': async (req, res, params) => {
    const provider = params.provider;
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const targetHost = url.hostname;
    
    // SSRF check
    if (isBlockedIP(targetHost)) {
      res.writeHead(403).end(JSON.stringify({ error: 'Access to internal IP denied' }));
      return;
    }
    
    const apiKey = req.headers['x-api-key'] || '';
    const baseUrl = `https://api.${provider}.com/v1`;
    
    // Proxy request to AI provider
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }
    };
    
    try {
      const targetUrl = `${baseUrl}${url.pathname.replace(`/api/proxy/${provider}`, '')}${url.search}`;
      const response = await fetch(targetUrl, { ...options, body: JSON.stringify({}) });
      
      res.writeHead(response.status, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
      
      for await (const chunk of response.body) {
        res.write(chunk);
      }
    } catch (e) {
      res.writeHead(502).end(JSON.stringify({ error: 'Proxy failed' }));
    }
  },
  '/api/sse': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    res.write('data: ' + JSON.stringify({ type: 'connected', agents: detectAgents() }) + '\n\n');
    const interval = setInterval(() => res.write('data: ' + JSON.stringify({ type: 'ping' }) + '\n\n'), 30000);
    req.on('close', () => clearInterval(interval));
  },
  '/mcp/tools': (req, res) => {
    // GET /mcp/tools - List available MCP tools
    const tools = Object.values(mcpTools).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tools }));
  },
  '/mcp': async (req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405).end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    try {
      const body = await parseBody(req);
      // JSON-RPC 2.0 Request format: {jsonrpc: "2.0", id, method: "tools/call", params: {name, arguments}}
      const { jsonrpc, id, method, params } = body;
      
      if (jsonrpc !== '2.0') {
        res.writeHead(400).end(JSON.stringify({ error: 'Invalid JSON-RPC version' }));
        return;
      }
      
      if (method === 'tools/call') {
        const { name, arguments: args = {} } = params || {};
        const handler = mcpHandlers[name];
        
        if (!handler) {
          res.writeHead(404).end(JSON.stringify({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Tool '${name}' not found` }
          }));
          return;
        }
        
        try {
          const result = await handler(args);
          // MCP response format: {content: [{type: "text", text: "..."}]}
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{ type: 'text', text: JSON.stringify(result) }]
            }
          }));
        } catch (toolError) {
          res.writeHead(500).end(JSON.stringify({
            jsonrpc: '2.0',
            id,
            error: { code: -32603, message: toolError.message }
          }));
        }
      } else if (method === 'tools/list') {
        // Handle tools/list for tool discovery
        const tools = Object.values(mcpTools).map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', id, result: { tools } }));
      } else {
        res.writeHead(400).end(JSON.stringify({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method '${method}' not found` }
        }));
      }
    } catch (parseError) {
      res.writeHead(400).end(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' }
      }));
    }
  },
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  
  // Route matching
  let handler = routes[url.pathname];
  if (!handler) {
    const proxyMatch = url.pathname.match(/^\/api\/proxy\/([^/]+)\.stream/);
    if (proxyMatch) {
      handler = (req, res) => routes['/api/proxy/:provider.stream'](req, res, { provider: proxyMatch[1] });
    }
  }
  if (handler) handler(req, res);
  else { res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })); }
});

server.listen(PORT, () => console.log(`Daemon ${PORT} | Agents: ${detectAgents().join(', ') || 'none'} | Active: ${activeAgents.length}`));
process.on('SIGTERM', () => { activeAgents.forEach(a => a.process.kill()); server.close(); process.exit(0); });