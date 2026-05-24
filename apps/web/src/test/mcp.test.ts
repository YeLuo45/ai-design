import { describe, it, expect } from 'vitest';

// Mock MCP tool definitions (same as in daemon)
const mcpTools = [
  {
    name: 'skill_generate',
    description: 'Generate a design artifact using a skill (web-prototype, dashboard, mobile-app)',
    inputSchema: {
      type: 'object',
      properties: {
        skill: { type: 'string', enum: ['web-prototype', 'dashboard', 'mobile-app'], description: 'Skill to use' },
        direction: { type: 'string', description: 'Visual direction' },
        device_frame: { type: 'string', description: 'Device frame for preview' },
        brief: { type: 'string', description: 'Design brief or description' }
      },
      required: ['skill', 'brief']
    }
  },
  {
    name: 'design_preview',
    description: 'Preview an artifact in a device frame',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string', description: 'Artifact ID to preview' },
        device_frame: { type: 'string', description: 'Device frame type' }
      },
      required: ['artifact_id']
    }
  },
  {
    name: 'artifact_export',
    description: 'Export artifact as HTML or ZIP',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: { type: 'string', description: 'Artifact ID to export' },
        format: { type: 'string', enum: ['html', 'zip'], description: 'Export format' }
      },
      required: ['artifact_id', 'format']
    }
  },
  {
    name: 'design_visual_directions',
    description: 'List available visual directions for design',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'design_device_frames',
    description: 'List available device frames for preview',
    inputSchema: { type: 'object', properties: {} }
  }
];

function parseMCPRequest(body) {
  try {
    const req = typeof body === 'string' ? JSON.parse(body) : body;
    if (req.jsonrpc !== '2.0') {
      return { error: { code: -32600, message: 'Invalid Request: jsonrpc version must be "2.0"' } };
    }
    return { req, error: null };
  } catch {
    return { error: { code: -32700, message: 'Parse error' } };
  }
}

function callTool(name, arguments_) {
  const tool = mcpTools.find(t => t.name === name);
  if (!tool) {
    return { error: { code: -32601, message: `Tool '${name}' not found` } };
  }
  
  // Validate required params
  const schema = tool.inputSchema;
  if (schema.required) {
    for (const required of schema.required) {
      if (arguments_[required] === undefined) {
        return { error: { code: -32602, message: `Missing required parameter: ${required}` } };
      }
    }
  }
  
  // Simulate tool execution
  let result;
  switch (name) {
    case 'skill_generate':
      result = {
        artifact_id: `artifact_${Date.now()}`,
        html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Generated Design</title></head><body><div class="design-artifact">Design Artifact</div></body></html>',
        skill: arguments_.skill,
        direction: arguments_.direction || 'minimal'
      };
      break;
    case 'design_preview':
      result = { artifact_id: arguments_.artifact_id, device_frame: arguments_.device_frame || 'browser', status: 'previewing' };
      break;
    case 'artifact_export':
      result = { artifact_id: arguments_.artifact_id, format: arguments_.format, download_url: `/exports/${arguments_.artifact_id}.${arguments_.format}` };
      break;
    case 'design_visual_directions':
      result = { directions: ['minimal', 'modern', 'playful', 'professional', 'elegant', 'bold', 'editorial', 'warm', 'tech', 'brutalist'] };
      break;
    case 'design_device_frames':
      result = { frames: ['desktop', 'tablet', 'mobile', 'responsive', 'iphone', 'pixel', 'ipad', 'macbook', 'browser'] };
      break;
    default:
      return { error: { code: -32601, message: `Tool '${name}' not found` } };
  }
  
  return { result: { content: [{ type: 'text', text: JSON.stringify(result) }] } };
}

function handleMCPRequest(body) {
  const { req, error: parseError } = parseMCPRequest(body);
  if (parseError) return parseError;
  
  if (req.method === 'tools/call') {
    const { name, arguments: args = {} } = req.params || {};
    const result = callTool(name, args);
    if (result.error) {
      return { jsonrpc: '2.0', id: req.id, error: result.error };
    }
    return { jsonrpc: '2.0', id: req.id, ...result };
  }
  
  if (req.method === 'tools/list') {
    return { result: { tools: mcpTools } };
  }
  
  return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `Method '${req.method}' not found` } };
}

describe('MCP JSON-RPC 2.0 Protocol', () => {
  it('parses valid JSON-RPC 2.0 request', () => {
    const body = '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"design_visual_directions","arguments":{}}}';
    const { req, error } = parseMCPRequest(body);
    expect(error).toBeNull();
    expect(req.jsonrpc).toBe('2.0');
    expect(req.id).toBe(1);
    expect(req.method).toBe('tools/call');
  });

  it('rejects invalid jsonrpc version', () => {
    const body = '{"jsonrpc":"1.0","id":1,"method":"tools/list"}';
    const { error } = parseMCPRequest(body);
    expect(error).not.toBeNull();
    expect(error.code).toBe(-32600);
  });

  it('rejects malformed JSON', () => {
    const body = 'not valid json';
    const { error } = parseMCPRequest(body);
    expect(error).not.toBeNull();
    expect(error.code).toBe(-32700);
  });

  it('handles missing method in handleMCPRequest', () => {
    const body = { jsonrpc: '2.0', id: 1 }; // no method
    const result = handleMCPRequest(body);
    // Missing method is handled by handleMCPRequest, returns method not found
    expect(result.error).toBeDefined();
    expect(result.error.code).toBe(-32601);
    expect(result.error.message).toContain('not found');
  });
});

describe('MCP Tool Registry', () => {
  it('has 5 tools defined', () => {
    expect(mcpTools).toHaveLength(5);
  });

  it('has all required tool names', () => {
    const names = mcpTools.map(t => t.name);
    expect(names).toContain('skill_generate');
    expect(names).toContain('design_preview');
    expect(names).toContain('artifact_export');
    expect(names).toContain('design_visual_directions');
    expect(names).toContain('design_device_frames');
  });

  it('skill_generate has required parameters', () => {
    const tool = mcpTools.find(t => t.name === 'skill_generate');
    expect(tool.inputSchema.required).toContain('skill');
    expect(tool.inputSchema.required).toContain('brief');
    expect(tool.inputSchema.properties.skill.enum).toEqual(['web-prototype', 'dashboard', 'mobile-app']);
  });
});

describe('MCP Tool Calls', () => {
  it('returns directions list', () => {
    const result = callTool('design_visual_directions', {});
    expect(result.error).toBeUndefined();
    expect(result.result).toBeDefined();
    const content = JSON.parse(result.result.content[0].text);
    expect(content.directions).toContain('minimal');
    expect(content.directions).toContain('modern');
  });

  it('returns device frames list', () => {
    const result = callTool('design_device_frames', {});
    expect(result.error).toBeUndefined();
    const content = JSON.parse(result.result.content[0].text);
    expect(content.frames).toContain('desktop');
    expect(content.frames).toContain('mobile');
  });

  it('generates artifact with skill_generate', () => {
    const result = callTool('skill_generate', { skill: 'web-prototype', brief: 'login page', direction: 'minimal' });
    expect(result.error).toBeUndefined();
    const content = JSON.parse(result.result.content[0].text);
    expect(content.artifact_id).toBeDefined();
    expect(content.html).toContain('<!DOCTYPE html>');
    expect(content.skill).toBe('web-prototype');
  });

  it('returns error for unknown tool', () => {
    const result = callTool('nonexistent_tool', {});
    expect(result.error).not.toBeNull();
    expect(result.error.code).toBe(-32601);
    expect(result.error.message).toContain('not found');
  });

  it('returns error for missing required parameter', () => {
    const result = callTool('skill_generate', { skill: 'web-prototype' }); // missing brief
    expect(result.error).not.toBeNull();
    expect(result.error.code).toBe(-32602);
    expect(result.error.message).toContain('brief');
  });

  it('exports artifact as HTML', () => {
    const result = callTool('artifact_export', { artifact_id: 'test-artifact-123', format: 'html' });
    expect(result.error).toBeUndefined();
    const content = JSON.parse(result.result.content[0].text);
    expect(content.artifact_id).toBe('test-artifact-123');
    expect(content.format).toBe('html');
    expect(content.download_url).toContain('.html');
  });

  it('exports artifact as ZIP', () => {
    const result = callTool('artifact_export', { artifact_id: 'test-artifact-456', format: 'zip' });
    expect(result.error).toBeUndefined();
    const content = JSON.parse(result.result.content[0].text);
    expect(content.format).toBe('zip');
    expect(content.download_url).toContain('.zip');
  });
});

describe('MCP Full Request/Response Cycle', () => {
  it('handles tools/list request', () => {
    const body = { jsonrpc: '2.0', id: 5, method: 'tools/list', params: {} };
    const result = handleMCPRequest(body);
    expect(result.result.tools).toHaveLength(5);
  });

  it('handles tools/call with skill_generate', () => {
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'skill_generate', arguments: { skill: 'dashboard', brief: 'sales dashboard', direction: 'modern' } }
    };
    const result = handleMCPRequest(body);
    expect(result.jsonrpc).toBe('2.0');
    expect(result.id).toBe(1);
    expect(result.result).toBeDefined();
    expect(result.result.content[0].type).toBe('text');
  });

  it('returns error response with matching id for unknown tool', () => {
    const body = {
      jsonrpc: '2.0',
      id: 99,
      method: 'tools/call',
      params: { name: 'fake_tool', arguments: {} }
    };
    const result = handleMCPRequest(body);
    // Error responses should have jsonrpc + id + error
    expect(result.jsonrpc).toBe('2.0');
    expect(result.id).toBe(99);
    expect(result.error).toBeDefined();
    expect(result.error.code).toBe(-32601);
  });

  it('handles dashboard skill', () => {
    const result = callTool('skill_generate', { skill: 'dashboard', brief: 'analytics dashboard' });
    expect(result.error).toBeUndefined();
    const content = JSON.parse(result.result.content[0].text);
    expect(content.skill).toBe('dashboard');
  });

  it('handles mobile-app skill', () => {
    const result = callTool('skill_generate', { skill: 'mobile-app', brief: 'onboarding flow' });
    expect(result.error).toBeUndefined();
    const content = JSON.parse(result.result.content[0].text);
    expect(content.skill).toBe('mobile-app');
  });
});