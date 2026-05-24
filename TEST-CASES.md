# MCP Tool Bridge Test Cases

## Overview
These test cases verify the MCP (Model Context Protocol) Tool Bridge implementation for the ai-design daemon.

## Test Environment
- Daemon runs on port 3001
- Base URL: `http://localhost:3001`
- No authentication required for test environment

---

## Test Case 1: GET /mcp/tools returns tool list

**Purpose:** Verify that the `/mcp/tools` endpoint returns a valid list of available MCP tools.

**Request:**
```
GET /mcp/tools
Content-Type: application/json
```

**Expected Response (200 OK):**
```json
{
  "tools": [
    {
      "name": "skill_generate",
      "description": "Generate a design artifact using a skill (web-prototype, dashboard, mobile-app)",
      "inputSchema": {
        "type": "object",
        "properties": {
          "skill": { "type": "string", "enum": ["web-prototype", "dashboard", "mobile-app"], "description": "Skill to use" },
          "direction": { "type": "string", "description": "Visual direction (e.g., minimal, modern, playful)" },
          "device_frame": { "type": "string", "description": "Device frame for preview" },
          "brief": { "type": "string", "description": "Design brief or description" }
        },
        "required": ["skill", "brief"]
      }
    },
    {
      "name": "design_preview",
      "description": "Preview an artifact in a device frame",
      "inputSchema": {
        "type": "object",
        "properties": {
          "artifact_id": { "type": "string", "description": "Artifact ID to preview" },
          "device_frame": { "type": "string", "description": "Device frame type" }
        },
        "required": ["artifact_id"]
      }
    },
    {
      "name": "artifact_export",
      "description": "Export artifact as HTML or ZIP",
      "inputSchema": {
        "type": "object",
        "properties": {
          "artifact_id": { "type": "string", "description": "Artifact ID to export" },
          "format": { "type": "string", "enum": ["html", "zip"], "description": "Export format" }
        },
        "required": ["artifact_id", "format"]
      }
    },
    {
      "name": "design_visual_directions",
      "description": "List available visual directions for design",
      "inputSchema": { "type": "object", "properties": {} }
    },
    {
      "name": "design_device_frames",
      "description": "List available device frames for preview",
      "inputSchema": { "type": "object", "properties": {} }
    }
  ]
}
```

**Pass Criteria:**
- HTTP 200 status
- Response contains `tools` array
- All 5 tools are present with correct names
- Each tool has `name`, `description`, and `inputSchema`

---

## Test Case 2: POST /mcp with skill_generate call

**Purpose:** Verify that POST /mcp with a JSON-RPC 2.0 `skill_generate` tool call returns a valid artifact.

**Request:**
```
POST /mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "skill_generate",
    "arguments": {
      "skill": "web-prototype",
      "direction": "minimal",
      "brief": "login page"
    }
  }
}
```

**Expected Response (200 OK):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"artifact_id\":\"artifact_[TIMESTAMP]\",\"html\":\"<!DOCTYPE html>...\",\"skill\":\"web-prototype\",\"direction\":\"minimal\"}"
      }
    ]
  }
}
```

**Pass Criteria:**
- HTTP 200 status
- Valid JSON-RPC 2.0 response format
- `id` matches request `id` (1)
- `result.content[0].type` === "text"
- `result.content[0].text` contains artifact_id and html

---

## Test Case 3: MCP tools return valid JSON-RPC 2.0 responses

**Purpose:** Verify all MCP tool responses conform to JSON-RPC 2.0 specification.

**Requests to test:**

1. **design_visual_directions:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "design_visual_directions",
    "arguments": {}
  }
}
```
Expected: `{"jsonrpc": "2.0", "id": 2, "result": {"content": [{"type": "text", "text": "{\"directions\":[\"minimal\",\"modern\",\"playful\",\"professional\",\"elegant\",\"bold\"]}"}]}}`

2. **design_device_frames:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "design_device_frames",
    "arguments": {}
  }
}
```
Expected: `{"jsonrpc": "2.0", "id": 3, "result": {"content": [{"type": "text", "text": "{\"frames\":[\"desktop\",\"tablet\",\"mobile\",\"responsive\"]}"}]}}`

3. **Unknown tool (error handling):**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "nonexistent_tool",
    "arguments": {}
  }
}
```
Expected: `{"jsonrpc": "2.0", "id": 4, "error": {"code": -32601, "message": "Tool 'nonexistent_tool' not found"}}`

**Pass Criteria:**
- All responses have `jsonrpc: "2.0"` version string
- All responses include matching `id` from request
- Success responses have `result` object with `content` array
- Error responses have `error` object with `code` and `message`
- Invalid JSON-RPC version returns parse error

---

## Test Case 4: SSRF protection still works for /api/proxy routes

**Purpose:** Verify that the SSRF protection blocking internal IPs is preserved after MCP changes.

**Test Requests:**

1. **Blocked IP test (10.x.x.x):**
```
POST /api/proxy/openai.stream
Host: 10.0.0.1
```
Expected: HTTP 403 with `{"error": "Access to internal IP denied"}`

2. **Blocked IP test (192.168.x.x):**
```
POST /api/proxy/anthropic.stream
Host: 192.168.1.1
```
Expected: HTTP 403 with `{"error": "Access to internal IP denied"}`

3. **Blocked IP test (localhost):**
```
POST /api/proxy/test.stream
Host: localhost
```
Expected: HTTP 403 with `{"error": "Access to internal IP denied"}`

4. **Blocked IP test (127.0.0.1):**
```
POST /api/proxy/test.stream
Host: 127.0.0.1
```
Expected: HTTP 403 with `{"error": "Access to internal IP denied"}`

**Pass Criteria:**
- All internal IP attempts return HTTP 403
- Response body contains "Access to internal IP denied" error
- SSRF check happens before any proxy request is made

---

## Test Case 5: Existing daemon routes still work

**Purpose:** Verify that all pre-existing routes function correctly after MCP additions.

**Test Requests:**

1. **GET /health:**
```
GET /health
```
Expected: HTTP 200, `{"status": "running", "agents": [...], "activeAgents": 0}`

2. **GET /api/projects:**
```
GET /api/projects
```
Expected: HTTP 200, returns projects array (may be empty `[]`)

3. **POST /api/projects:**
```
POST /api/projects
Content-Type: application/json

{"name": "Test Project", "path": "/tmp/test"}
```
Expected: HTTP 201, `{"id": 1, "name": "Test Project"}`

4. **GET /api/agents:**
```
GET /api/agents
```
Expected: HTTP 200, `{"detected": [...], "active": [...]}`

5. **GET /api/sse:**
```
GET /api/sse
```
Expected: HTTP 200, Content-Type: `text/event-stream`, initial data contains `{"type": "connected"...}`

**Pass Criteria:**
- All routes return expected HTTP status codes
- All routes return valid JSON where applicable
- Response bodies match expected format
- No route conflicts with MCP endpoints

---

## Running the Tests

```bash
# Start the daemon
cd /home/hermes/projects/ai-design
node apps/daemon/src/index.mjs &

# Run tests with curl
# Test 1
curl http://localhost:3001/mcp/tools

# Test 2
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"skill_generate","arguments":{"skill":"web-prototype","direction":"minimal","brief":"login page"}}}'

# Test 4 (SSRF)
curl -X POST http://localhost:3001/api/proxy/test.stream \
  -H "Host: 192.168.1.1"

# Test 5 (health)
curl http://localhost:3001/health
```