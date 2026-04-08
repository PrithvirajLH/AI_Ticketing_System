import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";
import { canViewTicket } from "@/lib/auth/access-control";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    // TODO: get from auth session
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? "a89f9497-b330-47ad-9136-65a5e4e5abd8";
    const role = searchParams.get("role") ?? "OWNER";

    // Access control check
    const hasAccess = await canViewTicket({ id: userId, role, primaryTeamId: null }, id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: ticket, error } = await supabase
      .from("Ticket")
      .select(`
        *,
        requester:requesterId ( id, displayName, email, department, role ),
        assignee:assigneeId ( id, displayName, email ),
        assignedTeam:assignedTeamId ( id, name, slug ),
        category:categoryId ( id, name, slug )
      `)
      .eq("id", id)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
