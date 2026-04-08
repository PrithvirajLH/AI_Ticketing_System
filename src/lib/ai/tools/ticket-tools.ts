import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import type { TicketDraft, ToolResult } from "../types";

interface CreateTicketInput {
  draft: TicketDraft;
  requesterId: string;
  rawText?: string;
  aiAnalysis?: {
    what: string;
    who: string;
    context: string;
    urgency: string;
    intent: string;
    requestType: string;
    department: string;
    departmentConfidence: number;
    category: string | null;
    reasoning: string;
  };
}

function generateId(): string {
  return randomUUID();
}

export async function createTicket(
  input: CreateTicketInput
): Promise<ToolResult<{ id: string; number: number; displayId: string | null }>> {
  try {
    const supabase = getSupabase();
    const now = new Date().toISOString();
    const ticketId = generateId();

    // Generate displayId: DEPT_YYYYMMDD_NNN
    // e.g. AI_20260407_001, HR_20260407_002
    let displayId = input.draft.displayId;
    const { data: team } = await supabase
      .from("Team")
      .select("slug, name")
      .eq("id", input.draft.assignedTeamId)
      .single();

    if (team) {
      // Build department prefix from slug
      // ai → AI, hr → HR, it-service-desk → IT, hr-operations → HR-OPS, medicaid-pending → MP, white-gloves → WG
      const SLUG_PREFIX: Record<string, string> = {
        "ai": "AI",
        "hr": "HR",
        "it-service-desk": "IT",
        "medicaid-pending": "MP",
        "white-gloves": "WG",
      };
      const deptPrefix = SLUG_PREFIX[team.slug] ?? team.slug.toUpperCase();

      // Today's date as YYYYMMDD
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

      // Count tickets for this team created today
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const { count } = await supabase
        .from("Ticket")
        .select("id", { count: "exact", head: true })
        .eq("assignedTeamId", input.draft.assignedTeamId)
        .gte("createdAt", startOfDay);

      const dailyNum = (count ?? 0) + 1;
      displayId = `${deptPrefix}_${dateStr}_${String(dailyNum).padStart(3, "0")}`;
    }

    const { data: ticket, error } = await supabase
      .from("Ticket")
      .insert({
        id: ticketId,
        subject: input.draft.subject,
        description: input.draft.description,
        priority: input.draft.priority,
        channel: input.draft.channel === "EMAIL" ? "EMAIL" : "PORTAL",
        requesterId: input.requesterId,
        assignedTeamId: input.draft.assignedTeamId,
        categoryId: input.draft.categoryId,
        displayId,
        status: "NEW",
        updatedAt: now,
      })
      .select("id, number, displayId")
      .single();

    if (error || !ticket) {
      return { success: false, error: `Failed to create ticket: ${error?.message ?? "No data returned"}` };
    }

    // Auto-follow: requester follows their own ticket
    await supabase.from("TicketFollower").insert({
      id: generateId(),
      ticketId: ticket.id,
      userId: input.requesterId,
    });

    // Log the creation event with AI analysis
    await supabase.from("TicketEvent").insert({
      id: generateId(),
      ticketId: ticket.id,
      type: "TICKET_CREATED",
      payload: {
        source: "ai_pipeline",
        tags: input.draft.tags,
        rawText: input.rawText ?? null,
        aiAnalysis: input.aiAnalysis ?? null,
      },
      createdById: input.requesterId,
    });

    return { success: true, data: ticket };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create ticket: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function createSlaInstance(
  ticketId: string,
  priority: "P1" | "P2" | "P3" | "P4"
): Promise<ToolResult<{ id: string }>> {
  try {
    const supabase = getSupabase();
    const now = new Date();

    // Find the default SLA policy
    const { data: policy } = await supabase
      .from("SlaPolicyConfig")
      .select("id")
      .eq("isDefault", true)
      .eq("enabled", true)
      .single();

    if (!policy) {
      const { data, error } = await supabase
        .from("SlaInstance")
        .insert({ id: generateId(), ticketId, priority, updatedAt: now.toISOString() })
        .select("id")
        .single();

      if (error || !data) {
        return { success: false, error: `Failed to create SLA: ${error?.message}` };
      }
      return { success: true, data };
    }

    // Get the target for this priority
    const { data: target } = await supabase
      .from("SlaPolicyConfigTarget")
      .select("firstResponseHours, resolutionHours")
      .eq("policyConfigId", policy.id)
      .eq("priority", priority)
      .single();

    // Check if policy uses business hours
    const { data: policyConfig } = await supabase
      .from("SlaPolicyConfig")
      .select("businessHoursOnly")
      .eq("id", policy.id)
      .single();

    let firstResponseDueAt: string | null = null;
    let resolutionDueAt: string | null = null;

    if (target) {
      if (policyConfig?.businessHoursOnly) {
        // Use business hours calculation
        const { addBusinessHours } = await import("@/lib/sla/business-hours");
        firstResponseDueAt = (await addBusinessHours(now, target.firstResponseHours)).toISOString();
        resolutionDueAt = (await addBusinessHours(now, target.resolutionHours)).toISOString();
      } else {
        // Wall-clock hours
        firstResponseDueAt = new Date(now.getTime() + target.firstResponseHours * 60 * 60 * 1000).toISOString();
        resolutionDueAt = new Date(now.getTime() + target.resolutionHours * 60 * 60 * 1000).toISOString();
      }
    }

    // Also set due dates on the Ticket itself so they show in the queue
    if (firstResponseDueAt || resolutionDueAt) {
      await supabase
        .from("Ticket")
        .update({
          firstResponseDueAt,
          dueAt: resolutionDueAt,
          updatedAt: now.toISOString(),
        })
        .eq("id", ticketId);
    }

    const { data, error } = await supabase
      .from("SlaInstance")
      .insert({
        id: generateId(),
        ticketId,
        priority,
        policyConfigId: policy.id,
        firstResponseDueAt,
        resolutionDueAt,
        nextDueAt: firstResponseDueAt,
        updatedAt: now.toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: `Failed to create SLA: ${error?.message}` };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create SLA instance: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
