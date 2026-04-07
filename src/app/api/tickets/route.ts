import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export async function GET(request: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const teamId = searchParams.get("teamId");
    const assigneeId = searchParams.get("assigneeId");
    const scope = searchParams.get("scope") ?? "all";
    const search = searchParams.get("q");
    const sort = searchParams.get("sort") ?? "createdAt";
    const order = searchParams.get("order") ?? "desc";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") ?? "20", 10), 100);

    // Hardcoded user for now — replace with auth
    const currentUserId = searchParams.get("userId") ?? "a89f9497-b330-47ad-9136-65a5e4e5abd8";

    let query = supabase
      .from("Ticket")
      .select(
        `
        id, number, displayId, subject, status, priority, channel,
        createdAt, updatedAt, dueAt, firstResponseDueAt, firstResponseAt,
        requesterId, assigneeId, assignedTeamId, categoryId,
        requester:requesterId ( id, displayName, email ),
        assignee:assigneeId ( id, displayName ),
        assignedTeam:assignedTeamId ( id, name, slug ),
        category:categoryId ( id, name )
      `,
        { count: "exact" }
      );

    // Scope filter
    if (scope === "assigned") {
      query = query.eq("assigneeId", currentUserId);
    } else if (scope === "unassigned") {
      query = query.is("assigneeId", null);
    }

    // Field filters
    if (status) {
      const statuses = status.split(",");
      query = query.in("status", statuses);
    }
    if (priority) {
      const priorities = priority.split(",");
      query = query.in("priority", priorities);
    }
    if (teamId) {
      query = query.eq("assignedTeamId", teamId);
    }
    if (assigneeId) {
      query = query.eq("assigneeId", assigneeId);
    }

    // Search
    if (search) {
      query = query.or(
        `subject.ilike.%${search}%,description.ilike.%${search}%,displayId.ilike.%${search}%`
      );
    }

    // Sort
    const ascending = order === "asc";
    query = query.order(sort, { ascending });

    // Pagination
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data: tickets, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      tickets: tickets ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
