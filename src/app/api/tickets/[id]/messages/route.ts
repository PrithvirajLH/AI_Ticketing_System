import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import { CreateMessageSchema, validateBody } from "@/lib/validation/schemas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("TicketMessage")
      .select(`
        id, type, body, createdAt,
        author:authorId ( id, displayName, email, role )
      `)
      .eq("ticketId", id)
      .order("createdAt", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = validateBody(CreateMessageSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("TicketMessage")
      .insert({
        id: randomUUID(),
        ticketId: id,
        authorId: validation.data.authorId,
        type: validation.data.type,
        body: validation.data.body,
      })
      .select(`
        id, type, body, createdAt,
        author:authorId ( id, displayName, email, role )
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log event
    await supabase.from("TicketEvent").insert({
      id: randomUUID(),
      ticketId: id,
      type: "MESSAGE_ADDED",
      payload: { messageType: body.type ?? "PUBLIC" },
      createdById: body.authorId,
    });

    // Track firstResponseAt — set when a non-requester sends first PUBLIC reply
    if ((body.type ?? "PUBLIC") === "PUBLIC") {
      const { data: ticket } = await supabase
        .from("Ticket")
        .select("requesterId, firstResponseAt")
        .eq("id", id)
        .single();

      if (ticket && !ticket.firstResponseAt && ticket.requesterId !== body.authorId) {
        const now = new Date().toISOString();
        await supabase
          .from("Ticket")
          .update({ firstResponseAt: now, updatedAt: now })
          .eq("id", id);
      }
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
