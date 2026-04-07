import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? "";
  const supabase = getSupabase();

  const [all, assigned, unassigned, urgent] = await Promise.all([
    supabase.from("Ticket").select("id", { count: "exact", head: true }).not("status", "in", '("RESOLVED","CLOSED")'),
    supabase.from("Ticket").select("id", { count: "exact", head: true }).eq("assigneeId", userId).not("status", "in", '("RESOLVED","CLOSED")'),
    supabase.from("Ticket").select("id", { count: "exact", head: true }).is("assigneeId", null).not("status", "in", '("RESOLVED","CLOSED")'),
    supabase.from("Ticket").select("id", { count: "exact", head: true }).eq("priority", "P1").not("status", "in", '("RESOLVED","CLOSED")'),
  ]);

  return NextResponse.json({
    all: all.count ?? 0,
    assigned: assigned.count ?? 0,
    unassigned: unassigned.count ?? 0,
    urgent: urgent.count ?? 0,
  });
}
