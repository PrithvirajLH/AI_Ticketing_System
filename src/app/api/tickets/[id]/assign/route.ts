import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import { AssignTicketSchema, validateBody } from "@/lib/validation/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(AssignTicketSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { assigneeId, userId } = validation.data;
    const supabase = getSupabase();

    const now = new Date().toISOString();

    const update: Record<string, unknown> = {
      assigneeId,
      updatedAt: now,
    };

    // Auto-transition to ASSIGNED if currently NEW or TRIAGED
    const { data: ticket } = await supabase
      .from("Ticket")
      .select("status")
      .eq("id", id)
      .single();

    if (ticket && assigneeId && ["NEW", "TRIAGED"].includes(ticket.status)) {
      update.status = "ASSIGNED";
    }

    const { error } = await supabase
      .from("Ticket")
      .update(update)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log event
    await supabase.from("TicketEvent").insert({
      id: randomUUID(),
      ticketId: id,
      type: assigneeId ? "TICKET_ASSIGNED" : "TICKET_UNASSIGNED",
      payload: { assigneeId },
      createdById: userId,
    });

    return NextResponse.json({ assigneeId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
