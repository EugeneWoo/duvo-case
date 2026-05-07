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

## Trace Structure

Each trace capture includes:

- **Trace metadata**: user message, start/end times, final status
- **Steps**: ordered execution steps with:
  - Step number and type
  - Current status
  - Relevant data (model, tool name, input, result snippet)
  - Timestamp

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
