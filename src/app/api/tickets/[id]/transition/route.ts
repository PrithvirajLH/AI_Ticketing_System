import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["TRIAGED", "ASSIGNED"],
  TRIAGED: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS", "WAITING_ON_REQUESTER", "WAITING_ON_VENDOR", "RESOLVED"],
  IN_PROGRESS: ["WAITING_ON_REQUESTER", "WAITING_ON_VENDOR", "RESOLVED"],
  WAITING_ON_REQUESTER: ["IN_PROGRESS", "WAITING_ON_VENDOR", "RESOLVED"],
  WAITING_ON_VENDOR: ["IN_PROGRESS", "WAITING_ON_REQUESTER", "RESOLVED"],
  RESOLVED: ["REOPENED", "CLOSED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["TRIAGED", "ASSIGNED", "IN_PROGRESS", "WAITING_ON_REQUESTER", "WAITING_ON_VENDOR", "RESOLVED"],
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const newStatus = body.status as string;
    const userId = body.userId as string;
    const supabase = getSupabase();

    // Get current ticket
    const { data: ticket, error: fetchErr } = await supabase
      .from("Ticket")
      .select("id, status, assigneeId")
      .eq("id", id)
      .single();

    if (fetchErr || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Validate transition
    const allowed = STATUS_TRANSITIONS[ticket.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${ticket.status} to ${newStatus}. Allowed: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    // Require assignee for certain statuses
    if (["IN_PROGRESS", "ASSIGNED", "RESOLVED"].includes(newStatus) && !ticket.assigneeId) {
      return NextResponse.json(
        { error: `Cannot set status to ${newStatus} without an assignee` },
        { status: 400 }
      );
    }

    // Build update
    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      status: newStatus,
      updatedAt: now,
    };

    if (newStatus === "RESOLVED") {
      update.resolvedAt = now;
      update.completedAt = now;
    } else if (newStatus === "CLOSED") {
      update.closedAt = now;
    } else if (newStatus === "REOPENED") {
      update.resolvedAt = null;
      update.completedAt = null;
      update.closedAt = null;
    }

    // SLA pause/resume
    if (newStatus === "WAITING_ON_REQUESTER" || newStatus === "WAITING_ON_VENDOR") {
      update.slaPausedAt = now;
    } else if (ticket.status === "WAITING_ON_REQUESTER" || ticket.status === "WAITING_ON_VENDOR") {
      update.slaPausedAt = null;
    }

    const { error: updateErr } = await supabase
      .from("Ticket")
      .update(update)
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Log event
    await supabase.from("TicketEvent").insert({
      id: randomUUID(),
      ticketId: id,
      type: "STATUS_CHANGED",
      payload: { from: ticket.status, to: newStatus },
      createdById: userId,
    });

    return NextResponse.json({ status: newStatus });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
