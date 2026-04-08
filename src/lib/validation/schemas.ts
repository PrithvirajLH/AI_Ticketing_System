import { z } from "zod/v4";

// ─── Tickets ─────────────────────────────────────────────────────────────────

export const CreateTicketSchema = z.object({
  subject: z.string().min(1).max(255),
  description: z.string().min(1),
  priority: z.enum(["P1", "P2", "P3", "P4"]).default("P3"),
  channel: z.enum(["PORTAL", "EMAIL"]).default("PORTAL"),
  assignedTeamId: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  requesterId: z.string(),
});

export const TransitionTicketSchema = z.object({
  status: z.enum([
    "NEW", "TRIAGED", "ASSIGNED", "IN_PROGRESS",
    "WAITING_ON_REQUESTER", "WAITING_ON_VENDOR",
    "RESOLVED", "CLOSED", "REOPENED",
  ]),
  userId: z.string(),
});

export const AssignTicketSchema = z.object({
  assigneeId: z.string().nullable(),
  userId: z.string(),
});

export const TransferTicketSchema = z.object({
  teamId: z.string(),
  userId: z.string(),
});

export const CreateMessageSchema = z.object({
  body: z.string().min(1),
  type: z.enum(["PUBLIC", "INTERNAL"]).default("PUBLIC"),
  authorId: z.string(),
});

export const BulkActionSchema = z.object({
  action: z.enum(["assign", "status", "priority", "transfer"]),
  ticketIds: z.array(z.string()).min(1).max(100),
  userId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  teamId: z.string().optional(),
});

// ─── Admin ───────────────────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export const CreateRoutingRuleSchema = z.object({
  name: z.string().min(1).max(100),
  keywords: z.array(z.string()).min(1),
  teamId: z.string(),
  priority: z.number().int().default(100),
  assigneeId: z.string().nullable().optional(),
});

export const CreateAutomationRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  trigger: z.enum(["TICKET_CREATED", "STATUS_CHANGED", "SLA_APPROACHING", "SLA_BREACHED"]),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(["equals", "notEquals", "contains", "in", "notIn"]),
    value: z.union([z.string(), z.array(z.string())]),
  })).default([]),
  actions: z.array(z.object({
    type: z.enum(["assign_team", "assign_user", "set_priority", "set_status", "notify_team_lead", "add_internal_note"]),
    teamId: z.string().optional(),
    userId: z.string().optional(),
    priority: z.string().optional(),
    status: z.string().optional(),
    body: z.string().optional(),
  })).min(1),
  priority: z.number().int().default(0),
  teamId: z.string().nullable().optional(),
  createdById: z.string(),
});

export const CreateCannedResponseSchema = z.object({
  name: z.string().min(1).max(100),
  content: z.string().min(1),
  userId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
});

export const CreateSavedViewSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.record(z.string(), z.unknown()),
  userId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
});

export const UpdateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["EMPLOYEE", "AGENT", "LEAD", "TEAM_ADMIN", "OWNER"]),
  department: z.string().optional(),
});

export const InboundEmailSchema = z.object({
  messageId: z.string(),
  fromEmail: z.string().email(),
  fromName: z.string().optional(),
  subject: z.string().min(1),
  textBody: z.string().optional(),
  inReplyTo: z.string().optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    contentType: z.string(),
    sizeBytes: z.number(),
    url: z.string().optional(),
    base64: z.string().optional(),
  })).optional(),
});

// ─── Helper ──────────────────────────────────────────────────────────────────

export function validateBody<T>(schema: z.ZodType<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    return { success: false, error: `Validation failed: ${issues}` };
  }
  return { success: true, data: result.data };
}
