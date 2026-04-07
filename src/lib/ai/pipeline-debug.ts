import { runAgent, parseAgentResponse } from "./foundry-client";
import { createTicket, createSlaInstance } from "./tools/ticket-tools";
import { routeTicket } from "@/lib/routing/engine";
import {
  IntentResultSchema,
  ClassificationResultSchema,
  ConfidenceResultSchema,
  TicketDraftSchema,
  type PipelineInput,
  type IntentResult,
  type ClassificationResult,
  type ConfidenceResult,
  type TicketDraft,
} from "./types";

// ─── Step Result Types ───────────────────────────────────────────────────────

export interface StepResult {
  step: number;
  name: string;
  agentName: string;
  input: string;
  rawOutput: string;
  parsed: unknown;
  toolsCalled: string[];
  latencyMs: number;
  status: "success" | "error";
  error?: string;
}

export interface DebugPipelineResult {
  steps: StepResult[];
  finalStatus: "created" | "needs_clarification" | "error";
  totalLatencyMs: number;
  ticket?: Record<string, unknown>;
  clarifyingQuestion?: string;
  errorMessage?: string;
}

// ─── Debug Pipeline ──────────────────────────────────────────────────────────

export async function classifyTicketDebug(
  input: PipelineInput
): Promise<DebugPipelineResult> {
  const steps: StepResult[] = [];
  const startTime = Date.now();

  // ── Step 1: Intent Extraction ──────────────────────────────────────────

  const step1Input = input.userId
    ? `User ID: ${input.userId}\n\nRequest:\n${input.text}`
    : `Request:\n${input.text}`;

  let intent: IntentResult;
  try {
    const result = await runAgent("intentExtractor", step1Input);
    intent = parseAgentResponse(result.content, (d) => IntentResultSchema.parse(d));

    steps.push({
      step: 1,
      name: "Intent Extraction",
      agentName: process.env.INTENT_EXTRACTOR_AGENT_ID ?? "intent-extractor",
      input: step1Input,
      rawOutput: result.content,
      parsed: intent,
      toolsCalled: result.toolCallsMade,
      latencyMs: result.latencyMs,
      status: "success",
    });
  } catch (error) {
    steps.push({
      step: 1,
      name: "Intent Extraction",
      agentName: process.env.INTENT_EXTRACTOR_AGENT_ID ?? "intent-extractor",
      input: step1Input,
      rawOutput: "",
      parsed: null,
      toolsCalled: [],
      latencyMs: Date.now() - startTime,
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { steps, finalStatus: "error", totalLatencyMs: Date.now() - startTime, errorMessage: `Step 1 failed: ${steps[0].error}` };
  }

  // ── Step 2: Department Classification ──────────────────────────────────

  const step2Input = `Classify the following analyzed request:\n\n${JSON.stringify(intent, null, 2)}`;

  let classification: ClassificationResult;
  try {
    const result = await runAgent("departmentClassifier", step2Input);
    classification = parseAgentResponse(result.content, (d) => ClassificationResultSchema.parse(d));

    steps.push({
      step: 2,
      name: "Department Classification",
      agentName: process.env.DEPARTMENT_CLASSIFIER_AGENT_ID ?? "department-classifier",
      input: step2Input,
      rawOutput: result.content,
      parsed: classification,
      toolsCalled: result.toolCallsMade,
      latencyMs: result.latencyMs,
      status: "success",
    });
  } catch (error) {
    steps.push({
      step: 2,
      name: "Department Classification",
      agentName: process.env.DEPARTMENT_CLASSIFIER_AGENT_ID ?? "department-classifier",
      input: step2Input,
      rawOutput: "",
      parsed: null,
      toolsCalled: [],
      latencyMs: Date.now() - startTime - steps.reduce((s, r) => s + r.latencyMs, 0),
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { steps, finalStatus: "error", totalLatencyMs: Date.now() - startTime, errorMessage: `Step 2 failed: ${steps[1].error}` };
  }

  // ── Step 3: Confidence Gate ────────────────────────────────────────────

  const step3Input = `Evaluate the confidence of this classification:\n\nIntent:\n${JSON.stringify(intent, null, 2)}\n\nClassification:\n${JSON.stringify(classification, null, 2)}`;

  let confidence: ConfidenceResult;
  try {
    const result = await runAgent("confidenceGate", step3Input);
    confidence = parseAgentResponse(result.content, (d) => ConfidenceResultSchema.parse(d));

    steps.push({
      step: 3,
      name: "Confidence Gate",
      agentName: process.env.CONFIDENCE_GATE_AGENT_ID ?? "confidence-gate",
      input: step3Input,
      rawOutput: result.content,
      parsed: confidence,
      toolsCalled: result.toolCallsMade,
      latencyMs: result.latencyMs,
      status: "success",
    });
  } catch (error) {
    steps.push({
      step: 3,
      name: "Confidence Gate",
      agentName: process.env.CONFIDENCE_GATE_AGENT_ID ?? "confidence-gate",
      input: step3Input,
      rawOutput: "",
      parsed: null,
      toolsCalled: [],
      latencyMs: Date.now() - startTime - steps.reduce((s, r) => s + r.latencyMs, 0),
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { steps, finalStatus: "error", totalLatencyMs: Date.now() - startTime, errorMessage: `Step 3 failed: ${steps[2].error}` };
  }

  const finalClassification = confidence.adjustedClassification ?? classification;

  if (!confidence.passed) {
    return {
      steps,
      finalStatus: "needs_clarification",
      totalLatencyMs: Date.now() - startTime,
      clarifyingQuestion: confidence.clarifyingQuestion ?? "Could you provide more details?",
    };
  }

  // ── Step 4: Ticket Generation ──────────────────────────────────────────

  const step4Input = `Based on the pipeline data below, generate a JSON ticket draft. Do NOT attempt to call any tools or functions. Do NOT explain what you would do. ONLY return a valid JSON object.

Intent:
${JSON.stringify(intent, null, 2)}

Classification:
${JSON.stringify(finalClassification, null, 2)}

Confidence:
${JSON.stringify(confidence, null, 2)}

Channel: ${input.channel}
Requester ID: ${input.userId ?? "unknown"}

IMPORTANT: Return ONLY the JSON object, nothing else. Format:
{"subject":"...","description":"...","priority":"P1|P2|P3|P4","channel":"PORTAL|EMAIL","assignedTeamId":"...","categoryId":"...|null","displayId":"...","tags":["..."]}`;

  let ticketDraft: TicketDraft;
  try {
    const result = await runAgent("ticketGenerator", step4Input);
    ticketDraft = parseAgentResponse(result.content, (d) => TicketDraftSchema.parse(d));

    steps.push({
      step: 4,
      name: "Ticket Generation",
      agentName: process.env.TICKET_GENERATOR_AGENT_ID ?? "ticket-generator",
      input: step4Input,
      rawOutput: result.content,
      parsed: ticketDraft,
      toolsCalled: result.toolCallsMade,
      latencyMs: result.latencyMs,
      status: "success",
    });
  } catch (error) {
    steps.push({
      step: 4,
      name: "Ticket Generation",
      agentName: process.env.TICKET_GENERATOR_AGENT_ID ?? "ticket-generator",
      input: step4Input,
      rawOutput: "",
      parsed: null,
      toolsCalled: [],
      latencyMs: Date.now() - startTime - steps.reduce((s, r) => s + r.latencyMs, 0),
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { steps, finalStatus: "error", totalLatencyMs: Date.now() - startTime, errorMessage: `Step 4 failed: ${steps[3].error}` };
  }

  // ── Step 5: Route to Team ────────────────────────────────────────────

  const step5Start = Date.now();
  const requesterId = input.userId ?? "unknown";

  let routingResult;
  try {
    routingResult = await routeTicket({
      subject: ticketDraft.subject,
      description: ticketDraft.description,
      aiTeamId: ticketDraft.assignedTeamId || null,
      aiTeamName: finalClassification.department.name,
    });

    // Override the draft with the routed team
    ticketDraft = {
      ...ticketDraft,
      assignedTeamId: routingResult.teamId,
    };

    steps.push({
      step: 5,
      name: "Route to Team",
      agentName: "routing-engine",
      input: `Subject: ${ticketDraft.subject}\nAI Team: ${finalClassification.department.name}`,
      rawOutput: JSON.stringify(routingResult, null, 2),
      parsed: {
        team: routingResult.teamName,
        method: routingResult.method,
        matchedRule: routingResult.matchedRule,
        assignee: routingResult.assigneeId ?? "Queue (unassigned)",
      },
      toolsCalled: ["route_ticket"],
      latencyMs: Date.now() - step5Start,
      status: "success",
    });
  } catch (error) {
    steps.push({
      step: 5,
      name: "Route to Team",
      agentName: "routing-engine",
      input: ticketDraft.subject,
      rawOutput: "",
      parsed: null,
      toolsCalled: [],
      latencyMs: Date.now() - step5Start,
      status: "error",
      error: error instanceof Error ? error.message : "Routing failed",
    });
    // Don't fail — continue with AI's team assignment
  }

  // ── Step 6: Save to Database ───────────────────────────────────────────

  const step6Start = Date.now();

  // Build AI analysis from pipeline data
  const aiAnalysis = {
    what: intent.intent,
    who: `Requester ID: ${requesterId}`,
    context: finalClassification.reasoning,
    urgency: intent.urgencySignals.length > 0 ? intent.urgencySignals.join(", ") : "None indicated",
    intent: intent.intent,
    requestType: intent.requestType,
    department: routingResult?.teamName ?? finalClassification.department.name,
    departmentConfidence: finalClassification.department.confidence,
    category: finalClassification.category?.name ?? null,
    reasoning: finalClassification.reasoning,
    routingMethod: routingResult?.method ?? "ai_classification",
    matchedRule: routingResult?.matchedRule ?? null,
  };

  const ticketResult = await createTicket({
    draft: ticketDraft,
    requesterId,
    rawText: input.text,
    aiAnalysis,
  });

  if (!ticketResult.success) {
    steps.push({
      step: 6,
      name: "Save to Database",
      agentName: "system",
      input: JSON.stringify(ticketDraft, null, 2),
      rawOutput: ticketResult.error,
      parsed: null,
      toolsCalled: ["create_ticket"],
      latencyMs: Date.now() - step6Start,
      status: "error",
      error: ticketResult.error,
    });
    return { steps, finalStatus: "error", totalLatencyMs: Date.now() - startTime, errorMessage: `Step 6 failed: ${ticketResult.error}` };
  }

  const ticket = ticketResult.data;

  // Create SLA instance
  const slaResult = await createSlaInstance(ticket.id, ticketDraft.priority);

  // If routing assigned someone, update the ticket
  if (routingResult?.assigneeId) {
    const { getSupabase } = await import("@/lib/db/supabase");
    const sb = getSupabase();
    await sb
      .from("Ticket")
      .update({
        assigneeId: routingResult.assigneeId,
        status: "ASSIGNED",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", ticket.id);
  }

  steps.push({
    step: 6,
    name: "Save to Database",
    agentName: "system",
    input: JSON.stringify(ticketDraft, null, 2),
    rawOutput: JSON.stringify({ ticket, sla: slaResult.success ? slaResult.data : null }, null, 2),
    parsed: {
      ticketId: ticket.id,
      ticketNumber: ticket.number,
      displayId: ticket.displayId,
      slaCreated: slaResult.success,
      assignedTo: routingResult?.assigneeId ?? "Queue",
    },
    toolsCalled: ["create_ticket", "create_sla_instance"],
    latencyMs: Date.now() - step6Start,
    status: "success",
  });

  return {
    steps,
    finalStatus: "created",
    totalLatencyMs: Date.now() - startTime,
    ticket: {
      id: ticket.id,
      number: ticket.number,
      displayId: ticket.displayId,
      subject: ticketDraft.subject,
      description: ticketDraft.description,
      priority: ticketDraft.priority,
      channel: ticketDraft.channel,
      assignedTeamId: ticketDraft.assignedTeamId,
      categoryId: ticketDraft.categoryId,
      tags: ticketDraft.tags,
    },
  };
}
