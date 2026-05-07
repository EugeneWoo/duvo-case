# Duvo Agent

Lightweight AI chat interface with retry logic and model fallback.

## Setup

### Backend

```bash
cd backend
npm install
```

Create `.env`:
```
ANTHROPIC_API_KEY=sk-...
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

Frontend runs on `http://localhost:5173`

## Features

- **Chat Interface**: Clean, brutalist UI with Tailwind CSS
- **Retry Logic**: 3 retries per model before fallback
- **Model Fallback**: Opus → Sonnet → Haiku
- **Loading State**: Animated thinking spinner with amber accent
- **Error Handling**: User-friendly error messages with retry option
- **Tool Support**: Weather and calculator tools

## Architecture

- **Frontend**: React + Tailwind with Vite
- **Backend**: Express + Anthropic SDK
- **Styling**: Brutalist minimalism with warm amber accents
