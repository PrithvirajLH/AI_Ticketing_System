import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("TicketEvent")
      .select(`
        id, type, payload, createdAt,
        createdBy:createdById ( id, displayName )
      `)
      .eq("ticketId", id)
      .order("createdAt", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
