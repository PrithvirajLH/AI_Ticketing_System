import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { createTicket, createSlaInstance } from "@/lib/ai/tools/ticket-tools";

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

    const { requesterId, ...draft } = parsed.data;

    const ticketResult = await createTicket({ draft, requesterId });
    if (!ticketResult.success) {
      return NextResponse.json(
        { error: ticketResult.error },
        { status: 500 }
      );
    }

    const ticket = ticketResult.data;

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
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
