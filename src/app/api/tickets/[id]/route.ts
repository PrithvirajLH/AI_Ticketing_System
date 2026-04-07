import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

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
