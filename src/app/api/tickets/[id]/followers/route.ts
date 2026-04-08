import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";

// GET — list followers
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("TicketFollower")
    .select(`
      id, createdAt,
      user:userId ( id, displayName, email )
    `)
    .eq("ticketId", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const followers = (data ?? []).map((f: Record<string, unknown>) => {
    const user = f.user as { id: string; displayName: string } | null;
    return { id: f.id, userId: user?.id, displayName: user?.displayName, createdAt: f.createdAt };
  });

  return NextResponse.json({ followers });
}

// POST — follow/unfollow (toggle)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const userId = body.userId as string;
  const supabase = getSupabase();

  // Check if already following
  const { data: existing } = await supabase
    .from("TicketFollower")
    .select("id")
    .eq("ticketId", id)
    .eq("userId", userId)
    .single();

  if (existing) {
    // Unfollow
    await supabase.from("TicketFollower").delete().eq("id", existing.id);
    return NextResponse.json({ following: false });
  }

  // Follow
  await supabase.from("TicketFollower").insert({
    id: randomUUID(),
    ticketId: id,
    userId,
  });

  return NextResponse.json({ following: true });
}
