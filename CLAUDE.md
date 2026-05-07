# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Do not narrate intermediate steps. Execute directly and report only what changed. Create frontend in Tailwind/React.

## Project State

Functional agentic webapp. Core features complete: chat with web search, multi-format export (.md/.pdf/.csv), Google Drive integration, and observability dashboard.

## Current Implementation

### Backend
- Express server on port 3000
- Anthropic SDK for Claude (retry logic + model fallback: Opus → Sonnet → Haiku)
- Web search via Tavily API
- Google Drive API integration (OAuth token-based upload)
- In-memory trace store for observability
- Trace dashboard at `/traces` (HTML)

### Frontend
- React + Tailwind + Vite on port 5173
- Chat interface with loading states
- Download button: Markdown, PDF, CSV, Google Drive exports
- OAuth callback handler for Google Drive login
- localStorage token management for Google Drive

## Known Infrastructure

- **AI**: Claude Sonnet via Anthropic SDK (`ANTHROPIC_API_KEY` in `backend/.env`)
- **Search**: Tavily API (`TAVILY_API_KEY` in `backend/.env`)
- **Cloud Storage**: Google Drive API (OAuth flow, no service account needed)
- **Database/Auth**: Supabase (configured but optional for MVP) — `SUPABASE_*` keys in `backend/.env`
- **Gemini**: `GEMINI_API_KEY` in `backend/.env` (not currently used)

## Agent-OS Workflow

This repo uses Agent-OS for spec-driven development. Key slash commands:

| Command | Purpose |
|---|---|
| `/agent-os:plan-product` | Define product mission + roadmap |
| `/agent-os:shape-spec` | Gather requirements for a feature |
| `/agent-os:write-spec` | Write detailed spec document |
| `/agent-os:create-tasks` | Break spec into task list |
| `/agent-os:implement-tasks` | Execute tasks via sub-agents |

Specs live under `.claude/specs/` (created when you run the workflow). Always write a spec before implementing non-trivial features.

## Key Features

- **Chat + Web Search**: Real-time search integration for current information
- **CSV Function Calling**: Generate structured data directly from responses
- **Multi-Format Export**: Download as .md (Markdown), .pdf (PDF), .csv (CSV)
- **Google Drive Export**: OAuth-based upload to Google Drive (no tokens, one-click login)
- **Observability**: Step-by-step execution traces at `/traces` with tool calls, decisions, results
- **LLM-as-Judge**: Built-in evaluation of relevance and task completion

## Development Notes

**Google Drive Setup**: User must provide `VITE_GOOGLE_CLIENT_ID` in `frontend/.env.local`. See `GOOGLE_DRIVE_SETUP.md` for instructions. OAuth flow is implicit (token in URL fragment), auto-refresh on expiry.

**Export Functions**: Located in `frontend/src/utils/formatters.js`. Add new formats there.

**Backend Routes**:
- `POST /api/chat` — Chat with agent (web search included)
- `POST /api/upload-to-drive` — Google Drive upload (requires valid access token)
- `GET /api/traces` — Trace history JSON
- `GET /traces` — Trace HTML dashboard

**Formatting Tools**: CSV export uses `formatChatAsCsv()` from function call results. Markdown preserves full conversation. PDF uses jsPDF library.

**Token Storage**: Google Drive OAuth tokens managed via `frontend/src/utils/tokenStorage.js`. Centralized module handles all localStorage operations (get/set/clear token and expiry). Used by OAuthCallback and driveUploader.

**Evaluation Patterns**: Trace evaluation (backend/src/agent.js) uses regex constants `COMPLETION_PATTERN` and `RELEVANCE_PATTERN` at module level for parsing LLM judge responses.

## Standards

Standards live in `agent-os/standards/` and are available as Claude Code skills. Key rules already established:

- **API**: RESTful, plural-noun resources, URL versioning, max 2–3 nesting levels
- **Models**: Timestamps on all tables, DB-level constraints, index FK columns
- **Code style**: No dead code, no backward-compat shims unless required, small focused functions
- **Validation**: Validate at system boundaries (user input, external APIs); trust internal guarantees

When working on backend API files, frontend components, CSS, tests, or migrations — invoke the matching skill (e.g., `backend-api`, `frontend-components`, `testing-test-writing`) to get domain-specific guidance before writing code.
