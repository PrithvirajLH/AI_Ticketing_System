import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";

/**
 * POST /api/tickets/[id]/csat — submit CSAT rating
 * GET /api/tickets/[id]/csat — get CSAT rating for this ticket
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data } = await supabase
    .from("TicketEvent")
    .select("payload, createdAt")
    .eq("ticketId", id)
    .eq("type", "CSAT_SUBMITTED")
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (!data) return NextResponse.json({ rating: null });

  const payload = data.payload as { rating: number; comment?: string };
  return NextResponse.json({ rating: payload.rating, comment: payload.comment, submittedAt: data.createdAt });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const rating = body.rating as number; // 1-5
  const comment = body.comment as string | undefined;
  const userId = body.userId as string;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const supabase = getSupabase();

  await supabase.from("TicketEvent").insert({
    id: randomUUID(),
    ticketId: id,
    type: "CSAT_SUBMITTED",
    payload: { rating, comment: comment ?? null },
    createdById: userId,
  });

  return NextResponse.json({ submitted: true, rating });
}
