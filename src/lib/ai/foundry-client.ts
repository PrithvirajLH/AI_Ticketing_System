import { AzureOpenAI } from "openai";
import { executeTool } from "./tools";

// ─── Configuration ───────────────────────────────────────────────────────────

interface AgentConfig {
  name: string;
  version?: string;
}

function getAgentConfig(
  step: "intentExtractor" | "departmentClassifier" | "confidenceGate" | "ticketGenerator"
): AgentConfig {
  const envMap = {
    intentExtractor: "INTENT_EXTRACTOR_AGENT_ID",
    departmentClassifier: "DEPARTMENT_CLASSIFIER_AGENT_ID",
    confidenceGate: "CONFIDENCE_GATE_AGENT_ID",
    ticketGenerator: "TICKET_GENERATOR_AGENT_ID",
  };

  const name = process.env[envMap[step]];
  if (!name) throw new Error(`Missing ${envMap[step]} environment variable`);
  return { name };
}

// ─── Client Singleton ────────────────────────────────────────────────────────

let client: AzureOpenAI | null = null;

function getClient(): AzureOpenAI {
  if (client) return client;

  const endpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT;
  const apiKey = process.env.AZURE_AI_FOUNDRY_API_KEY;

  if (!endpoint) throw new Error("Missing AZURE_AI_FOUNDRY_ENDPOINT");
  if (!apiKey) throw new Error("Missing AZURE_AI_FOUNDRY_API_KEY");

  client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion: "2025-05-15-preview",
  });

  return client;
}

// ─── Response Helpers ────────────────────────────────────────────────────────

interface ResponseOutput {
  type: string;
  name?: string;
  arguments?: string;
  call_id?: string;
  content?: Array<{ type: string; text?: string }>;
}

interface FoundryResponse {
  id: string;
  status: string;
  output: ResponseOutput[];
  output_text?: string;
}

function extractText(response: FoundryResponse): string {
  // Try output_text first
  if (response.output_text) return response.output_text;

  // Look through output items for message content
  for (const item of response.output ?? []) {
    if (item.type === "message" && item.content) {
      for (const c of item.content) {
        if (c.type === "output_text" && c.text) return c.text;
      }
    }
  }

  return "";
}

// ─── Agent Runner ────────────────────────────────────────────────────────────

interface AgentRunResult {
  content: string;
  toolCallsMade: string[];
  latencyMs: number;
}

/**
 * Runs a Foundry agent using the Responses API with agent_reference.
 * Uses client.post() to send agent_reference directly in the request body.
 */
export async function runAgent(
  step: "intentExtractor" | "departmentClassifier" | "confidenceGate" | "ticketGenerator",
  userMessage: string
): Promise<AgentRunResult> {
  const openai = getClient();
  const agent = getAgentConfig(step);
  const model = process.env.AZURE_AI_FOUNDRY_MODEL ?? "gpt-5.4-mini";
  const startTime = Date.now();
  const toolCallsMade: string[] = [];

  // Initial call
  let response = (await openai.post("/responses", {
    body: {
      model,
      input: [{ role: "user", content: userMessage }],
      agent_reference: {
        name: agent.name,
        ...(agent.version && { version: agent.version }),
        type: "agent_reference",
      },
    },
  })) as FoundryResponse;

  // Handle tool call loop
  let maxRounds = 5;
  while (maxRounds-- > 0) {
    const functionCalls = (response.output ?? []).filter(
      (item) => item.type === "function_call"
    );

    if (functionCalls.length === 0) break;

    // Execute tools locally
    const toolResults = [];
    for (const call of functionCalls) {
      const toolName = call.name ?? "unknown";
      const toolArgs = JSON.parse(call.arguments ?? "{}");
      toolCallsMade.push(toolName);
      const result = await executeTool(toolName, toolArgs);
      toolResults.push({
        type: "function_call_output",
        call_id: call.call_id,
        output: result,
      });
    }

    // Continue conversation with tool results
    response = (await openai.post("/responses", {
      body: {
        model,
        input: toolResults,
        previous_response_id: response.id,
        agent_reference: {
          name: agent.name,
          ...(agent.version && { version: agent.version }),
          type: "agent_reference",
        },
      },
    })) as FoundryResponse;
  }

  return {
    content: extractText(response),
    toolCallsMade,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Parses the agent's text response as JSON.
 */
export function parseAgentResponse<T>(
  content: string,
  validate: (data: unknown) => T
): T {
  let cleaned = content.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(cleaned);
  return validate(parsed);
}
