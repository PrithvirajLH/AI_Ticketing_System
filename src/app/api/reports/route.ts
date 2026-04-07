import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export async function GET() {
  try {
    const supabase = getSupabase();

    // All tickets with key fields
    const { data: tickets } = await supabase
      .from("Ticket")
      .select(`
        id, status, priority, channel, createdAt, resolvedAt, closedAt, completedAt,
        assigneeId, assignedTeamId,
        assignee:assigneeId ( displayName ),
        assignedTeam:assignedTeamId ( name )
      `)
      .order("createdAt", { ascending: true });

    const all = tickets ?? [];

    // ── Ticket Volume (daily, last 30 days) ──
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600000);
    const volumeMap: Record<string, { date: string; created: number; resolved: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 3600000);
      const key = d.toISOString().slice(0, 10);
      volumeMap[key] = { date: key, created: 0, resolved: 0 };
    }
    for (const t of all) {
      const cDate = t.createdAt?.slice(0, 10);
      if (cDate && volumeMap[cDate]) volumeMap[cDate].created++;
      const rDate = (t.resolvedAt ?? t.closedAt)?.slice(0, 10);
      if (rDate && volumeMap[rDate]) volumeMap[rDate].resolved++;
    }
    const ticketVolume = Object.values(volumeMap);

    // ── Resolution Time (hours) ──
    const resolutionTimes: { team: string; avgHours: number; count: number }[] = [];
    const teamResMap: Record<string, { total: number; count: number }> = {};
    for (const t of all) {
      if (!t.resolvedAt || !t.createdAt) continue;
      const hours = (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 3600000;
      const rawTeam = t.assignedTeam as unknown;
      const teamObj = Array.isArray(rawTeam) ? rawTeam[0] : rawTeam;
      const teamName = (teamObj as { name: string } | null)?.name ?? "Unknown";
      if (!teamResMap[teamName]) teamResMap[teamName] = { total: 0, count: 0 };
      teamResMap[teamName].total += hours;
      teamResMap[teamName].count++;
    }
    for (const [team, data] of Object.entries(teamResMap)) {
      resolutionTimes.push({ team, avgHours: Math.round(data.total / data.count), count: data.count });
    }

    // ── SLA Compliance ──
    const { data: slaInstances } = await supabase
      .from("SlaInstance")
      .select("priority, firstResponseBreachedAt, resolutionBreachedAt");

    const slaBuckets: Record<string, { met: number; breached: number }> = {
      P1: { met: 0, breached: 0 }, P2: { met: 0, breached: 0 },
      P3: { met: 0, breached: 0 }, P4: { met: 0, breached: 0 },
    };
    for (const s of slaInstances ?? []) {
      const bucket = slaBuckets[s.priority] ?? { met: 0, breached: 0 };
      if (s.firstResponseBreachedAt || s.resolutionBreachedAt) {
        bucket.breached++;
      } else {
        bucket.met++;
      }
    }
    const slaCompliance = Object.entries(slaBuckets).map(([priority, data]) => ({
      priority, met: data.met, breached: data.breached,
      rate: data.met + data.breached > 0 ? Math.round((data.met / (data.met + data.breached)) * 100) : 100,
    }));

    // ── Agent Performance ──
    const agentMap: Record<string, { name: string; assigned: number; resolved: number; totalHours: number }> = {};
    for (const t of all) {
      if (!t.assigneeId) continue;
      const rawAssignee = t.assignee as unknown;
      const assigneeObj = Array.isArray(rawAssignee) ? rawAssignee[0] : rawAssignee;
      const name = (assigneeObj as { displayName: string } | null)?.displayName ?? "Unknown";
      if (!agentMap[t.assigneeId]) agentMap[t.assigneeId] = { name, assigned: 0, resolved: 0, totalHours: 0 };
      agentMap[t.assigneeId].assigned++;
      if (t.resolvedAt) {
        agentMap[t.assigneeId].resolved++;
        const hours = (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 3600000;
        agentMap[t.assigneeId].totalHours += hours;
      }
    }
    const agentPerformance = Object.values(agentMap).map((a) => ({
      name: a.name,
      assigned: a.assigned,
      resolved: a.resolved,
      avgResolutionHours: a.resolved > 0 ? Math.round(a.totalHours / a.resolved) : null,
      resolveRate: a.assigned > 0 ? Math.round((a.resolved / a.assigned) * 100) : 0,
    }));

    // ── By Channel ──
    const channelCounts: Record<string, number> = {};
    for (const t of all) {
      channelCounts[t.channel] = (channelCounts[t.channel] ?? 0) + 1;
    }
    const byChannel = Object.entries(channelCounts).map(([channel, count]) => ({ channel, count }));

    return NextResponse.json({
      ticketVolume,
      resolutionTimes,
      slaCompliance,
      agentPerformance,
      byChannel,
      totalTickets: all.length,
      openTickets: all.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status)).length,
      resolvedTickets: all.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status)).length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
