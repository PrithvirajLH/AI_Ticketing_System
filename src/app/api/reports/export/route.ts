import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export async function GET() {
  const supabase = getSupabase();

  const { data: tickets } = await supabase
    .from("Ticket")
    .select(`
      number, displayId, subject, status, priority, channel, createdAt, resolvedAt,
      requester:requesterId ( displayName ),
      assignee:assigneeId ( displayName ),
      assignedTeam:assignedTeamId ( name )
    `)
    .order("createdAt", { ascending: false });

  const rows = (tickets ?? []).map((t: Record<string, unknown>) => {
    const req = t.requester as { displayName: string } | null;
    const assignee = t.assignee as { displayName: string } | null;
    const team = t.assignedTeam as { name: string } | null;
    return [
      t.number, t.displayId, `"${(t.subject as string).replace(/"/g, '""')}"`,
      t.status, t.priority, t.channel,
      team?.name ?? "", req?.displayName ?? "", assignee?.displayName ?? "",
      t.createdAt, t.resolvedAt ?? "",
    ].join(",");
  });

  const csv = ["Number,DisplayID,Subject,Status,Priority,Channel,Team,Requester,Assignee,Created,Resolved", ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="tickets-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
