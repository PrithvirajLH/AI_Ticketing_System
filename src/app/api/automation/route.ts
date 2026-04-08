import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import { CreateAutomationRuleSchema, validateBody } from "@/lib/validation/schemas";

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
  const validation = validateBody(CreateAutomationRuleSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { name, description, trigger, conditions, actions, priority, teamId, createdById } = validation.data;
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("AutomationRule")
    .insert({
      id: randomUUID(),
      name,
      description: description ?? null,
      trigger,
      conditions,
      actions,
      isActive: true,
      priority,
      teamId: teamId ?? null,
      createdById,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rule: data }, { status: 201 });
}
