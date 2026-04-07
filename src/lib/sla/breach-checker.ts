import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import { evaluateRules } from "@/lib/automation/engine";

interface BreachCheckResult {
  checked: number;
  atRisk: number;
  breached: number;
}

/**
 * Checks all active SLA instances for at-risk and breached tickets.
 * Triggers automation rules and creates notifications.
 */
export async function checkSlaBreaches(): Promise<BreachCheckResult> {
  const supabase = getSupabase();
  const now = new Date();
  const atRiskThresholdMs = 4 * 60 * 60 * 1000; // 4 hours before due

  // Get active SLA instances (not resolved/closed, not already breached)
  const { data: instances } = await supabase
    .from("SlaInstance")
    .select(`
      id, ticketId, priority, firstResponseDueAt, resolutionDueAt,
      firstResponseBreachedAt, resolutionBreachedAt,
      firstResponseAtRiskNotifiedAt, resolutionAtRiskNotifiedAt,
      policyConfigId
    `)
    .is("resolutionBreachedAt", null);

  if (!instances || instances.length === 0) {
    return { checked: 0, atRisk: 0, breached: 0 };
  }

  // Get ticket statuses to skip resolved/closed
  const ticketIds = instances.map((i) => i.ticketId);
  const { data: tickets } = await supabase
    .from("Ticket")
    .select("id, subject, status, priority, assignedTeamId, assigneeId, requesterId, categoryId, description")
    .in("id", ticketIds);

  const ticketMap = new Map((tickets ?? []).map((t) => [t.id, t]));

  let atRisk = 0;
  let breached = 0;
  const updateNow = now.toISOString();

  for (const sla of instances) {
    const ticket = ticketMap.get(sla.ticketId);
    if (!ticket) continue;
    if (["RESOLVED", "CLOSED"].includes(ticket.status)) continue;
    if (["WAITING_ON_REQUESTER", "WAITING_ON_VENDOR"].includes(ticket.status)) continue;

    // Check first response breach
    if (sla.firstResponseDueAt && !sla.firstResponseBreachedAt) {
      const due = new Date(sla.firstResponseDueAt).getTime();

      if (now.getTime() > due) {
        // Breached!
        breached++;
        await supabase
          .from("SlaInstance")
          .update({ firstResponseBreachedAt: updateNow, updatedAt: updateNow })
          .eq("id", sla.id);

        await createSlaEvent(sla.ticketId, "SLA_BREACHED", "first_response");
        await evaluateRules("SLA_BREACHED", ticket as Parameters<typeof evaluateRules>[1]);
      } else if (due - now.getTime() < atRiskThresholdMs && !sla.firstResponseAtRiskNotifiedAt) {
        // At risk
        atRisk++;
        await supabase
          .from("SlaInstance")
          .update({ firstResponseAtRiskNotifiedAt: updateNow, updatedAt: updateNow })
          .eq("id", sla.id);

        await createSlaEvent(sla.ticketId, "SLA_AT_RISK", "first_response");
        await evaluateRules("SLA_APPROACHING", ticket as Parameters<typeof evaluateRules>[1]);
      }
    }

    // Check resolution breach
    if (sla.resolutionDueAt && !sla.resolutionBreachedAt) {
      const due = new Date(sla.resolutionDueAt).getTime();

      if (now.getTime() > due) {
        breached++;
        await supabase
          .from("SlaInstance")
          .update({ resolutionBreachedAt: updateNow, updatedAt: updateNow })
          .eq("id", sla.id);

        await createSlaEvent(sla.ticketId, "SLA_BREACHED", "resolution");
        await evaluateRules("SLA_BREACHED", ticket as Parameters<typeof evaluateRules>[1]);
      } else if (due - now.getTime() < atRiskThresholdMs && !sla.resolutionAtRiskNotifiedAt) {
        atRisk++;
        await supabase
          .from("SlaInstance")
          .update({ resolutionAtRiskNotifiedAt: updateNow, updatedAt: updateNow })
          .eq("id", sla.id);

        await createSlaEvent(sla.ticketId, "SLA_AT_RISK", "resolution");
        await evaluateRules("SLA_APPROACHING", ticket as Parameters<typeof evaluateRules>[1]);
      }
    }
  }

  return { checked: instances.length, atRisk, breached };
}

async function createSlaEvent(ticketId: string, type: string, metric: string) {
  const supabase = getSupabase();
  await supabase.from("TicketEvent").insert({
    id: randomUUID(),
    ticketId,
    type,
    payload: { metric, timestamp: new Date().toISOString() },
  });
}
