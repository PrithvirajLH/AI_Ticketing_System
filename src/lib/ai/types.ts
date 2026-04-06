import { z } from "zod/v4";

// ─── Pipeline Input ──────────────────────────────────────────────────────────

export const PipelineInputSchema = z.object({
  text: z.string().min(1, "Text is required"),
  userId: z.string().optional(),
  channel: z.enum(["PORTAL", "EMAIL"]).default("PORTAL"),
});

export type PipelineInput = z.infer<typeof PipelineInputSchema>;

// ─── Agent 1: Intent Extractor Output ────────────────────────────────────────

export const IntentResultSchema = z.object({
  intent: z.string(),
  requestType: z.enum(["INCIDENT", "SERVICE_REQUEST", "QUESTION"]),
  entities: z.object({
    people: z.array(z.string()),
    systems: z.array(z.string()),
    dates: z.array(z.string()),
    amounts: z.array(z.string()),
    devices: z.array(z.string()),
    other: z.array(z.string()),
  }),
  urgencySignals: z.array(z.string()),
  affectedSystem: z.string().nullable(),
  rawText: z.string(),
});

export type IntentResult = z.infer<typeof IntentResultSchema>;

// ─── Agent 2: Department Classifier Output ───────────────────────────────────

export const DepartmentMatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  confidence: z.number().min(0).max(1),
});

export const ClassificationResultSchema = z.object({
  department: DepartmentMatchSchema,
  category: DepartmentMatchSchema.nullable(),
  subcategory: DepartmentMatchSchema.nullable(),
  suggestedPriority: z.enum(["P1", "P2", "P3", "P4"]),
  tags: z.array(z.string()),
  isMultiDepartment: z.boolean(),
  alternativeDepartments: z.array(DepartmentMatchSchema),
  reasoning: z.string(),
});

export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;

// ─── Agent 3: Confidence Gate Output ─────────────────────────────────────────

export const ConfidenceResultSchema = z.object({
  passed: z.boolean(),
  overallConfidence: z.number().min(0).max(1),
  clarifyingQuestion: z.string().nullable(),
  adjustedClassification: ClassificationResultSchema.nullable(),
});

export type ConfidenceResult = z.infer<typeof ConfidenceResultSchema>;

// ─── Agent 4: Ticket Generator Output ────────────────────────────────────────

export const TicketDraftSchema = z.object({
  subject: z.string().max(255),
  description: z.string(),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  channel: z.enum(["PORTAL", "EMAIL"]),
  assignedTeamId: z.string(),
  categoryId: z.string().nullable(),
  displayId: z.string(),
  tags: z.array(z.string()),
});

export type TicketDraft = z.infer<typeof TicketDraftSchema>;

export const AiMetadataSchema = z.object({
  intentConfidence: z.number(),
  classificationConfidence: z.number(),
  overallConfidence: z.number(),
  reasoning: z.string(),
  pipelineLatencyMs: z.number(),
  modelUsed: z.string(),
});

export type AiMetadata = z.infer<typeof AiMetadataSchema>;

// ─── Pipeline Result ─────────────────────────────────────────────────────────

export const PipelineSuccessSchema = z.object({
  status: z.literal("created"),
  ticket: z.object({
    id: z.string(),
    number: z.number(),
    displayId: z.string().nullable(),
    subject: z.string(),
    description: z.string(),
    status: z.string(),
    priority: z.string(),
    channel: z.string(),
    requesterId: z.string(),
    assignedTeamId: z.string().nullable(),
    categoryId: z.string().nullable(),
  }),
  aiMetadata: AiMetadataSchema,
});

export const PipelineClarificationSchema = z.object({
  status: z.literal("needs_clarification"),
  question: z.string(),
  partialClassification: ClassificationResultSchema,
});

export const PipelineErrorSchema = z.object({
  status: z.literal("error"),
  error: z.string(),
  step: z.enum([
    "intent_extraction",
    "department_classification",
    "confidence_check",
    "ticket_generation",
  ]),
});

export type PipelineSuccess = z.infer<typeof PipelineSuccessSchema>;
export type PipelineClarification = z.infer<typeof PipelineClarificationSchema>;
export type PipelineError = z.infer<typeof PipelineErrorSchema>;
export type PipelineResult =
  | PipelineSuccess
  | PipelineClarification
  | PipelineError;

// ─── Tool Result Wrapper ─────────────────────────────────────────────────────

export type ToolSuccess<T> = { success: true; data: T };
export type ToolFailure = { success: false; error: string };
export type ToolResult<T> = ToolSuccess<T> | ToolFailure;
