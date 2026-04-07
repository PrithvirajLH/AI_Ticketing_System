import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import { notify } from "@/lib/notifications/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const newTeamId = body.teamId as string;
    const userId = body.userId as string;
    const supabase = getSupabase();

    // Get current ticket
    const { data: ticket } = await supabase
      .from("Ticket")
      .select("assignedTeamId")
      .eq("id", id)
      .single();

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const oldTeamId = ticket.assignedTeamId;
    const now = new Date().toISOString();

    // Update ticket
    await supabase
      .from("Ticket")
      .update({
        assignedTeamId: newTeamId,
        assigneeId: null,
        status: "NEW",
        updatedAt: now,
      })
      .eq("id", id);

    // Get team names for the event
    const { data: oldTeam } = oldTeamId
      ? await supabase.from("Team").select("name").eq("id", oldTeamId).single()
      : { data: null };
    const { data: newTeam } = await supabase
      .from("Team").select("name").eq("id", newTeamId).single();

    // Log event
    await supabase.from("TicketEvent").insert({
      id: randomUUID(),
      ticketId: id,
      type: "TICKET_TRANSFERRED",
      payload: {
        fromTeamId: oldTeamId,
        fromTeamName: oldTeam?.name ?? null,
        toTeamId: newTeamId,
        toTeamName: newTeam?.name ?? null,
      },
      createdById: userId,
    });

    // Notify
    notify({
      type: "TICKET_TRANSFERRED",
      ticketId: id,
      actorId: userId,
      title: `Ticket transferred to ${newTeam?.name ?? "another team"}`,
    }).catch(() => {});

    return NextResponse.json({
      teamId: newTeamId,
      teamName: newTeam?.name ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
