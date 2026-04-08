import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";
import { processEmailOutbox } from "@/lib/notifications/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("Notification")
    .select(`
      id, type, title, body, ticketId, isRead, createdAt,
      actor:actorId ( displayName )
    `)
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unreadCount = (data ?? []).filter((n: { isRead: boolean }) => !n.isRead).length;

  return NextResponse.json({ notifications: data ?? [], unreadCount });
}

export async function POST() {
  try {
    const result = await processEmailOutbox();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const supabase = getSupabase();
  const now = new Date().toISOString();

  if (action === "read") {
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await supabase.from("Notification").update({ isRead: true, readAt: now }).eq("id", id);
    return NextResponse.json({ updated: true });
  }

  if (action === "readAll") {
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    await supabase.from("Notification").update({ isRead: true, readAt: now }).eq("userId", userId).eq("isRead", false);
    return NextResponse.json({ updated: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
