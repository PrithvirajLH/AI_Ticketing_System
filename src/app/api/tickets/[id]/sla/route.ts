import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    // Get the SLA instance for this ticket
    const { data: slaInstance } = await supabase
      .from("SlaInstance")
      .select("firstResponseDueAt, resolutionDueAt, firstResponseBreachedAt, resolutionBreachedAt, priority")
      .eq("ticketId", id)
      .order("createdAt", { ascending: false })
      .limit(1)
      .single();

    // Get ticket dates
    const { data: ticket } = await supabase
      .from("Ticket")
      .select("firstResponseAt, resolvedAt")
      .eq("id", id)
      .single();

    if (!slaInstance) {
      return NextResponse.json({ sla: null });
    }

    return NextResponse.json({
      sla: {
        firstResponseDueAt: slaInstance.firstResponseDueAt,
        firstResponseAt: ticket?.firstResponseAt ?? null,
        firstResponseBreachedAt: slaInstance.firstResponseBreachedAt,
        resolutionDueAt: slaInstance.resolutionDueAt,
        resolvedAt: ticket?.resolvedAt ?? null,
        resolutionBreachedAt: slaInstance.resolutionBreachedAt,
        priority: slaInstance.priority,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
