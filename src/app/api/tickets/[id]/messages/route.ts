import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";

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
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("TicketMessage")
      .insert({
        id: randomUUID(),
        ticketId: id,
        authorId: body.authorId,
        type: body.type ?? "PUBLIC",
        body: body.body,
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

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
