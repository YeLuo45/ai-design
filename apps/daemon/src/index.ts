/**
 * AI Design Daemon - Simplified version for Direction A
 */

import * as http from 'http';
import { execSync } from 'child_process';

// Configuration
const PORT = 3001;
const HOST = 'localhost';

// Known coding agent CLI names
const CODING_AGENTS = [
  'claude',        // Claude Code
  'codex',         // OpenAI Codex
  'hermes',        // Hermes Agent
  'cursor',        // Cursor AI
  'github-copilot', // GitHub Copilot
  'aider',         // Aider
  'continue',      // Continue.dev
];

interface AgentInfo {
  name: string;
  path: string | null;
  version: string | null;
}

interface Task {
  id: string;
  skill: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
  timestamp: Date;
}

// State
const activeTasks: Map<string, Task> = new Map();
const connectedClients: Set<http.ServerResponse> = new Set();

/**
 * Detect coding agents in PATH
 */
function detectCodingAgents(): AgentInfo[] {
  const agents: AgentInfo[] = [];

  for (const agent of CODING_AGENTS) {
    try {
      const result = execSync(`which ${agent} 2>/dev/null`, { encoding: 'utf-8' }).trim();
      if (result) {
        let version: string | null = null;
        try {
          version = execSync(`${agent} --version 2>/dev/null || ${agent} -v 2>/dev/null`, { encoding: 'utf-8', timeout: 5000 }).trim().split('\n')[0];
        } catch {
          // Version check failed, that's ok
        }
        agents.push({
          name: agent,
          path: result,
          version,
        });
      }
    } catch {
      // Agent not found in PATH
    }
  }

  return agents;
}

/**
 * Broadcast event to all connected SSE clients
 */
function broadcast(event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const clients = Array.from(connectedClients);
  for (const client of clients) {
    try {
      client.write(message);
    } catch (err) {
      console.error('Failed to send to client:', err);
      connectedClients.delete(client);
    }
  }
}

/**
 * Create SSE response
 */
function createSSEStream(res: http.ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial connection event
  res.write(`event: connected\ndata: {"status": "connected"}\n\n`);

  connectedClients.add(res);

  res.on('close', () => {
    connectedClients.delete(res);
  });
}

/**
 * Handle API requests
 */
function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // SSE stream endpoint
  if (pathname === '/sse/stream') {
    createSSEStream(res);
    return;
  }

  // Get detected agents
  if (pathname === '/api/agents') {
    const agents = detectCodingAgents();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ agents, count: agents.length }));
    return;
  }

  // Health check
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  // Task submission
  if (pathname === '/api/tasks' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const task = JSON.parse(body);
        const taskId = Date.now().toString();
        const newTask: Task = {
          id: taskId,
          skill: task.skill || 'unknown',
          status: 'pending',
          message: 'Task received',
          timestamp: new Date(),
        };
        activeTasks.set(taskId, newTask);
        broadcast('task', newTask);

        // Simulate task progress
        simulateTaskProgress(taskId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ taskId, status: 'accepted' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
    return;
  }

  // Get tasks
  if (pathname === '/api/tasks') {
    const tasks = Array.from(activeTasks.values());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tasks }));
    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

/**
 * Simulate task progress for demo purposes
 */
function simulateTaskProgress(taskId: string) {
  const messages = [
    'Initializing design process...',
    'Analyzing requirements...',
    'Creating component structure...',
    'Applying visual direction...',
    'Generating artifact...',
    'Finalizing preview...',
  ];

  let index = 0;
  const interval = setInterval(() => {
    const task = activeTasks.get(taskId);
    if (!task) {
      clearInterval(interval);
      return;
    }

    if (index < messages.length) {
      task.status = 'in_progress';
      task.message = messages[index];
      broadcast('task', task);
      index++;
    } else {
      task.status = 'completed';
      task.message = 'Design complete!';
      broadcast('task', task);
      clearInterval(interval);
    }
  }, 1000);
}

/**
 * Start the daemon server
 */
function startServer(): http.Server {
  const server = http.createServer(handleRequest);

  server.listen(PORT, () => {
    console.log(`AI Design Daemon running at http://${HOST}:${PORT}`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET  /health       - Health check');
    console.log('  GET  /api/agents   - List detected coding agents');
    console.log('  GET  /api/tasks    - List active tasks');
    console.log('  POST /api/tasks    - Submit new task');
    console.log('  GET  /sse/stream   - SSE event stream');
    console.log('');
    console.log('Detected coding agents:');
    const agents = detectCodingAgents();
    if (agents.length === 0) {
      console.log('  None found in PATH');
    } else {
      for (const agent of agents) {
        console.log(`  - ${agent.name} (${agent.path})`);
      }
    }
  });

  return server;
}

// Start server if run directly
startServer();

export { startServer, detectCodingAgents };