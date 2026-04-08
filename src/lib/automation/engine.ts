import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";

type Trigger = "TICKET_CREATED" | "STATUS_CHANGED" | "SLA_APPROACHING" | "SLA_BREACHED";

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  conditions: Condition[];
  actions: Action[];
  priority: number;
  teamId: string | null;
  isActive: boolean;
}

interface SimpleCondition {
  field: string;
  operator: "equals" | "notEquals" | "contains" | "in" | "notIn";
  value: string | string[];
}

interface ConditionGroup {
  logic: "AND" | "OR";
  conditions: (SimpleCondition | ConditionGroup)[];
}

type Condition = SimpleCondition | ConditionGroup;

interface Action {
  type: "assign_team" | "assign_user" | "set_priority" | "set_status" | "notify_team_lead" | "add_internal_note";
  teamId?: string;
  userId?: string;
  priority?: string;
  status?: string;
  body?: string;
}

interface TicketContext {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assignedTeamId: string | null;
  assigneeId: string | null;
  categoryId: string | null;
  requesterId: string;
}

/**
 * Evaluates and executes automation rules for a given trigger event.
 * First matching rule wins (by priority ASC, then createdAt ASC).
 */
export async function evaluateRules(
  trigger: Trigger,
  ticket: TicketContext,
  actorId?: string
): Promise<{ executed: boolean; ruleName: string | null; actions: string[] }> {
  const supabase = getSupabase();

  const { data: rules } = await supabase
    .from("AutomationRule")
    .select("*")
    .eq("trigger", trigger)
    .eq("isActive", true)
    .order("priority", { ascending: true })
    .order("createdAt", { ascending: true });

  if (!rules || rules.length === 0) {
    return { executed: false, ruleName: null, actions: [] };
  }

  for (const rule of rules) {
    // Check team scope
    if (rule.teamId && rule.teamId !== ticket.assignedTeamId) continue;

    // Evaluate conditions (supports AND/OR nesting)
    const conditions = (rule.conditions as Condition[]) ?? [];
    const allMatch = evaluateConditions(conditions, ticket);
    if (!allMatch) continue;

    // Execute actions
    const actions = (rule.actions as Action[]) ?? [];
    const executedActions: string[] = [];

    for (const action of actions) {
      try {
        await executeAction(action, ticket, actorId);
        executedActions.push(action.type);
      } catch (error) {
        console.error(`Automation action ${action.type} failed:`, error);
      }
    }

    // Log execution
    await supabase.from("AutomationExecution").insert({
      id: randomUUID(),
      ruleId: rule.id,
      ticketId: ticket.id,
      success: true,
      trigger,
    });

    return { executed: true, ruleName: rule.name, actions: executedActions };
  }

  return { executed: false, ruleName: null, actions: [] };
}

function evaluateConditions(conditions: Condition[], ticket: TicketContext): boolean {
  // Default: all conditions must match (AND)
  return conditions.every((c) => matchCondition(c, ticket));
}

function matchCondition(condition: Condition, ticket: TicketContext): boolean {
  // Handle nested AND/OR groups
  if ("logic" in condition && "conditions" in condition) {
    const group = condition as ConditionGroup;
    if (group.logic === "OR") {
      return group.conditions.some((c) => matchCondition(c, ticket));
    }
    return group.conditions.every((c) => matchCondition(c, ticket));
  }

  const simple = condition as SimpleCondition;
  const fieldValue = ticket[simple.field as keyof TicketContext] as string | null;

  switch (simple.operator) {
    case "equals":
      return fieldValue === simple.value;
    case "notEquals":
      return fieldValue !== simple.value;
    case "contains":
      return fieldValue?.toLowerCase().includes((simple.value as string).toLowerCase()) ?? false;
    case "in":
      return Array.isArray(simple.value) && simple.value.includes(fieldValue ?? "");
    case "notIn":
      return Array.isArray(simple.value) && !simple.value.includes(fieldValue ?? "");
    default:
      return false;
  }
}

async function executeAction(
  action: Action,
  ticket: TicketContext,
  actorId?: string
): Promise<void> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  switch (action.type) {
    case "assign_team":
      if (action.teamId) {
        await supabase
          .from("Ticket")
          .update({ assignedTeamId: action.teamId, updatedAt: now })
          .eq("id", ticket.id);
      }
      break;

    case "assign_user":
      if (action.userId) {
        await supabase
          .from("Ticket")
          .update({ assigneeId: action.userId, status: "ASSIGNED", updatedAt: now })
          .eq("id", ticket.id);
      }
      break;

    case "set_priority":
      if (action.priority) {
        await supabase
          .from("Ticket")
          .update({ priority: action.priority, updatedAt: now })
          .eq("id", ticket.id);
      }
      break;

    case "set_status":
      if (action.status) {
        const update: Record<string, unknown> = { status: action.status, updatedAt: now };
        if (action.status === "RESOLVED") {
          update.resolvedAt = now;
          update.completedAt = now;
        }
        await supabase.from("Ticket").update(update).eq("id", ticket.id);
      }
      break;

    case "notify_team_lead":
      // Create in-app notification for team leads
      if (ticket.assignedTeamId) {
        const { data: leads } = await supabase
          .from("TeamMember")
          .select("userId")
          .eq("teamId", ticket.assignedTeamId)
          .in("role", ["LEAD", "ADMIN"]);

        for (const lead of leads ?? []) {
          await supabase.from("Notification").insert({
            id: randomUUID(),
            userId: lead.userId,
            type: "TICKET_UPDATED",
            title: `Automation: ${ticket.subject}`,
            body: action.body ?? "An automation rule was triggered on this ticket.",
            ticketId: ticket.id,
            actorId: actorId ?? null,
          });
        }
      }
      break;

    case "add_internal_note":
      if (action.body) {
        await supabase.from("TicketMessage").insert({
          id: randomUUID(),
          ticketId: ticket.id,
          authorId: actorId ?? ticket.requesterId,
          type: "INTERNAL",
          body: `[Automation] ${action.body}`,
        });
      }
      break;
  }
}
