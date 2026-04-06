import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import type { TicketDraft, ToolResult } from "../types";

interface CreateTicketInput {
  draft: TicketDraft;
  requesterId: string;
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

    // Generate proper displayId: get team slug and next ticket number
    let displayId = input.draft.displayId;
    const { data: team } = await supabase
      .from("Team")
      .select("slug")
      .eq("id", input.draft.assignedTeamId)
      .single();

    if (team) {
      const { count } = await supabase
        .from("Ticket")
        .select("id", { count: "exact", head: true })
        .eq("assignedTeamId", input.draft.assignedTeamId);

      const nextNum = (count ?? 0) + 1;
      const slug = team.slug.toUpperCase().replace(/-/g, "-");
      displayId = `${slug}-${String(nextNum).padStart(4, "0")}`;
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

    // Log the creation event
    await supabase.from("TicketEvent").insert({
      id: generateId(),
      ticketId: ticket.id,
      type: "TICKET_CREATED",
      payload: {
        source: "ai_pipeline",
        tags: input.draft.tags,
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

    const firstResponseDueAt = target
      ? new Date(now.getTime() + target.firstResponseHours * 60 * 60 * 1000).toISOString()
      : null;
    const resolutionDueAt = target
      ? new Date(now.getTime() + target.resolutionHours * 60 * 60 * 1000).toISOString()
      : null;

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
