import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";
import { getAccessibleTicketIds } from "@/lib/auth/access-control";

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

    // Get current user — hardcoded for now, replace with auth session
    const currentUserId = searchParams.get("userId") ?? "a89f9497-b330-47ad-9136-65a5e4e5abd8";
    const userRole = searchParams.get("role") ?? "OWNER"; // TODO: get from session

    // Access control — filter tickets based on role
    const accessibleIds = await getAccessibleTicketIds({
      id: currentUserId,
      role: userRole,
      primaryTeamId: null,
    });

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

    // Access control filter
    if (accessibleIds !== "all") {
      if (accessibleIds.length === 0) {
        return NextResponse.json({ tickets: [], total: 0, page, pageSize });
      }
      query = query.in("id", accessibleIds);
    }

    // Scope filter
    if (scope === "assigned") {
      query = query.eq("assigneeId", currentUserId);
    } else if (scope === "unassigned") {
      query = query.is("assigneeId", null);
    } else if (scope === "created") {
      query = query.eq("requesterId", currentUserId);
    } else if (scope === "completed") {
      query = query.in("status", ["RESOLVED", "CLOSED"]);
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
