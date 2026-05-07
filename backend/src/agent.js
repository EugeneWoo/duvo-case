import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const COMPLETION_PATTERN = /COMPLETION:\s*([YN])/i;
const RELEVANCE_PATTERN = /RELEVANCE:\s*([YN])/i;

// In-memory trace storage
export const traceStore = {
  traces: [],
  currentTrace: null,

  startTrace(userMessage) {
    this.currentTrace = {
      id: Date.now(),
      userMessage,
      startTime: new Date().toISOString(),
      steps: [],
      status: "running",
      finalResult: null,
    };
    this.traces.unshift(this.currentTrace);
    return this.currentTrace.id;
  },

  addStep(traceId, step) {
    const trace = this.traces.find((t) => t.id === traceId);
    if (trace) {
      trace.steps.push({
        ...step,
        timestamp: new Date().toISOString(),
      });
    }
  },

  completeTrace(traceId, result) {
    const trace = this.traces.find((t) => t.id === traceId);
    if (trace) {
      trace.status = "completed";
      trace.finalResult = result;
      trace.endTime = new Date().toISOString();
    }
  },

  failTrace(traceId, error) {
    const trace = this.traces.find((t) => t.id === traceId);
    if (trace) {
      trace.status = "failed";
      trace.error = error;
      trace.endTime = new Date().toISOString();
    }
  },

  getTraces() {
    return this.traces.slice(0, 50);
  },

  getTrace(id) {
    return this.traces.find((t) => t.id === id);
  },

  async evaluateTrace(id) {
    const trace = this.getTrace(id);
    if (!trace) throw new Error("Trace not found");

    if (trace.evaluation) {
      return trace.evaluation;
    }

    const stepsSummary = trace.steps
      .map((s, i) => {
        let desc = `Step ${i + 1}: ${s.type} (${s.status})`;
        if (s.toolName) desc += ` - Tool: ${s.toolName}`;
        if (s.resultSnippet) desc += ` - Result: ${s.resultSnippet}`;
        return desc;
      })
      .join("\n");

    const prompt = `You are an expert evaluator of AI agent task execution. Evaluate this agent execution trace:

USER REQUEST: "${trace.userMessage}"

AGENT STEPS:
${stepsSummary}

FINAL RESULT:
${trace.finalResult || "(No result)"}

Evaluate on two criteria:

1. TASK COMPLETION: Did the agent successfully execute and return a response? (Y/N)
2. RELEVANCE: Is the result relevant and directly addresses the user's request? (Y/N)

Note: Task completion = agent responded successfully (usually Y). Relevance = response is on-topic (may be N even if completion is Y).

Respond with ONLY this format, no other text:
COMPLETION: Y
RELEVANCE: Y`;

    try {
      const evaluation = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const responseText = evaluation.content[0]?.text || "";
      const completionMatch = responseText.match(COMPLETION_PATTERN);
      const relevanceMatch = responseText.match(RELEVANCE_PATTERN);

      trace.evaluation = {
        completionSuccess: completionMatch ? completionMatch[1].toUpperCase() === "Y" : null,
        relevance: relevanceMatch ? relevanceMatch[1].toUpperCase() === "Y" : null,
        evaluatedAt: new Date().toISOString(),
        rawResponse: responseText,
      };

      return trace.evaluation;
    } catch (error) {
      trace.evaluation = {
        completionSuccess: null,
        relevance: null,
        evaluatedAt: new Date().toISOString(),
        error: error.message,
      };
      return trace.evaluation;
    }
  },
};

const tools = [
  {
    name: "search_news",
    description: "Search for current news and articles. Returns data in CSV format (Title, Summary, Source) that can be displayed or exported.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "News search query to find current articles and information",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "web_search",
    description: "Search the web for information, facts, and data",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to find information about",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "weather",
    description: "Get current weather for a location",
    input_schema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City name or coordinates",
        },
      },
      required: ["location"],
    },
  },
  {
    name: "calculator",
    description: "Perform basic arithmetic calculations",
    input_schema: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["add", "subtract", "multiply", "divide"],
          description: "Mathematical operation",
        },
        a: {
          type: "number",
          description: "First number",
        },
        b: {
          type: "number",
          description: "Second number",
        },
      },
      required: ["operation", "a", "b"],
    },
  },
];

async function executeWebSearch(query) {
  const escapeField = (field) => {
    if (!field) return '';
    const str = String(field).trim();
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        max_results: 5,
        include_answer: true,
      })
    });

    if (!response.ok) {
      return `Search error: Unable to fetch results for "${query}"`;
    }

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) {
      return `No search results found for "${query}"`;
    }

    const top5 = results.slice(0, 5);
    const csv = ['Title,Summary,Source'];
    csv.push(...top5.map((r) =>
      `${escapeField(r.title)},${escapeField(r.content)},Web Search`
    ));

    return csv.join('\n');
  } catch (error) {
    return `Search failed: ${error.message}`;
  }
}

async function executeSearchNews(query) {
  // search_news tool - always returns CSV format
  return executeWebSearch(query);
}

function executeWeather(location) {
  const weatherData = {
    "new york": { temp: 72, condition: "partly cloudy" },
    "san francisco": { temp: 65, condition: "foggy" },
    london: { temp: 55, condition: "rainy" },
  };
  const result = weatherData[location.toLowerCase()] || {
    temp: 70,
    condition: "unknown",
  };
  return `Weather in ${location}: ${result.temp}°F, ${result.condition}`;
}

function executeCalculator(operation, a, b) {
  const operations = {
    add: a + b,
    subtract: a - b,
    multiply: a * b,
    divide: b !== 0 ? a / b : "Error: Division by zero",
  };
  return `${a} ${operation} ${b} = ${operations[operation]}`;
}

async function runAgentCore(userMessage, model, traceId = null) {
  const messages = [{ role: "user", content: userMessage }];
  let stepNum = 0;

  const systemPrompt = `You are an AI assistant that MUST use the search_news tool for ANY query about current events, news, latest information, or anything from 2025 onwards.

RULES:
1. If the user asks about news, latest events, recent articles, or current information - IMMEDIATELY use the search_news tool
2. Do NOT provide information from your training data for these queries
3. The search_news tool returns CSV data (Title, Summary, Source) - always use this format
4. Never skip the search_news tool when asked about current/latest information
5. Your response should be based on search_news tool results, not your training data

Examples of queries that REQUIRE search_news:
- "latest news"
- "recent updates"
- "what's new in AI"
- "current events"
- "fetch latest articles"
- Any query about 2025 or current year

Always prioritize the search_news tool for these requests.`;


  while (true) {
    stepNum++;
    const stepId = `step_${stepNum}`;

    if (traceId) {
      traceStore.addStep(traceId, {
        stepNumber: stepNum,
        status: "thinking",
        type: "api_call",
        model,
        messageCount: messages.length,
      });
    }

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      tools: tools,
      messages: messages,
    });

    let textContent = "";
    for (const block of response.content) {
      if (block.type === "text") {
        textContent += block.text;
      }
    }

    if (response.stop_reason === "tool_use") {
      if (traceId) {
        traceStore.addStep(traceId, {
          stepNumber: stepNum,
          status: "tool_use",
          type: "tool_decision",
          toolsToCall: response.content
            .filter((b) => b.type === "tool_use")
            .map((b) => ({ name: b.name, id: b.id })),
        });
      }

      const toolResults = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          const toolName = block.name;
          const toolInput = block.input;
          const toolId = block.id;

          if (traceId) {
            traceStore.addStep(traceId, {
              stepNumber: stepNum,
              status: "executing",
              type: "tool_execution",
              toolName,
              toolInput,
              toolId,
            });
          }

          let result;
          try {
            if (toolName === "search_news") {
              result = await executeSearchNews(toolInput.query);
            } else if (toolName === "web_search") {
              result = await executeWebSearch(toolInput.query);
            } else if (toolName === "weather") {
              result = executeWeather(toolInput.location);
            } else if (toolName === "calculator") {
              result = executeCalculator(
                toolInput.operation,
                toolInput.a,
                toolInput.b
              );
            }
          } catch (error) {
            result = `Error: ${error.message}`;
          }

          if (traceId) {
            const resultSnippet =
              typeof result === "string"
                ? result.substring(0, 200)
                : JSON.stringify(result).substring(0, 200);
            traceStore.addStep(traceId, {
              stepNumber: stepNum,
              status: "completed",
              type: "tool_result",
              toolName,
              toolId,
              resultSnippet,
            });
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolId,
            content: result,
          });
        }
      }

      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });
    } else {
      if (traceId) {
        traceStore.addStep(traceId, {
          stepNumber: stepNum,
          status: "final",
          type: "completion",
          resultSnippet: textContent.substring(0, 300),
        });
      }
      return textContent;
    }
  }
}

function isNewsQuery(message) {
  const newsKeywords = [
    'news', 'latest', 'recent', 'current', 'fetch', 'search',
    'articles', 'stories', 'updates', 'events', 'happening',
    'today', 'this week', 'breaking', 'trending', 'what\'s new'
  ];
  const messageLower = message.toLowerCase();
  return newsKeywords.some(keyword => messageLower.includes(keyword));
}

export async function runAgentWithRetry(userMessage, maxRetries = 3, traceId = null) {
  const models = [
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
  ];

  for (let modelIdx = 0; modelIdx < models.length; modelIdx++) {
    const model = models[modelIdx];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        let result = await runAgentCore(userMessage, model, traceId);

        // Check if this was a news query but the model didn't return CSV
        if (isNewsQuery(userMessage) && !result.includes('Title,Summary,Source')) {
          console.log("News query detected but no CSV returned. Forcing search_news...");
          result = await executeSearchNews(userMessage);
        }

        if (traceId) {
          traceStore.completeTrace(traceId, result);
        }
        return result;
      } catch (error) {
        console.error(
          `Attempt ${attempt + 1}/${maxRetries} failed for ${model}:`,
          error.message
        );

        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    console.error(`Model ${model} exhausted retries, trying fallback...`);
  }

  if (traceId) {
    traceStore.failTrace(traceId, "All retry attempts and model fallbacks exhausted");
  }
  throw new Error("All retry attempts and model fallbacks exhausted");
}

export async function runAgent(userMessage) {
  console.log(`\nUser: ${userMessage}\n`);
  const result = await runAgentWithRetry(userMessage);
  console.log(`Agent: ${result}`);
}
