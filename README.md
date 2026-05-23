# ai-design

Open-source AI Design System - Alternative to Anthropic Claude Design

## Features

- 🎨 **Skills System**: Web prototype, Dashboard, Mobile app design skills
- 📱 **Device Preview**: iPhone, Pixel, iPad, MacBook, Browser frames
- 🤖 **Agent Integration**: Support for Claude Code, Codex, OpenCode, and more
- 💾 **SQLite Persistence**: Projects, conversations, messages stored locally
- 🔒 **BYOK Proxy**: Use your own API keys with SSRF protection
- 📦 **Export**: HTML, ZIP, copy code to clipboard

## Quick Start

```bash
# Clone the repository
git clone https://github.com/YeLuo45/ai-design.git
cd ai-design

# Install dependencies
pnpm install

# Start development
pnpm dev

# Start daemon (separate terminal)
pnpm tools-dev

# Build for production
pnpm build
```

## Architecture

```
ai-design/
├── apps/
│   ├── daemon/       # Node.js HTTP server
│   │   └── src/
│   │       └── index.mjs  # Daemon entry
│   └── web/          # React frontend
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           └── ErrorBoundary.tsx
├── skills/
│   ├── web-prototype/
│   ├── dashboard/
│   └── mobile-app/
└── dist/web/         # Build output
```

## Daemon API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check + agent detection |
| `/api/projects` | GET/POST | Project CRUD |
| `/api/agents` | GET | List detected agents |
| `/api/agents/spawn` | POST | Start agent process |
| `/api/agents/stop` | POST | Stop agent process |
| `/api/proxy/:provider/stream` | POST | AI proxy with SSRF protection |
| `/api/sse` | GET | SSE event stream |

## Environment

```bash
PORT=3001  # Daemon port
```

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS v4
- **Daemon**: Node.js + better-sqlite3
- **Package Manager**: pnpm

## License

MIT