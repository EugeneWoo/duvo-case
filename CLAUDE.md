# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Do not narrate intermediate steps. Execute directly and report only what changed. Create frontend in Tailwind/React.

## Project State

Early-stage scaffold. `backend/` and `frontend/` directories exist but contain no application code yet. Tech stack choices (framework, language, package manager) are not finalized — check `agent-os/standards/global/tech-stack.md` for updates before assuming anything.

## Known Infrastructure

- **Database/Auth**: Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`)
- **AI**: Gemini API (`GEMINI_API_KEY` in `backend/.env`)

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

## Standards

Standards live in `agent-os/standards/` and are available as Claude Code skills. Key rules already established:

- **API**: RESTful, plural-noun resources, URL versioning, max 2–3 nesting levels
- **Models**: Timestamps on all tables, DB-level constraints, index FK columns
- **Code style**: No dead code, no backward-compat shims unless required, small focused functions
- **Validation**: Validate at system boundaries (user input, external APIs); trust internal guarantees

When working on backend API files, frontend components, CSS, tests, or migrations — invoke the matching skill (e.g., `backend-api`, `frontend-components`, `testing-test-writing`) to get domain-specific guidance before writing code.
