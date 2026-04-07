import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("TeamMember")
      .select(`
        id, role,
        user:userId ( id, displayName, email )
      `)
      .eq("teamId", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const members = (data ?? []).map((m: Record<string, unknown>) => {
      const user = m.user as { id: string; displayName: string; email: string } | null;
      return {
        id: user?.id ?? "",
        displayName: user?.displayName ?? "Unknown",
        email: user?.email ?? "",
        role: m.role,
      };
    });

    return NextResponse.json({ members });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
