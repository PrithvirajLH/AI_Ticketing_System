import { runAgent, parseAgentResponse } from "./foundry-client";
import {
  IntentResultSchema,
  ClassificationResultSchema,
  ConfidenceResultSchema,
  TicketDraftSchema,
  type PipelineInput,
  type PipelineResult,
  type IntentResult,
  type ClassificationResult,
  type ConfidenceResult,
} from "./types";

// ─── Pipeline Steps ──────────────────────────────────────────────────────────

async function extractIntent(
  text: string,
  userId?: string
): Promise<IntentResult> {
  const userMessage = userId
    ? `User ID: ${userId}\n\nRequest:\n${text}`
    : `Request:\n${text}`;

  const result = await runAgent("intentExtractor", userMessage);
  console.log(`  [Agent 1] Intent Extractor — ${result.latencyMs}ms, tools: [${result.toolCallsMade.join(", ")}]`);

  return parseAgentResponse(result.content, (data) =>
    IntentResultSchema.parse(data)
  );
}

async function classifyDepartment(
  intent: IntentResult
): Promise<ClassificationResult> {
  const userMessage = `Classify the following analyzed request:\n\n${JSON.stringify(intent, null, 2)}`;

  const result = await runAgent("departmentClassifier", userMessage);
  console.log(`  [Agent 2] Dept Classifier — ${result.latencyMs}ms, tools: [${result.toolCallsMade.join(", ")}]`);

  return parseAgentResponse(result.content, (data) =>
    ClassificationResultSchema.parse(data)
  );
}

async function checkConfidence(
  intent: IntentResult,
  classification: ClassificationResult
): Promise<ConfidenceResult> {
  const userMessage = `Evaluate the confidence of this classification:\n\nIntent:\n${JSON.stringify(intent, null, 2)}\n\nClassification:\n${JSON.stringify(classification, null, 2)}`;

  const result = await runAgent("confidenceGate", userMessage);
  console.log(`  [Agent 3] Confidence Gate — ${result.latencyMs}ms`);

  return parseAgentResponse(result.content, (data) =>
    ConfidenceResultSchema.parse(data)
  );
}

async function generateTicket(
  intent: IntentResult,
  classification: ClassificationResult,
  confidence: ConfidenceResult,
  input: PipelineInput
): Promise<void> {
  const userMessage = `Generate and create a ticket from the following pipeline data:

Intent:
${JSON.stringify(intent, null, 2)}

Classification:
${JSON.stringify(classification, null, 2)}

Confidence:
${JSON.stringify(confidence, null, 2)}

Channel: ${input.channel}
Requester ID: ${input.userId ?? "unknown"}`;

  const result = await runAgent("ticketGenerator", userMessage);
  console.log(`  [Agent 4] Ticket Generator — ${result.latencyMs}ms, tools: [${result.toolCallsMade.join(", ")}]`);

  // Validate the response shape
  parseAgentResponse(result.content, (data) => TicketDraftSchema.parse(data));
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

/**
 * Runs the full 4-agent classification pipeline.
 *
 * Each agent is defined in Azure AI Foundry portal. This code calls them
 * via the Responses API with agent_reference. If an agent requests
 * tool calls, they're executed locally against Supabase.
 *
 * Returns either:
 * - A created ticket (status: "created")
 * - A clarifying question (status: "needs_clarification")
 * - An error (status: "error")
 */
export async function classifyTicket(
  input: PipelineInput
): Promise<PipelineResult> {
  const startTime = Date.now();
  console.log(`\n=== AI Pipeline Start ===`);
  console.log(`  Input: "${input.text.substring(0, 80)}${input.text.length > 80 ? "..." : ""}"`);

  // Step 1: Extract intent
  let intent: IntentResult;
  try {
    intent = await extractIntent(input.text, input.userId);
    console.log(`  → Intent: ${intent.intent}`);
    console.log(`  → Type: ${intent.requestType}`);
  } catch (error) {
    console.error(`  ✗ Intent extraction failed:`, error);
    return {
      status: "error",
      error: `Intent extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      step: "intent_extraction",
    };
  }

  // Step 2: Classify department
  let classification: ClassificationResult;
  try {
    classification = await classifyDepartment(intent);
    console.log(`  → Department: ${classification.department.name} (${(classification.department.confidence * 100).toFixed(0)}%)`);
    console.log(`  → Priority: ${classification.suggestedPriority}`);
  } catch (error) {
    console.error(`  ✗ Classification failed:`, error);
    return {
      status: "error",
      error: `Department classification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      step: "department_classification",
    };
  }

  // Step 3: Confidence check
  let confidence: ConfidenceResult;
  try {
    confidence = await checkConfidence(intent, classification);
    console.log(`  → Confidence: ${(confidence.overallConfidence * 100).toFixed(0)}% — ${confidence.passed ? "PASSED" : "NEEDS CLARIFICATION"}`);
  } catch (error) {
    console.error(`  ✗ Confidence check failed:`, error);
    return {
      status: "error",
      error: `Confidence check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      step: "confidence_check",
    };
  }

  const finalClassification = confidence.adjustedClassification ?? classification;

  // If confidence is too low, ask for clarification
  if (!confidence.passed) {
    const elapsed = Date.now() - startTime;
    console.log(`  ← Returning clarification question (${elapsed}ms total)`);
    console.log(`=== AI Pipeline End ===\n`);
    return {
      status: "needs_clarification",
      question: confidence.clarifyingQuestion ?? "Could you provide more details about your request?",
      partialClassification: finalClassification,
    };
  }

  // Step 4: Generate ticket
  try {
    await generateTicket(intent, finalClassification, confidence, input);
  } catch (error) {
    console.error(`  ✗ Ticket generation failed:`, error);
    return {
      status: "error",
      error: `Ticket generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      step: "ticket_generation",
    };
  }

  const pipelineLatencyMs = Date.now() - startTime;

  // Fetch the most recently created ticket
  try {
    const { getSupabase } = await import("@/lib/db/supabase");
    const supabase = getSupabase();
    const { data: ticket } = await supabase
      .from("Ticket")
      .select("id, number, displayId, subject, description, status, priority, channel, requesterId, assignedTeamId, categoryId")
      .eq("requesterId", input.userId ?? "")
      .order("createdAt", { ascending: false })
      .limit(1)
      .single();

    if (!ticket) {
      return {
        status: "error",
        error: "Ticket was not found after creation",
        step: "ticket_generation",
      };
    }

    console.log(`  ✓ Ticket created: #${ticket.number} — ${ticket.subject}`);
    console.log(`  Total pipeline: ${pipelineLatencyMs}ms`);
    console.log(`=== AI Pipeline End ===\n`);

    return {
      status: "created",
      ticket: {
        id: ticket.id,
        number: ticket.number,
        displayId: ticket.displayId,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        channel: ticket.channel,
        requesterId: ticket.requesterId,
        assignedTeamId: ticket.assignedTeamId,
        categoryId: ticket.categoryId,
      },
      aiMetadata: {
        intentConfidence: finalClassification.department.confidence,
        classificationConfidence: finalClassification.department.confidence,
        overallConfidence: confidence.overallConfidence,
        reasoning: finalClassification.reasoning,
        pipelineLatencyMs,
        modelUsed: process.env.AZURE_AI_FOUNDRY_MODEL ?? "gpt-5.4-mini",
      },
    };
  } catch (error) {
    return {
      status: "error",
      error: `Failed to retrieve created ticket: ${error instanceof Error ? error.message : "Unknown error"}`,
      step: "ticket_generation",
    };
  }
}
