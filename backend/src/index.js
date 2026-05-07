import express from "express";
import cors from "cors";
import "dotenv/config";
import { runAgentWithRetry, traceStore } from "./agent.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  const traceId = traceStore.startTrace(message);

  try {
    const response = await runAgentWithRetry(message, 3, traceId);
    res.json({ response, traceId });
  } catch (error) {
    console.error("Chat error:", error.message);
    traceStore.failTrace(traceId, error.message);
    res.status(500).json({
      error: "Our friendly AI agent is feeling out of sorts. Please try again later.",
      traceId,
    });
  }
});

app.get("/api/traces", (req, res) => {
  const traces = traceStore.getTraces();
  res.json({ traces });
});

app.get("/api/traces/:id", (req, res) => {
  const trace = traceStore.getTrace(parseInt(req.params.id));
  if (!trace) {
    return res.status(404).json({ error: "Trace not found" });
  }
  res.json(trace);
});

app.get("/traces", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(tracesHtmlPage);
});

const tracesHtmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Traces</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 {
      font-size: 28px;
      margin-bottom: 30px;
      color: #f1f5f9;
    }
    .controls {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    button {
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    button:hover { background: #2563eb; }
    button:disabled { background: #64748b; cursor: not-allowed; }

    .traces-grid {
      display: grid;
      gap: 16px;
    }

    .trace-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .trace-card:hover { border-color: #64748b; }
    .trace-card.selected { border-color: #3b82f6; background: #1e3a4c; }

    .trace-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 12px;
    }

    .trace-title {
      font-size: 15px;
      color: #f1f5f9;
      word-break: break-word;
    }

    .trace-meta {
      display: flex;
      gap: 8px;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 8px;
    }

    .trace-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-running { background: #1e40af; color: #bfdbfe; }
    .status-completed { background: #166534; color: #bbf7d0; }
    .status-failed { background: #7f1d1d; color: #fca5a5; }

    .trace-detail {
      display: none;
      margin-left: 20px;
      border-left: 2px solid #334155;
      padding-left: 16px;
      margin-top: 16px;
    }
    .trace-detail.visible { display: block; }

    .steps-container {
      margin-top: 16px;
    }

    .step {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
      font-size: 13px;
    }

    .step-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      align-items: center;
    }

    .step-number {
      font-weight: 600;
      color: #3b82f6;
    }

    .step-status {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 500;
    }
    .step-status.thinking { background: #1e40af; color: #bfdbfe; }
    .step-status.tool_use { background: #7c2d12; color: #fed7aa; }
    .step-status.executing { background: #1e40af; color: #bfdbfe; }
    .step-status.completed { background: #166534; color: #bbf7d0; }
    .step-status.final { background: #166534; color: #bbf7d0; }

    .step-type {
      display: inline-block;
      padding: 3px 8px;
      background: #334155;
      border-radius: 3px;
      font-size: 11px;
      color: #cbd5e1;
      margin-right: 8px;
    }

    .step-details {
      margin-top: 8px;
      color: #cbd5e1;
      line-height: 1.5;
    }

    .step-detail-row {
      margin: 4px 0;
      word-break: break-word;
    }

    .detail-key {
      color: #94a3b8;
      font-weight: 500;
    }

    .detail-value {
      color: #e2e8f0;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 12px;
    }

    .final-result {
      background: #1e293b;
      border-left: 3px solid #10b981;
      padding: 12px;
      margin-top: 12px;
      border-radius: 4px;
      color: #d1fae5;
      font-size: 13px;
      word-break: break-word;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #3b82f6;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Agent Execution Traces</h1>

    <div class="controls">
      <button onclick="refreshTraces()">Refresh Traces</button>
      <button onclick="clearTraces()">Clear All</button>
      <label style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
        <input type="checkbox" id="autoRefresh" checked>
        Auto-refresh
      </label>
    </div>

    <div id="tracesContainer" class="traces-grid">
      <div class="empty-state">Loading traces...</div>
    </div>
  </div>

  <script>
    let selectedTraceId = null;
    let autoRefreshInterval = null;

    async function refreshTraces() {
      try {
        const res = await fetch('/api/traces');
        const { traces } = await res.json();
        renderTraces(traces);
      } catch (err) {
        console.error('Error fetching traces:', err);
      }
    }

    function renderTraces(traces) {
      const container = document.getElementById('tracesContainer');

      if (traces.length === 0) {
        container.innerHTML = '<div class="empty-state">No traces yet. Send a message to the agent to see traces here.</div>';
        return;
      }

      container.innerHTML = traces.map(trace => \`
        <div class="trace-card \${selectedTraceId === trace.id ? 'selected' : ''}" onclick="selectTrace(\${trace.id})">
          <div class="trace-header">
            <div>
              <div class="trace-title">\${escapeHtml(trace.userMessage.substring(0, 100))}\${trace.userMessage.length > 100 ? '...' : ''}</div>
              <div class="trace-meta">
                <span class="trace-status status-\${trace.status}">
                  \${trace.status === 'running' ? '<span class="spinner"></span> ' : ''}\${trace.status.toUpperCase()}
                </span>
                <span>\${trace.steps?.length || 0} steps</span>
                <span>\${new Date(trace.startTime).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div class="trace-detail \${selectedTraceId === trace.id ? 'visible' : ''}">
            <div class="steps-container">
              \${trace.steps.map((step, i) => renderStep(step, i)).join('')}
            </div>
            \${trace.finalResult ? \`
              <div class="final-result">
                <strong>Final Result:</strong><br>
                \${escapeHtml(trace.finalResult.substring(0, 500))}\${trace.finalResult.length > 500 ? '...' : ''}
              </div>
            \` : ''}
          </div>
        </div>
      \`).join('');
    }

    function renderStep(step, index) {
      let details = '';

      if (step.type === 'api_call') {
        details = \`
          <div class="step-detail-row">
            <span class="detail-key">Model:</span>
            <span class="detail-value">\${step.model}</span>
          </div>
          <div class="step-detail-row">
            <span class="detail-key">Messages:</span>
            <span class="detail-value">\${step.messageCount}</span>
          </div>
        \`;
      } else if (step.type === 'tool_decision') {
        details = \`
          <div class="step-detail-row">
            <span class="detail-key">Tools to Call:</span>
            <span class="detail-value">\${step.toolsToCall.map(t => t.name).join(', ')}</span>
          </div>
        \`;
      } else if (step.type === 'tool_execution') {
        details = \`
          <div class="step-detail-row">
            <span class="detail-key">Tool:</span>
            <span class="detail-value">\${step.toolName}</span>
          </div>
          <div class="step-detail-row">
            <span class="detail-key">Input:</span>
            <span class="detail-value">\${escapeHtml(JSON.stringify(step.toolInput))}</span>
          </div>
        \`;
      } else if (step.type === 'tool_result') {
        details = \`
          <div class="step-detail-row">
            <span class="detail-key">Tool:</span>
            <span class="detail-value">\${step.toolName}</span>
          </div>
          <div class="step-detail-row">
            <span class="detail-key">Result:</span>
            <span class="detail-value">\${escapeHtml(step.resultSnippet)}</span>
          </div>
        \`;
      } else if (step.type === 'completion') {
        details = \`
          <div class="step-detail-row">
            <span class="detail-key">Output:</span>
            <span class="detail-value">\${escapeHtml(step.resultSnippet)}</span>
          </div>
        \`;
      }

      return \`
        <div class="step">
          <div class="step-header">
            <span class="step-number">#\${index + 1}</span>
            <span class="step-type">\${step.type.replace(/_/g, ' ')}</span>
            <span class="step-status \${step.status}">\${step.status.toUpperCase()}</span>
          </div>
          <div class="step-details">\${details}</div>
        </div>
      \`;
    }

    function selectTrace(traceId) {
      selectedTraceId = selectedTraceId === traceId ? null : traceId;
      refreshTraces();
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function clearTraces() {
      if (confirm('Clear all traces?')) {
        localStorage.removeItem('traces');
        selectedTraceId = null;
        refreshTraces();
      }
    }

    // Set up auto-refresh
    document.getElementById('autoRefresh').addEventListener('change', (e) => {
      if (e.target.checked) {
        autoRefreshInterval = setInterval(refreshTraces, 2000);
      } else {
        clearInterval(autoRefreshInterval);
      }
    });

    // Initial load and auto-refresh
    refreshTraces();
    autoRefreshInterval = setInterval(refreshTraces, 2000);
  </script>
</body>
</html>
`;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`View traces at http://localhost:${PORT}/traces`);
});
