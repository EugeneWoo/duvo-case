# Duvo Agent

Agentic AI chat interface with web search, real-time observability, and multi-format export.

## Features

### Chat & Search
- **Web Search Integration**: Agentic chat with real-time web search tool for current information and news
- **Intelligent Agent**: Claude-powered agent with retry logic (3 attempts) and model fallback (Sonnet → Haiku)
- **CSV Function Calling**: Generate and export structured CSV data directly from chat

### Data Export & Caching
- **Multi-Format Export**: Download conversations as Markdown, PDF, or CSV
- **Google Drive Integration**: Export Markdown files directly to Google Drive via OAuth (see [Google Drive Setup](#google-drive-self-service-oauth))
- **Session Cache**: Messages cached in browser sessionStorage during active session
  - Auto-clears after 1 hour (page auto-reloads)
  - Persists across manual page refreshes within 1 hour
  - Prevents stale chat data beyond session timeout
- **Format Options**:
  - **Markdown (.md)**: Full conversation transcript for documentation
  - **PDF (.pdf)**: Formatted export for sharing and archiving
  - **CSV (.csv)**: Structured data export from function calls

### Observability & Reliability
- **Step-by-Step Traces**: View `/traces` HTML dashboard for complete execution visibility
  - API calls, tool decisions, tool execution, results
  - Status tracking (running, completed, failed)
  - Timestamps and model usage metrics
- **LLM-as-Judge**: Built-in evaluation of task execution and response relevance
  - **Task Completion**: Did agent successfully respond? (Y = responded, N = error)
  - **Relevance**: Does response address user's request? (Y = on-topic, N = off-topic)
  - Catches irrelevant responses even when agent executes successfully

## Setup

### Backend

```bash
cd backend
npm install
```

Create `.env`:
```
ANTHROPIC_API_KEY=sk-...
TAVILY_API_KEY=...
```

Run:
```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` (or next available port)

**Note**: App works immediately after setup. Google Drive export is optional — skip the Google Drive setup if you don't need it. All other features (chat, web search, .md/.pdf/.csv export, traces) work out-of-the-box.

## Google Drive Self-Service OAuth

**No tokens. No Google Cloud Console. One-click login.**

### How It Works
1. User clicks "Google Drive" in download dropdown
2. OAuth popup opens → user logs in with Google account
3. Token stored securely in browser → file uploads automatically
4. Token auto-refreshes on expiry

### User Setup (2 minutes)
1. Get Google Client ID from [Google Cloud Console](https://console.cloud.google.com/):
   - Create project
   - Enable Google Drive API
   - Create OAuth credentials (Web app)
   - Add redirect URIs: `http://localhost:5173/oauth-callback` and `http://localhost:5174/oauth-callback`

2. Create `frontend/.env.local`:
   ```
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   ```

3. Restart frontend dev server

See [docs/GOOGLE_DRIVE_SETUP.md](./docs/GOOGLE_DRIVE_SETUP.md) for detailed instructions.

## Usage

### Chat
- Type message → agent searches web in real-time → get current information
- Use natural language for complex queries

### Export
1. Click "Download" button
2. Choose format:
   - **Markdown**: Full transcript with formatting
   - **CSV**: Structured data from function calls
   - **PDF**: Formatted document
   - **Google Drive**: Direct upload to your Drive (after OAuth setup)

### Observability
- Navigate to `http://localhost:3000/traces` to view:
  - Real-time execution traces
  - Step-by-step agent decisions
  - Tool calls and results
  - Performance metrics
  - Auto-refresh enabled by default

## Architecture

- **Frontend**: React + Tailwind + Vite + React Router
- **Backend**: Express + Anthropic SDK + Tavily (web search)
- **Tools**: Web search, CSV generation, Google Drive API
- **Observability**: In-memory trace store with HTML dashboard

## Tech Stack

- **AI**: Claude Sonnet (fallback to Haiku)
  - Sonnet: optimal latency/quality/cost ratio for agent workloads
  - Opus excluded: 3–4× cost with marginal quality improvement; higher token latency unsuitable for real-time chat
- **Search**: Tavily API
- **Cloud Storage**: Google Drive (optional, OAuth)
- **Frontend**: React 18, Tailwind CSS
- **Styling**: Brutalist minimalism with warm amber accents
