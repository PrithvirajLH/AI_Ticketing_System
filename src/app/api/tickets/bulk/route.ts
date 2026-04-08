import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import { BulkActionSchema, validateBody } from "@/lib/validation/schemas";

const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";
const MAX_BULK = 100;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = validateBody(BulkActionSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { action, ticketIds } = validation.data;
    const userId = validation.data.userId ?? CURRENT_USER_ID;

    const supabase = getSupabase();
    const now = new Date().toISOString();
    let updated = 0;

    if (action === "assign") {
      const assigneeId = body.assigneeId as string;
      for (const id of ticketIds) {
        const { error } = await supabase
          .from("Ticket")
          .update({ assigneeId, status: assigneeId ? "ASSIGNED" : undefined, updatedAt: now })
          .eq("id", id);
        if (!error) {
          updated++;
          await supabase.from("TicketEvent").insert({
            id: randomUUID(), ticketId: id, type: "TICKET_ASSIGNED",
            payload: { assigneeId }, createdById: userId,
          });
        }
      }
    }

    if (action === "status") {
      const newStatus = body.status as string;
      for (const id of ticketIds) {
        const update: Record<string, unknown> = { status: newStatus, updatedAt: now };
        if (newStatus === "RESOLVED") { update.resolvedAt = now; update.completedAt = now; }
        if (newStatus === "CLOSED") { update.closedAt = now; }

        const { error } = await supabase.from("Ticket").update(update).eq("id", id);
        if (!error) {
          updated++;
          await supabase.from("TicketEvent").insert({
            id: randomUUID(), ticketId: id, type: "STATUS_CHANGED",
            payload: { to: newStatus, bulk: true }, createdById: userId,
          });
        }
      }
    }

    if (action === "priority") {
      const newPriority = body.priority as string;
      for (const id of ticketIds) {
        const { error } = await supabase
          .from("Ticket")
          .update({ priority: newPriority, updatedAt: now })
          .eq("id", id);
        if (!error) {
          updated++;
          await supabase.from("TicketEvent").insert({
            id: randomUUID(), ticketId: id, type: "PRIORITY_CHANGED",
            payload: { to: newPriority, bulk: true }, createdById: userId,
          });
        }
      }
    }

    if (action === "transfer") {
      const newTeamId = body.teamId as string;
      for (const id of ticketIds) {
        const { error } = await supabase
          .from("Ticket")
          .update({ assignedTeamId: newTeamId, assigneeId: null, status: "NEW", updatedAt: now })
          .eq("id", id);
        if (!error) {
          updated++;
          await supabase.from("TicketEvent").insert({
            id: randomUUID(), ticketId: id, type: "TICKET_TRANSFERRED",
            payload: { toTeamId: newTeamId, bulk: true }, createdById: userId,
          });
        }
      }
    }

    return NextResponse.json({ updated, total: ticketIds.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
