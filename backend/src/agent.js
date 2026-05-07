import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tools = [
  {
    name: "web_search",
    description: "Search the web for current information, news, and facts",
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
    const html = top5
      .map((r) => `<h3>${r.title}</h3>\n\n<p>${r.content}</p>\n\n<p><a href="${r.url}" target="_blank" style="color: #f59e0b; text-decoration: underline;">Read more</a></p>`)
      .join('\n\n');

    return html;
  } catch (error) {
    return `Search failed: ${error.message}`;
  }
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

async function runAgentCore(userMessage, model) {
  const messages = [{ role: "user", content: userMessage }];

  while (true) {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
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
      const toolResults = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          const toolName = block.name;
          const toolInput = block.input;

          let result;
          if (toolName === "web_search") {
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

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });
    } else {
      return textContent;
    }
  }
}

export async function runAgentWithRetry(userMessage, maxRetries = 3) {
  const models = [
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
  ];

  for (let modelIdx = 0; modelIdx < models.length; modelIdx++) {
    const model = models[modelIdx];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await runAgentCore(userMessage, model);
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

  throw new Error("All retry attempts and model fallbacks exhausted");
}

export async function runAgent(userMessage) {
  console.log(`\nUser: ${userMessage}\n`);
  const result = await runAgentWithRetry(userMessage);
  console.log(`Agent: ${result}`);
}
