import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("AutomationRule")
    .select(`
      id, name, description, trigger, conditions, actions,
      isActive, priority, teamId, createdAt,
      Team:teamId ( name )
    `)
    .order("priority", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rules = (data ?? []).map((r: Record<string, unknown>) => {
    const team = r.Team as { name: string } | null;
    return { ...r, teamName: team?.name ?? "Global", Team: undefined };
  });

  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("AutomationRule")
    .insert({
      id: randomUUID(),
      name: body.name,
      description: body.description ?? null,
      trigger: body.trigger,
      conditions: body.conditions ?? [],
      actions: body.actions ?? [],
      isActive: true,
      priority: body.priority ?? 0,
      teamId: body.teamId ?? null,
      createdById: body.createdById,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rule: data }, { status: 201 });
}
