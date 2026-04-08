import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export async function GET() {
  const supabase = getSupabase();

  const { data } = await supabase
    .from("AdminAuditEvent")
    .select("type, actorEmail, actorName, teamName, createdAt, payload")
    .order("createdAt", { ascending: false });

  const rows = (data ?? []).map((e: Record<string, unknown>) => {
    return [
      e.type, e.actorName ?? "", e.actorEmail ?? "", e.teamName ?? "",
      e.createdAt, JSON.stringify(e.payload ?? {}).replace(/"/g, '""'),
    ].join(",");
  });

  const csv = ["Type,ActorName,ActorEmail,Team,CreatedAt,Payload", ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
