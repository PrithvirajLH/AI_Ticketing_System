import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export async function GET() {
  try {
    const supabase = getSupabase();

    // Run all queries in parallel
    const [
      allTickets,
      openTickets,
      resolvedTickets,
      teamBreakdown,
      priorityBreakdown,
      statusBreakdown,
      recentTickets,
    ] = await Promise.all([
      // Total count
      supabase.from("Ticket").select("id", { count: "exact", head: true }),

      // Open (not resolved/closed)
      supabase
        .from("Ticket")
        .select("id", { count: "exact", head: true })
        .not("status", "in", '("RESOLVED","CLOSED")'),

      // Resolved + Closed
      supabase
        .from("Ticket")
        .select("id", { count: "exact", head: true })
        .in("status", ["RESOLVED", "CLOSED"]),

      // By team
      supabase
        .from("Ticket")
        .select("assignedTeamId, assignedTeam:assignedTeamId ( name )")
        .not("status", "in", '("RESOLVED","CLOSED")'),

      // By priority
      supabase
        .from("Ticket")
        .select("priority")
        .not("status", "in", '("RESOLVED","CLOSED")'),

      // By status
      supabase.from("Ticket").select("status"),

      // Recent 5
      supabase
        .from("Ticket")
        .select(`
          id, number, displayId, subject, status, priority, createdAt,
          assignedTeam:assignedTeamId ( name ),
          requester:requesterId ( displayName )
        `)
        .order("createdAt", { ascending: false })
        .limit(5),
    ]);

    // Count new tickets (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: newToday } = await supabase
      .from("Ticket")
      .select("id", { count: "exact", head: true })
      .gte("createdAt", yesterday);

    // Count unassigned
    const { count: unassigned } = await supabase
      .from("Ticket")
      .select("id", { count: "exact", head: true })
      .is("assigneeId", null)
      .not("status", "in", '("RESOLVED","CLOSED")');

    // Build team workload
    const teamCounts: Record<string, { name: string; count: number }> = {};
    for (const t of teamBreakdown.data ?? []) {
      const raw = t.assignedTeam as unknown;
      const team = Array.isArray(raw) ? raw[0] : raw;
      const name = (team as { name: string } | null)?.name ?? "Unassigned";
      if (!teamCounts[name]) teamCounts[name] = { name, count: 0 };
      teamCounts[name].count++;
    }

    // Build priority breakdown
    const priorityCounts: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0 };
    for (const t of priorityBreakdown.data ?? []) {
      priorityCounts[t.priority] = (priorityCounts[t.priority] ?? 0) + 1;
    }

    // Build status breakdown
    const statusCounts: Record<string, number> = {};
    for (const t of statusBreakdown.data ?? []) {
      statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1;
    }

    return NextResponse.json({
      kpis: {
        total: allTickets.count ?? 0,
        open: openTickets.count ?? 0,
        resolved: resolvedTickets.count ?? 0,
        newToday: newToday ?? 0,
        unassigned: unassigned ?? 0,
      },
      teamWorkload: Object.values(teamCounts).sort((a, b) => b.count - a.count),
      priorityBreakdown: Object.entries(priorityCounts).map(([priority, count]) => ({
        priority,
        count,
      })),
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      })),
      recentTickets: recentTickets.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
