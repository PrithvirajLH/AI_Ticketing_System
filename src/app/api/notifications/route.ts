import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";
import { processEmailOutbox } from "@/lib/notifications/service";

/**
 * GET /api/notifications?userId=xxx
 * Returns in-app notifications for a user.
 */
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

/**
 * POST /api/notifications/process
 * Processes pending email outbox. Call via cron.
 */
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
