import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") ?? "50", 10), 100);
  const type = searchParams.get("type");
  const supabase = getSupabase();

  let query = supabase
    .from("AdminAuditEvent")
    .select("id, type, payload, actorEmail, actorName, teamName, createdAt", { count: "exact" })
    .order("createdAt", { ascending: false });

  if (type) query = query.eq("type", type);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ events: data ?? [], total: count ?? 0, page, pageSize });
}
