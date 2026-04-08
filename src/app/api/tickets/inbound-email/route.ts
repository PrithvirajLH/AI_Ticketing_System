import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import { routeTicket } from "@/lib/routing/engine";
import { createSlaInstance } from "@/lib/ai/tools/ticket-tools";
import { InboundEmailSchema, validateBody } from "@/lib/validation/schemas";

/**
 * POST /api/tickets/inbound-email
 *
 * Public webhook for inbound email processing.
 * Requires x-inbound-email-secret header for auth.
 *
 * Creates a new ticket from an email, or threads a reply to an existing ticket.
 */
export async function POST(request: Request) {
  try {
    // Verify webhook secret
    const secret = request.headers.get("x-inbound-email-secret");
    if (secret !== process.env.INBOUND_EMAIL_SECRET && process.env.INBOUND_EMAIL_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateBody(InboundEmailSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const {
      messageId,
      fromEmail,
      fromName,
      subject,
      textBody,
      inReplyTo,
    } = validation.data;

    const supabase = getSupabase();

    // Idempotency — check if this messageId was already processed
    const { data: existing } = await supabase
      .from("InboundEmailReceipt")
      .select("id")
      .eq("messageId", messageId)
      .single();

    if (existing) {
      return NextResponse.json({ status: "duplicate", message: "Already processed" });
    }

    // Find or create the user
    let { data: user } = await supabase
      .from("User")
      .select("id, displayName")
      .eq("email", fromEmail)
      .single();

    if (!user) {
      const userId = randomUUID();
      const { data: newUser } = await supabase
        .from("User")
        .insert({
          id: userId,
          email: fromEmail,
          displayName: fromName ?? fromEmail.split("@")[0],
          role: "EMPLOYEE",
          updatedAt: new Date().toISOString(),
        })
        .select("id, displayName")
        .single();
      user = newUser;
    }

    if (!user) {
      return NextResponse.json({ error: "Failed to resolve user" }, { status: 500 });
    }

    const now = new Date().toISOString();

    // Check if this is a reply to an existing ticket (via inReplyTo or email threading)
    if (inReplyTo) {
      const { data: thread } = await supabase
        .from("TicketEmailThread")
        .select("ticketId")
        .or(`rootInboundMessageId.eq.${inReplyTo},lastOutboundMessageId.eq.${inReplyTo}`)
        .single();

      if (thread) {
        // Thread reply to existing ticket
        await supabase.from("TicketMessage").insert({
          id: randomUUID(),
          ticketId: thread.ticketId,
          authorId: user.id,
          type: "PUBLIC",
          body: textBody ?? "(no body)",
        });

        // Update thread
        await supabase
          .from("TicketEmailThread")
          .update({ lastInboundMessageId: messageId, lastInboundAt: now, updatedAt: now })
          .eq("ticketId", thread.ticketId);

        // Auto-reopen if resolved/closed
        const { data: ticket } = await supabase
          .from("Ticket")
          .select("status")
          .eq("id", thread.ticketId)
          .single();

        if (ticket && ["RESOLVED", "CLOSED"].includes(ticket.status)) {
          await supabase
            .from("Ticket")
            .update({ status: "REOPENED", resolvedAt: null, closedAt: null, completedAt: null, updatedAt: now })
            .eq("id", thread.ticketId);
        }

        // Log receipt
        await supabase.from("InboundEmailReceipt").insert({
          id: randomUUID(), messageId, fromEmail, subject,
          ticketId: thread.ticketId, threaded: true, updatedAt: now,
        });

        return NextResponse.json({ status: "threaded", ticketId: thread.ticketId });
      }
    }

    // Create new ticket from email
    const ticketId = randomUUID();

    // Route the ticket
    const routing = await routeTicket({
      subject,
      description: textBody ?? "",
    });

    // Generate display ID
    const { data: team } = await supabase.from("Team").select("slug, name").eq("id", routing.teamId).single();
    const SLUG_PREFIX: Record<string, string> = {
      "ai": "AI", "hr": "HR", "it-service-desk": "IT", "medicaid-pending": "MP", "white-gloves": "WG",
    };
    const deptPrefix = SLUG_PREFIX[team?.slug ?? ""] ?? (team?.slug?.toUpperCase() ?? "TK");
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const { count } = await supabase.from("Ticket").select("id", { count: "exact", head: true }).eq("assignedTeamId", routing.teamId).gte("createdAt", startOfDay);
    const displayId = `${deptPrefix}_${dateStr}_${String((count ?? 0) + 1).padStart(3, "0")}`;

    await supabase.from("Ticket").insert({
      id: ticketId,
      subject,
      description: textBody ?? "(no body)",
      priority: "P3",
      channel: "EMAIL",
      requesterId: user.id,
      assignedTeamId: routing.teamId,
      displayId,
      status: "NEW",
      updatedAt: now,
    });

    // Create SLA
    await createSlaInstance(ticketId, "P3");

    // Create email thread
    await supabase.from("TicketEmailThread").insert({
      id: randomUUID(),
      ticketId,
      replyToken: randomUUID().slice(0, 8),
      canonicalSubject: subject.replace(/^(Re|Fwd):\s*/gi, ""),
      rootInboundMessageId: messageId,
      lastInboundMessageId: messageId,
      lastInboundAt: now,
      updatedAt: now,
    });

    // Log receipt
    await supabase.from("InboundEmailReceipt").insert({
      id: randomUUID(), messageId, fromEmail, subject,
      ticketId, threaded: false, updatedAt: now,
    });

    // Log event
    await supabase.from("TicketEvent").insert({
      id: randomUUID(), ticketId, type: "TICKET_CREATED",
      payload: { source: "email", fromEmail }, createdById: user.id,
    });

    return NextResponse.json({ status: "created", ticketId, displayId }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
