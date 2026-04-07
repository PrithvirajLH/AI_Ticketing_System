import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { createTicket, createSlaInstance } from "@/lib/ai/tools/ticket-tools";
import { routeTicket } from "@/lib/routing/engine";

const SubmitSchema = z.object({
  subject: z.string(),
  description: z.string(),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  channel: z.enum(["PORTAL", "EMAIL"]),
  assignedTeamId: z.string(),
  categoryId: z.string().nullable(),
  displayId: z.string(),
  tags: z.array(z.string()),
  requesterId: z.string(),
  rawText: z.string().optional(),
  aiAnalysis: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid ticket data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { requesterId, rawText, aiAnalysis, ...draft } = parsed.data;

    // Route the ticket
    const routing = await routeTicket({
      subject: draft.subject,
      description: draft.description,
      aiTeamId: draft.assignedTeamId || null,
    });

    draft.assignedTeamId = routing.teamId;

    const ticketResult = await createTicket({
      draft,
      requesterId,
      rawText,
      aiAnalysis: aiAnalysis as Parameters<typeof createTicket>[0]["aiAnalysis"],
    });

    if (!ticketResult.success) {
      return NextResponse.json(
        { error: ticketResult.error },
        { status: 500 }
      );
    }

    const ticket = ticketResult.data;

    // Auto-assign if routing picked someone
    if (routing.assigneeId) {
      const { getSupabase } = await import("@/lib/db/supabase");
      const supabase = getSupabase();
      await supabase
        .from("Ticket")
        .update({
          assigneeId: routing.assigneeId,
          status: "ASSIGNED",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", ticket.id);
    }

    // Create SLA tracking
    await createSlaInstance(ticket.id, draft.priority);

    return NextResponse.json({
      status: "created",
      ticket: {
        id: ticket.id,
        number: ticket.number,
        displayId: ticket.displayId,
        subject: draft.subject,
        priority: draft.priority,
        team: routing.teamName,
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
