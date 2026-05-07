# Agent Execution Traces

Real-time visualization of agent backend step-by-step execution logs.

## Access

Open browser to `http://localhost:3000/traces.html` when backend is running.

## Features

- **Live trace list**: All agent executions with user messages, status, step count, timestamps
- **Expandable details**: Click any trace card to expand/collapse step-by-step breakdown
- **Step information**:
  - Step type: `api_call`, `tool_decision`, `tool_execution`, `tool_result`, `completion`
  - Status: `thinking`, `tool_use`, `executing`, `completed`, `final`
  - Model used
  - Tool calls with input parameters
  - Result snippets (first 200 chars)
  - Message count in context
- **LLM Judge Evaluation** (Claude Sonnet):
  - **Task Completion Y/N**: Did agent successfully execute and return a response? (Y = responded, N = error/timeout)
  - **Relevance Y/N**: Is the result relevant and directly addresses the user's request? (Y = on-topic, N = off-topic)
  - Completion usually Y (agent responded). Relevance may be N even when completion is Y (irrelevant but successful response).
  - Click "Evaluate" button on any trace to run judge
  - Results cached per trace (click "Re-evaluate" to refresh)
- **Auto-refresh**: Toggle checkbox to auto-refresh every 2 seconds (default: on)
- **Manual refresh**: Click "Refresh Traces" button
- **Clean history**: Click "Clear All" to remove trace from memory

## API Endpoints

### GET `/api/traces`
Returns last 50 traces with all step details.

```bash
curl http://localhost:3000/api/traces
```

Response:
```json
{
  "traces": [
    {
      "id": 1234567890,
      "userMessage": "What is 5 + 3?",
      "startTime": "2026-05-07T14:42:03.473Z",
      "status": "completed",
      "steps": [
        {
          "stepNumber": 1,
          "status": "thinking",
          "type": "api_call",
          "model": "claude-sonnet-4-6",
          "messageCount": 1,
          "timestamp": "2026-05-07T14:42:03.473Z"
        },
        ...
      ],
      "finalResult": "The result of 5 + 3 = 8...",
      "endTime": "2026-05-07T14:42:06.782Z"
    }
  ]
}
```

### GET `/api/traces/:id`
Returns single trace by ID.

```bash
curl http://localhost:3000/api/traces/1234567890
```

### POST `/api/traces/:id/evaluate`
Evaluates trace using Claude Sonnet as judge. Returns completion success (Y/N) and relevance (Y/N).

```bash
curl -X POST http://localhost:3000/api/traces/1234567890/evaluate
```

Response:
```json
{
  "evaluation": {
    "completionSuccess": true,
    "relevance": true,
    "evaluatedAt": "2026-05-07T15:04:31.059Z",
    "rawResponse": "COMPLETION: Y\nRELEVANCE: Y"
  }
}
```

Results are cached on the trace object. Re-call to get updated evaluation.

## Trace Structure

Each trace capture includes:

- **Trace metadata**: user message, start/end times, final status
- **Steps**: ordered execution steps with:
  - Step number and type
  - Current status
  - Relevant data (model, tool name, input, result snippet)
  - Timestamp
- **Evaluation** (optional): LLM judge results
  - `completionSuccess`: true/false/null
  - `relevance`: true/false/null
  - `evaluatedAt`: ISO timestamp when evaluated
  - `rawResponse`: Full response from judge

Example trace with tool use:

```
#1: api_call [THINKING] → Model Claude Sonnet, 1 message in context
#2: tool_decision [TOOL_USE] → Call 'calculator' tool
#3: tool_execution [EXECUTING] → Calculate: add(5, 3)
#4: tool_result [COMPLETED] → Result: "5 add 3 = 8"
#5: api_call [THINKING] → Model Claude Sonnet, 3 messages in context
#6: completion [FINAL] → Output: "The result of 5 + 3 = 8..."
```

## Implementation Details

- Traces stored in-memory (cleared on server restart)
- Trace IDs are Unix timestamps (milliseconds)
- Each step tagged with precise ISO timestamp
- Result snippets limited to 200 chars for UI readability
- Auto-refresh polls `/api/traces` every 2 seconds
